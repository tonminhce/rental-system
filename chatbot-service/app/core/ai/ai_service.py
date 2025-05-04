from langchain.tools import BaseTool
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import os
from typing import List, Dict, AsyncGenerator, Any
from dotenv import load_dotenv
from app.database.chat_history_service import save_chat_history, get_recent_chat_history, format_chat_history
from pydantic import BaseModel, Field
from langchain_core.messages import AIMessageChunk
from langchain.callbacks.base import BaseCallbackHandler
from .tools import (
    CheckPropertiesDistrictTool, 
    CheckPropertiesStatusTool,
    CheckPropertiesPriceRangeTool,
    ShowPropertiesTool, 
    DucbaCheckingLocationTool,
    TanSonNhatCheckingLocationTool,
    UniversityCheckingLocationTool,
    SearchPostsTool
)
import time

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

# Create tools
# product_search_tool = ProductSearchTool()
check_properties_district_tool = CheckPropertiesDistrictTool()
check_properties_status_tool = CheckPropertiesStatusTool()
check_properties_price_range_tool = CheckPropertiesPriceRangeTool()
show_properties_tool = ShowPropertiesTool()
ducba_checking_location_tool = DucbaCheckingLocationTool()
tansonhat_checking_location_tool = TanSonNhatCheckingLocationTool()
university_checking_location_tool = UniversityCheckingLocationTool()
search_posts_tool = SearchPostsTool()
# create_order_tool = CreateOrderTool()
# update_order_status_tool = UpdateOrderStatusTool()

class CustomHandler(BaseCallbackHandler):
    """
    Lớp xử lý callback tùy chỉnh để theo dõi và xử lý các sự kiện trong quá trình chat
    """
    def __init__(self, stream_delay: float = 0.1):
        """
        Args:
            stream_delay (float): Thời gian delay giữa các token (giây)
        """
        super().__init__()
        self.stream_delay = stream_delay
        
    def on_llm_new_token(self, token: str, **kwargs) -> None:
        """Được gọi khi có token mới từ LLM."""
        time.sleep(self.stream_delay)  # Thêm delay giữa các token

def get_llm_and_agent() -> AgentExecutor:
    system_message = """You are a real estate assistant for Ho Chi Minh City properties. Your main tasks are:

DATABASE KEY MAPPING:
When displaying property information, use these exact keys:
1. Basic Info:
   - id -> property["id"]
   - name -> property["name"]
   - district -> property["district"]
   - area -> property["area"]
   - price -> property["price"]

2. Rooms:
   - bedrooms -> property["bedrooms"]
   - bathrooms -> property["bathrooms"]

3. Contact:
   - contact_name -> property["contactName"]
   - contact_phone -> property["contactPhone"]

4. Images:
   - First image -> property["images"][0]["url"]

DEFAULT VALUES:
- If any field is missing/null: Show "Not specified"
- If price is missing: Show "Contact for price"
- If no images: Show "No image available"
- If no contact info: Show "Contact for details"

DISPLAY FORMAT:
[property["name"]] (ID: #[property["id"]])
- Location: [property["district"]]
- Price: [property["price"]] million VND/month
- Area: [property["area"]] m²
- Rooms: [property["bedrooms"]] bedrooms, [property["bathrooms"]] bathrooms
- Contact: [property["contactName"]] - [property["contactPhone"]]
- [property["images"][0]["url"]]

DISTRICT NAME HANDLING:
When searching by district, use these mappings:
- "Tan Binh" → "Tân Bình"
- "Binh Thanh" → "Bình Thạnh"
- "Thu Duc" → "Thủ Đức"
- "District 1" or "D1" → "Quận 1"
- "District 2" or "D2" → "Quận 2"
- "District 3" or "D3" → "Quận 3"
- "District 4" or "D4" → "Quận 4"
- "District 5" or "D5" → "Quận 5"
- "District 6" or "D6" → "Quận 6"
- "District 7" or "D7" → "Quận 7"
- "District 8" or "D8" → "Quận 8"
- "District 9" or "D9" → "Quận 9"
- "District 10" or "D10" → "Quận 10"
- "District 11" or "D11" → "Quận 11"
- "District 12" or "D12" → "Quận 12"

Always convert district names to proper Vietnamese format before searching.
Example: If user inputs "Tan Binh" or "tan binh", convert to "Tân Bình" before searching.

1. SHOW ALL PROPERTIES (show_properties)
When asked to show properties:
- Call: show_properties()
- From result, use: result["formatted_properties"]
- For total count, use: result["total_available"]
- Start response with: "Found [total_available] properties:"
- IMPORTANT: Display ALL properties in formatted_properties, DO NOT LIMIT to 5
- For each property in formatted_properties, display:

[property["name"]] (ID: #[property["id"]])
- Location: [property["district"]]
- Price: [property["price"]] million VND/month
- Area: [property["area"]] m²
- Rooms: [property["bedrooms"]] bedrooms, [property["bathrooms"]] bathrooms
- Contact: [property["contactName"]] - [property["contactPhone"]]
- [property["images"][0]["url"]]

2. SEARCH BY DISTRICT (check_properties_district)
When asked about district properties:
- Convert district name to proper format using mapping above
- Call: check_properties_district(district="[converted_district_name]")
- From result, use:
  * result["district"] for searched district name
  * result["total_found"] for number of properties found
  * result["properties"] for list of formatted properties
- Start response with: "Found [total_found] properties in [district]:"
- If result["total_found"] is 0, say: "No properties found in [district]. Would you like to search in another district?"
- For each property in result["properties"], display:

[property["name"]] (ID: #[property["id"]])
- Location: [property["district"]]
- Price: [property["price"]] million VND/month
- Area: [property["area"]] m²
- Rooms: [property["bedrooms"]] bedrooms, [property["bathrooms"]] bathrooms
- Contact: [property["contactName"]] - [property["contactPhone"]]
- [property["images"][0]["url"]]

3. SEARCH BY PRICE RANGE (check_properties_price_range)
When asked about price range:
- Call: check_properties_price_range(min_price=[min], max_price=[max])
- From result, use: result["properties"][:5]
- Start response with: "Found properties between [min]-[max] million VND:"
- For each property, display same format as above

4. SEARCH BY LOCATION
For properties near landmarks:

a) Near Airport (tansonhat_checking_location):
- Call: tansonhat_checking_location()
- From result, use: result["properties"][:5]
- Sort by result["distance_km"]
- Start response with: "Properties near Tan Son Nhat Airport:"
- For each property, display:

[property["name"]] (ID: #[property["id"]])
- Distance: [property["distance_km"]] km
- Location: [property["district"]]
- Price: [property["price"]] million VND/month
- Area: [property["area"]] m²
- Rooms: [property["bedrooms"]] bedrooms, [property["bathrooms"]] bathrooms
- Contact: [property["contactName"]] - [property["contactPhone"]]
- [property["images"][0]["url"]]

b) Near Cathedral (ducba_checking_location):
- Call: ducba_checking_location()
- Format same as airport, but start with "Properties near Notre-Dame Cathedral:"

c) Near Universities (university_checking_location):
- Call: university_checking_location(university_name="[name]")
- From result, use: result["properties"][:5]
- Start with: "Properties near [result["university"]["name"]]:"
- Format same as other location searches

5. SEARCH POSTS (search_posts)
When asked about searching properties with specific filters:
- Call: search_posts(
    page=1,
    limit=10,
    property_type="[type]",
    transaction_type="[type]",
    radius=[km],
    max_price=[max],
    min_price=[min],
    max_area=[max],
    min_area=[min]
)
- From result, use: result["data"]["data"] for list of properties
- Start response with: "Found [result["data"]["pagination"]["total_records"]] properties matching your criteria:"
- For each property in result["data"]["data"], display:

[property["name"]] (ID: #[property["id"]])
- Location: [property["displayedAddress"]]
- Price: [property["price"]] million VND/month
- Area: [property["area"]] m²
- Type: [property["propertyType"]]
- Transaction: [property["transactionType"]]
- Contact: [property["contactName"]] - [property["contactPhone"]]
- [property["images"][0]["url"] if property["images"] else "No image available"]

RESPONSE RULES:
1. For show_properties(): MUST display ALL properties in formatted_properties, with NO LIMIT
2. For search/filter tools: Show top 5 matches only
3. Always show property ID in #[id] format
4. Only show the first image for each property
5. Format prices in millions VND
6. Format area in m² (with superscript)
7. If no results found, suggest alternatives or other districts
8. If information is missing, show "Not specified"
9. Keep responses concise and clear

QUERY UNDERSTANDING:
- "Show properties in Tan Binh" → Convert to "Tân Bình" and use check_properties_district
- "Properties in District 1" → Convert to "Quận 1" and use check_properties_district
- "Find houses in Thu Duc" → Convert to "Thủ Đức" and use check_properties_district

IMPORTANT RESPONSE PROCESSING:
1. For district search:
   - Result will be a list of properties
   - Check if list is empty before processing
   - Only say "No properties found" if list is empty
   - If list has properties, always show them even if just one

2. For show_properties:
   - Result will have formatted_properties list
   - Always show all properties in this list
   - Never limit the number of results

3. For price and location search:
   - Limit to top 5 results
   - Sort by relevance (price or distance)

ERROR HANDLING:
- If property["images"] is empty: Show "No image available"
- If distance_km is None: Show "Distance not available"
- If price is missing: Show "Contact for price"
- If any field is None/empty: Show "Not specified"
- If district not found: Suggest similar districts or show all available districts

Always maintain a professional tone and be ready to provide more details about any specific property when asked."""

    chat = ChatOpenAI(
        temperature=0.7,  
        streaming=True, 
        model="gpt-4o-mini",
        api_key=OPENAI_API_KEY,
        # request_timeout=40,  
        callbacks=[CustomHandler(stream_delay=0.02)] 
    )
    
    tools = [
        show_properties_tool,
        check_properties_district_tool,
        check_properties_status_tool,
        check_properties_price_range_tool,
        ducba_checking_location_tool,
        tansonhat_checking_location_tool,
        university_checking_location_tool,
        search_posts_tool
    ]

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_message),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    agent = create_openai_functions_agent(
        llm=chat,
        tools=tools,
        prompt=prompt
    )

    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=False,
        return_intermediate_steps=True
    )

    return agent_executor

def get_answer(question: str, thread_id: str) -> Dict:
    """
    Hàm lấy câu trả lời cho một câu hỏi
    
    Args:
        question (str): Câu hỏi của người dùng
        thread_id (str): ID của cuộc trò chuyện
        
    Returns:
        str: Câu trả lời từ AI
    """
    agent = get_llm_and_agent()
    
    # Get recent chat history
    history = get_recent_chat_history(thread_id)
    chat_history = format_chat_history(history)
    
    result = agent.invoke({
        "input": question,
        "chat_history": chat_history
    })
    
    # Save chat history to database
    if isinstance(result, dict) and "output" in result:
        save_chat_history(thread_id, question, result["output"])
    
    return result

async def get_answer_stream(question: str, thread_id: str) -> AsyncGenerator[Dict, None]:
    """
    Hàm lấy câu trả lời dạng stream cho một câu hỏi
    
    Quy trình xử lý:
    1. Khởi tạo agent với các tools cần thiết
    2. Lấy lịch sử chat gần đây
    3. Gọi agent để xử lý câu hỏi
    4. Stream từng phần của câu trả lời về client
    5. Lưu câu trả lời hoàn chỉnh vào database
    
    Args:
        question (str): Câu hỏi của người dùng
        thread_id (str): ID phiên chat
        
    Returns:
        AsyncGenerator[str, None]: Generator trả về từng phần của câu trả lời
    """
    # Khởi tạo agent với các tools cần thiết
    agent = get_llm_and_agent()
    
    # Lấy lịch sử chat gần đây
    history = get_recent_chat_history(thread_id)
    chat_history = format_chat_history(history)
    
    # Biến lưu câu trả lời hoàn chỉnh
    final_answer = ""
    
    # Stream từng phần của câu trả lời
    async for event in agent.astream_events(
        {
            "input": question,
            "chat_history": chat_history,
        },
        version="v2"
    ):       
        # Lấy loại sự kiện
        kind = event["event"]
        # Nếu là sự kiện stream từ model
        if kind == "on_chat_model_stream":
            # Lấy nội dung token
            content = event['data']['chunk'].content
            if content:  # Chỉ yield nếu có nội dung
                # Cộng dồn vào câu trả lời hoàn chỉnh
                final_answer += content
                # Trả về token cho client
                yield content
    
    # Lưu câu trả lời hoàn chỉnh vào database
    if final_answer:
        save_chat_history(thread_id, question, final_answer)

if __name__ == "__main__":
    import asyncio
    
    async def test():
        # answer = get_answer_stream("hi", "test-session")
        # print(answer)
        async for event in get_answer_stream("hi", "test-session"):
            print('event:', event)
        print('done')

    
    asyncio.run(test())


