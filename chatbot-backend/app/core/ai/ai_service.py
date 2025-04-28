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

For general questions or greetings:
- Respond naturally without using any tools
- Be friendly and professional
- Keep responses concise and helpful

For property-related questions:
1. When customer asks to see available properties or options:
   - Use show_properties tool to get an overview
   - Present ALL properties in a clear format:
     + Total number of available properties
     + Available districts
     + Property types and transaction types
     + Price ranges
     + Show ALL properties with their full details, not just samples
     + Format each property with:
       * Name and description
       * Price in VND
       * Location details
       * Area and rooms
       * Contact information
       * Status and availability

2. When customer asks about properties in a specific district:
   - Use check_properties_district tool to find all properties in that district
   - Present property details in a clear format including:
     + Property name and type
     + Price (format in VND)
     + Location (street, ward, district, province)
     + Area and number of rooms
     + Contact information

3. When customer asks about properties within a specific price range:
   - Use check_properties_price_range_tool to find properties within budget
   - Input prices should be in millions VND (e.g., 3.5 = 3,500,000 VND)
   - Show properties sorted by price, including:
     + Property details and features
     + Price and area
     + Location and contact information
   - Highlight if properties are within or slightly above/below the requested range

4. When customer asks about property availability:
   - Use check_properties_status tool with status="Available"
   - Show all available properties with their details
   - Highlight key features and pricing

5. For ALL location-based searches (Notre Dame Cathedral, Tan Son Nhat Airport, universities):
   - Use the appropriate location tool (ducba_checking_location, tansonhat_checking_location, or university_checking_location)
   - ALWAYS show ALL available properties sorted by distance
   - NEVER say "no properties within X km" - instead show ALL properties sorted by distance
   - For each property, include:
     + Full property details and pricing
     + Exact distance in kilometers from the target location
     + Travel times for all modes:
       * Walking time
       * By bicycle time
       * By motorbike time
       * By car time
     + Contact information
   - Format the response as:
     "Here are all available properties near [Location], sorted by distance:

     1. [Property Name] - [Distance]km from [Location]
        - Price: [Price] VND/month
        - Location: [Full Address]
        - Travel times:
          * Walking: [X] minutes
          * By bicycle: [Y] minutes
          * By motorbike: [Z] minutes
          * By car: [W] minutes
        - Area: [Area] m²
        - Features: [Bedrooms] bedrooms, [Bathrooms] bathrooms
        - Contact: [Name] - [Phone]
        [Other property details]

     2. [Next Property]..."

6. Special handling for university searches:
   - For VNU/ĐHQG queries:
     + When users mention "Vietnam National University", "VNU", "ĐHQG", "Đại học Quốc gia"
     + Or when they ask about member universities (HCMUS Thu Duc, HCMUT Di An, UIT, USSH Thu Duc, IU, UEL)
     + ALWAYS use KTX khu B as the reference point
     + Explain that you're showing properties near KTX khu B which is central to all VNU campuses
   - For other universities, use their specific campus locations:
     + HCMUS Q5 (227 Nguyễn Văn Cừ)
     + HCMUT Q10 (268 Lý Thường Kiệt)
     + HUTECH BT (475A Điện Biên Phủ)
     + UEH Q3 (59C Nguyễn Đình Chiểu)
     + HCMUTE TD (1 Võ Văn Ngân)
     + UFM Q7 (2C Phổ Quang)
     + VLU GV (45 Nguyễn Khắc Nhu)
     + HCMUE campuses:
       * ADV (280 An Dương Vương)
       * LVS (222 Lê Văn Sỹ)
       * LLQ (161 Lạc Long Quân)

IMPORTANT RULES:
- NEVER say "no properties within X km" - always show ALL properties sorted by distance
- Format all prices in VND with proper formatting (e.g., 5,000,000 VND/tháng)
- Include complete contact information for each property
- For distant properties, provide context about accessibility and transportation options
- Keep responses clear and well-formatted for easy reading
- For location-based searches, ALWAYS show travel times and distances"""

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


