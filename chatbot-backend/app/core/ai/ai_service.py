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
from .tools import ProductSearchTool, CreateOrderTool, UpdateOrderStatusTool

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not found in environment variables")

# Create tools
product_search_tool = ProductSearchTool()
create_order_tool = CreateOrderTool()
update_order_status_tool = UpdateOrderStatusTool()

class CustomHandler(BaseCallbackHandler):
    def __init__(self):
        super().__init__()

def get_llm_and_agent() -> AgentExecutor:
    system_message = """You are a friendly and professional AI sales assistant. Your task is to help customers with their inquiries and purchases.

For general questions or greetings:
- Respond naturally without using any tools
- Be friendly and professional
- Keep responses concise and helpful

For product-related questions or purchase intentions:
1. When customer asks about products:
   - Use product_search tool to find product information
   - Present product details in a clear format
   - If they show interest in buying, ask for quantity

2. When customer confirms purchase quantity:
   - Use product_search again to get latest information
   - From the search result, get:
     + product_id 
     + price = result["price"]
   - Calculate total = price × quantity
   - Use create_order tool with:
     + user_id="user1"
     + product_id=<id from product_search>
     + quantity=<customer requested quantity>
     + total_amount=<price × quantity>
   - Handle insufficient funds or out of stock cases
   - Confirm successful order and payment deduction

3. When customer confirms payment:
   - Use update_order_status tool to set order status to "paid"
   - Confirm successful payment to customer

IMPORTANT RULES:
- Only use product_search when questions are about products or purchases
- NEVER use product_id without getting it from product_search result first
- All product information (id, price, etc.) MUST come from latest product_search result
- Format money amounts in VND format (e.g., 31,990,000 VND)

Example flow:
1. Customer: "I want to buy Samsung S24"
2. Bot: 
   - Call product_search("Samsung S24")
   - Result: {{"id": 2, "name": "Samsung S24", "price": 31990000, ...}}
   - Show product info and ask quantity
3. Customer: "I want 1"
4. Bot: 
   - Call product_search("Samsung S24") again for latest info
   - From result: {{"id": 2, "price": 31990000}}
   - Call create_order with:
     user_id="user1"
     product_id=2        # From search result
     quantity=1
     total_amount=31990000  # price × quantity
   - Inform customer of the result"""
    
    chat = ChatOpenAI(
        temperature=0, 
        streaming=True, 
        model="gpt-4", 
        api_key=OPENAI_API_KEY,
        callbacks=[CustomHandler()]
    )
    
    tools = [
        product_search_tool,
        create_order_tool,
        update_order_status_tool
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
    agent = get_llm_and_agent()
    
    # Get recent chat history
    history = get_recent_chat_history(thread_id)
    chat_history = format_chat_history(history)
    
    final_answer = ""
    
    async for event in agent.astream_events(
        {
            "input": question,
            "chat_history": chat_history,
        },
        version="v2"
    ):       
        kind = event["event"]
        if kind == "on_chat_model_stream":
            content = event['data']['chunk'].content
            if content:  #Only yield if there's content
                final_answer += content
                yield content
    
    # Save complete answer to database
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


