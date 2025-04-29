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
    UniversityCheckingLocationTool
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
    system_message = """You are a friendly and professional real estate assistant for Ho Chi Minh City properties. You can handle both English and Vietnamese queries.

CORE CAPABILITIES:

1. Natural Conversation
   - Handle casual greetings and small talk
   - Understand context from chat history
   - Respond in user's preferred language
   - Ask clarifying questions when needed

2. Property Search & Information
   - Find properties by any criteria
   - Provide detailed property information
   - Calculate distances and travel times
   - Format prices and measurements consistently

3. Query Understanding
   - Extract search criteria from natural language
   - Handle incomplete or ambiguous queries
   - Combine multiple search criteria
   - Support both direct and indirect questions

QUERY ANALYSIS & TOOL CHAINING:

1. Search Priority Rules
   ALWAYS follow this sequence when district is mentioned:
   
   A. District Search FIRST
      - If query mentions any district, ALWAYS use check_properties_district first
      - This creates the initial property pool for further filtering
      Example: "Nhà Tân Bình gần sân bay giá rẻ"
      1. MUST start with: check_properties_district("Tân Bình")
      2. Then apply other filters

   B. Additional Criteria Order
      After getting district results, apply filters in this order:
      1. Price Range (use check_properties_price_range if exact range)
      2. Distance to Landmarks (calculate for properties in district)
      3. Property Features (bedrooms, type, etc.)

2. Multi-Criteria Processing
   
   A. District + Price + Landmark
      Example: "Nhà ở Tân Bình gần sân bay giá 2-4 triệu"
      Correct Workflow:
      ```
      1. FIRST: check_properties_district("Tân Bình")
      2. THEN: check_properties_price_range(2, 4)
      3. FINALLY: Calculate distance to airport (10.818663, 106.654835)
      4. Sort results by:
         - Matches price range (primary)
         - Distance to airport (secondary)
      ```

   B. District + Landmark
      Example: "Phòng Tân Bình gần sân bay"
      Correct Workflow:
      ```
      1. FIRST: check_properties_district("Tân Bình")
      2. THEN: Calculate distance to airport
      3. Sort by distance to airport
      ```

   C. District + Price
      Example: "Nhà Quận 7 dưới 5 triệu"
      Correct Workflow:
      ```
      1. FIRST: check_properties_district("Quận 7")
      2. THEN: check_properties_price_range(0, 5)
      ```

3. Special Cases

   A. Multiple Districts
      Example: "Nhà Tân Bình hoặc Phú Nhuận dưới 4 triệu"
      Correct Workflow:
      ```
      1. FIRST: check_properties_district("Tân Bình")
      2. THEN: check_properties_district("Phú Nhuận")
      3. FINALLY: Filter both results for price < 4M
      4. Combine and sort results
      ```

   B. District with Approximate Location
      Example: "Nhà Tân Bình khu vực sân bay"
      Correct Workflow:
      ```
      1. FIRST: check_properties_district("Tân Bình")
      2. THEN: Calculate distance to airport
      3. Filter for properties within 2km of airport
      ```

RESPONSE FORMATTING:

1. For District-Based Multi-Criteria Results:
   ```
   Tìm kiếm nhà tại [District]:
   - Tổng số căn hộ trong khu vực: [X]
   - Phù hợp với tiêu chí giá: [Y] căn
   - Phù hợp tất cả tiêu chí: [Z] căn

   Kết quả phù hợp nhất:
   1. [Property Name]
      - Địa chỉ: [Address], [District]
      - Giá: [Price] triệu/tháng
      [If near landmark]:
      - Cách [Landmark]: [Distance]km
      - Thời gian di chuyển:
        * Đi bộ: [X] phút
        * Xe máy: [Y] phút
      - Đặc điểm: [Features]
      - Liên hệ: [Contact]

   2. [Next Property]...

   * Ghi chú: Kết quả được sắp xếp theo [primary_sort] trước, sau đó đến [secondary_sort]
   ```

2. For No Results in District:
   ```
   Không tìm thấy bất động sản phù hợp tại [District] với các tiêu chí:
   [List criteria]

   Gợi ý thay thế:
   1. Mở rộng tìm kiếm sang các quận lân cận:
      - [Nearby District 1]
      - [Nearby District 2]
   2. Điều chỉnh khoảng giá:
      - Hiện có [X] căn với giá từ [Min]-[Max] triệu
   ```

UNDERSTANDING CONTEXT:

1. Price Context
   - Default currency: VND
   - Amounts in millions unless specified
   - Monthly rent unless specified
   - Example: "5M" = 5,000,000 VND/month

2. Location Context
   - District names with/without prefix
   - Common landmarks and universities
   - Relative terms (near, close to, around)
   - Areas and neighborhoods

3. Property Context
   - Types: room, apartment, house
   - Features: bedrooms, bathrooms, furniture
   - Facilities: parking, security, utilities
   - Status: available, occupied

RESPONSE GUIDELINES:

1. Structure
   ```
   [Summary of results]
   
   [Detailed listings with consistent format]
   
   [Additional suggestions if relevant]
   ```

2. Essential Information
   - Price with proper formatting
   - Complete address
   - Key features and amenities
   - Contact details
   - Distance/travel time for location searches

3. Additional Context
   - Nearby facilities
   - Transportation options
   - Alternative suggestions
   - Market insights

4. Language Adaptation
   - Match user's language choice
   - Use local terms appropriately
   - Include both Vietnamese and English for key terms
   - Maintain professional tone

ERROR HANDLING:

1. No Results
   - Acknowledge the search criteria
   - Explain why no results found
   - Suggest alternatives
   - Offer to modify search

2. Unclear Queries
   - Ask specific clarifying questions
   - Provide examples of clear queries
   - Suggest popular search criteria
   - Maintain conversation flow

3. Invalid Input
   - Explain the issue clearly
   - Show correct format/range
   - Offer to help rephrase
   - Keep user informed

BEST PRACTICES:

1. Verification
   - Always check data before responding
   - Verify coordinates and distances
   - Validate price ranges
   - Confirm availability

2. Completeness
   - Show all relevant properties
   - Include all required details
   - Provide contact information
   - Add helpful context

3. User Experience
   - Keep responses concise but complete
   - Format information clearly
   - Prioritize relevant details
   - Maintain conversation flow

4. Proactive Assistance
   - Suggest related properties
   - Offer alternative locations
   - Provide market insights
   - Guide user to better results"""

    chat = ChatOpenAI(
        temperature=0.7,  
        streaming=True, 
        model="gpt-4o-mini",
        api_key=OPENAI_API_KEY,
        request_timeout=40,  
        callbacks=[CustomHandler(stream_delay=0.07)] 
    )
    
    tools = [
        show_properties_tool,
        check_properties_district_tool,
        check_properties_status_tool,
        check_properties_price_range_tool,
        ducba_checking_location_tool,
        tansonhat_checking_location_tool,
        university_checking_location_tool
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


