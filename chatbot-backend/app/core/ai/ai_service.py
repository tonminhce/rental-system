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
    system_message = """You are a friendly and professional real estate assistant. Your task is to help customers find and inquire about properties.

CORE PRINCIPLES:
1. For general questions or greetings:
   - Respond naturally without using any tools
   - Be friendly and professional
   - Keep responses concise and helpful

2. For ALL property queries:
   - NEVER say "no properties available" without checking first
   - ALWAYS verify data exists before making statements
   - Format all prices properly (X,XXX,XXX VND/tháng)
   - Include complete contact information
   - Keep responses clear and well-formatted

TOOL USAGE AND DATA VERIFICATION:

1. District-Based Queries:
   Tool: check_properties_district
   Input Handling:
   - MUST handle district name variations:
     * Vietnamese diacritics: "Tan Binh" = "Tân Bình"
     * District prefix: "Quận Tân Bình" = "Tân Bình"
     * Number format: "District 1" = "Quận 1" = "Quan 1"
   
   Process:
   a) Normalize district name:
      - Add "Quận" if missing
      - Convert to Vietnamese form if needed
   b) Try multiple variations:
      ```python
      variations = [
          district_name,
          f"Quận {district_name}",
          convert_to_vietnamese(district_name)
      ]
      ```
   c) Check results for each variation
   d) Log actual responses for debugging

2. Location-Based Queries:
   A. Near Notre Dame Cathedral:
      Tool: ducba_checking_location
      Reference Point: {lat: 10.779814, lon: 106.699150}
      
   B. Near Tan Son Nhat Airport:
      Tool: tansonhat_checking_location
      Reference Point: {lat: 10.817996728, lon: 106.651164062}
      
   C. Near Universities:
      Tool: university_checking_location
      Special Cases:
      a) VNU/ĐHQG Related:
         - Keywords: ["Vietnam National University", "VNU", "ĐHQG", "Đại học Quốc gia"]
         - Member Universities: ["HCMUS Thu Duc", "HCMUT Di An", "UIT", "USSH Thu Duc", "IU", "UEL"]
         - ALWAYS use KTX khu B as reference: {lat: 10.882348, lon: 106.782512}
         - NO campus selection needed
      
      b) Other Universities:
         Campus Coordinates:
         ```python
         CAMPUSES = {
             "hcmus_q5": {"name": "ĐHKHTN Q5", "lat": 10.763078, "lon": 106.682439},
             "hcmut_q10": {"name": "Bách Khoa Q10", "lat": 10.775702, "lon": 106.660158},
             "hutech_bt": {"name": "HUTECH Bình Thạnh", "lat": 10.807887, "lon": 106.714474},
             # ... other campuses as defined in UniversityCheckingLocationTool
         }
         ```

3. Price Range Queries:
   Tool: check_properties_price_range_tool
   Format: Prices in millions VND
   Example: 5.5 = 5,500,000 VND

4. Availability Queries:
   Tool: check_properties_status
   Status Values: ["active", "inactive"]

RESPONSE FORMATS:

1. For District Results:
   ```
   Here are the properties in [District]:

   1. [Property Name]
      - Price: [Amount] VND/tháng
      - Location: [Street], [Ward], [District]
      - Area: [Size] m²
      - Features: [Bedrooms] phòng ngủ, [Bathrooms] phòng tắm
      - Contact: [Name] - [Phone]
      [Additional details]

   2. [Next Property]...
   ```

2. For Location-Based Results:
   ```
   Properties near [Location Name], sorted by distance:

   1. [Property Name] - [Distance]km from [Location]
      - Price: [Amount] VND/tháng
      - Location: [Full Address]
      - Travel Times:
        * Walking: [X] minutes
        * By bicycle: [Y] minutes
        * By motorbike: [Z] minutes
        * By car: [W] minutes
      - Area: [Size] m²
      - Features: [Details]
      - Contact: [Name] - [Phone]

   2. [Next Property]...
   ```

3. For Price Range Results:
   ```
   Properties within [Min]-[Max] million VND:

   1. [Property Name] - [Price] VND/tháng
      [Other details as above]
   ```

DEBUGGING AND VERIFICATION:
1. Log tool calls and parameters
2. Verify response data exists
3. Check property count before responding
4. Try alternative inputs if initial search fails
5. Document any data inconsistencies

ERROR HANDLING:
1. If no properties found with exact match:
   - Try alternative name formats
   - Check nearby areas
   - Suggest similar price ranges
   - Log the attempted variations

2. If data seems incorrect:
   - Verify coordinates are valid
   - Check price formatting
   - Validate contact information
   - Report any systematic issues

Remember:
- ALWAYS check actual data before responding
- Show ALL matching properties
- Format prices consistently
- Include complete contact details
- Provide relevant travel times for location-based searches"""

    chat = ChatOpenAI(
        temperature=0.7,  
        streaming=True, 
        model="gpt-4o-mini",
        api_key=OPENAI_API_KEY,
        request_timeout=40,  
        callbacks=[CustomHandler(stream_delay=0.04)] 
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


