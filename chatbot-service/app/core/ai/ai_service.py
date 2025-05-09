from langchain.tools import BaseTool
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import os
from typing import List, Dict, AsyncGenerator, Any, Optional
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
    SearchPostsTool,
    FilteredPropertySearchTool,
    NearbyLocationSearchTool,
    GLOBAL_CONTEXT
)
import time
import json
from datetime import datetime

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
search_posts_tool = SearchPostsTool()
filtered_property_search_tool = FilteredPropertySearchTool()
nearby_location_search_tool = NearbyLocationSearchTool()
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

3. SEARCH BY PRICE RANGE (filtered_property_search)
When asked about price range or properties below/above a certain price:
- For queries like "below X million", "under X million", "less than X million": 
  Call: filtered_property_search(max_price_constraint=X)
- For queries like "above X million", "over X million", "more than X million": 
  Call: filtered_property_search(min_price=X)
- For queries like "between X and Y million":
  Call: filtered_property_search(min_price=X, max_price=Y)
- From result, use: result["properties"]
- Start response with: "Found properties [below/above/between] [X] million VND:"
- For each property, display same format as above

4. SEARCH BY LOCATION
For properties near specific locations:

a) Near specific location (nearby_location_search):
- Call: nearby_location_search(location_name="[location]", radius=[radius])
- From result, use: result["properties"]
- Sort by distance if available
- Start response with: "Properties near [location]:"
- For each property, display:

[property["name"]] (ID: #[property["id"]])
- Distance: [property["distance_km"]] km
- Location: [property["district"]]
- Price: [property["price"]] million VND/month
- Area: [property["area"]] m²
- Rooms: [property["bedrooms"]] bedrooms, [property["bathrooms"]] bathrooms
- Contact: [property["contactName"]] - [property["contactPhone"]]
- [property["images"][0]["url"]]

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
- "Properties below 5 million" → Use filtered_property_search with max_price_constraint=5
- "Properties over 10 million" → Use filtered_property_search with min_price=10
- "Properties between 5 and 10 million" → Use filtered_property_search with min_price=5, max_price=10

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
        search_posts_tool,
        filtered_property_search_tool,
        nearby_location_search_tool
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

def get_response(question: str, context: Dict[str, Any]) -> str:
    """Get a single response from the agent"""
    agent = get_llm_and_agent()
    
    
    # Print query parameters for debugging
    print("\n==== AI SERVICE GET_RESPONSE FILTER PARAMETERS ====")
    print(f"Processing query parameters: {json.dumps(context.get('query_params', {}), indent=2)}")
    print("===============================================\n")
    
    # Set global context for tools to access
    global GLOBAL_CONTEXT
    GLOBAL_CONTEXT.clear()
    GLOBAL_CONTEXT.update(context)
    
    # Get recent chat history
    history = get_recent_chat_history(context["thread_id"])
    chat_history = format_chat_history(history)
    
    # Add query parameters to the input if available
    input_text = question
    if context.get("query_params"):
        input_text = f"{question} (Current filters: {context['query_params']})"
    
    # Get the response with intermediate steps
    result = agent.invoke({
        "input": input_text,
        "chat_history": chat_history
    })
    
    # Extract the final response text
    response_text = result.get("output", "")
    
    # Track data to inject
    location_data_to_inject = None
    filter_data_to_inject = None
    
    # Check for tool results
    if "intermediate_steps" in result:
        for step in result["intermediate_steps"]:
            if len(step) >= 2:
                action = step[0]
                tool_output = step[1]
                
                if hasattr(action, "tool") and action.tool == "nearby_location_search" and isinstance(tool_output, dict):
                    print("Found nearby_location_search tool usage in non-streaming response")
                    
                    if tool_output.get("success") and tool_output.get("coordinates"):
                        coords = tool_output["coordinates"]
                        location_data_to_inject = {
                            "centerLat": coords.get("lat"),
                            "centerLng": coords.get("lng"),
                            "radius": tool_output.get("search_radius_km", 5),
                            "locationName": tool_output.get("location_name", "Searched Location")
                        }
                        
                        if "maxPrice" in context.get("query_params", {}):
                            location_data_to_inject["maxPrice"] = context["query_params"]["maxPrice"]
                            
                        if "minPrice" in context.get("query_params", {}):
                            location_data_to_inject["minPrice"] = context["query_params"]["minPrice"]
                            
                        if "propertyType" in context.get("query_params", {}):
                            location_data_to_inject["propertyType"] = context["query_params"]["propertyType"]
                        
                        print(f"Prepared location data to inject in non-streaming response: {json.dumps(location_data_to_inject)}")
                
                elif hasattr(action, "tool") and action.tool == "filtered_property_search" and isinstance(tool_output, dict):
                    print("Found filtered_property_search tool usage in non-streaming response")
                    
                    filter_data = {}
                    
                    if hasattr(action, "tool_input") and isinstance(action.tool_input, dict):
                        if "max_price_constraint" in action.tool_input and action.tool_input["max_price_constraint"] is not None:
                            filter_data["maxPrice"] = action.tool_input["max_price_constraint"]
                        
                        for param in ["minPrice", "maxPrice", "propertyType", "minArea", "maxArea"]:
                            param_snake = param.lower()
                            if param_snake in action.tool_input and action.tool_input[param_snake] is not None:
                                filter_data[param] = action.tool_input[param_snake]
                    
                    if context.get("query_params"):
                        for key, value in context["query_params"].items():
                            if key not in filter_data and value:
                                filter_data[key] = value
                    
                    if filter_data:
                        filter_data_to_inject = filter_data
                        print(f"Prepared filter data to inject in non-streaming response: {json.dumps(filter_data_to_inject)}")
    
    # If we have location data to inject and it wasn't already included
    if location_data_to_inject and "__LOCATION_UPDATE__" not in response_text:
        location_update_marker = f"\n\n__LOCATION_UPDATE__{json.dumps(location_data_to_inject)}__END_LOCATION_UPDATE__\n\n"
        print(f"Injecting location update marker to non-streaming response: {location_update_marker}")
        response_text += location_update_marker
    
    if filter_data_to_inject and "__FILTER_UPDATE__" not in response_text:
        filter_update_marker = f"\n\n__FILTER_UPDATE__{json.dumps(filter_data_to_inject)}__END_FILTER_UPDATE__\n\n"
        print(f"Injecting filter update marker to non-streaming response: {filter_update_marker}")
        response_text += filter_update_marker
    
    save_chat_history(context["thread_id"], question, response_text)
    
    return response_text

async def get_streaming_response(question: str, context: Dict[str, Any]) -> AsyncGenerator[str, None]:
    """Get a streaming response from the agent"""
    agent = get_llm_and_agent()
    
    # Print query parameters for debugging
    print("\n==== AI SERVICE STREAMING FILTER PARAMETERS ====")
    print(f"Processing query parameters: {json.dumps(context.get('query_params', {}), indent=2)}")
    print("===============================================\n")
    
    # Set global context for tools to access
    global GLOBAL_CONTEXT
    GLOBAL_CONTEXT.clear()
    GLOBAL_CONTEXT.update(context)
    
    # Get recent chat history
    history = get_recent_chat_history(context["thread_id"])
    chat_history = format_chat_history(history)
    
    # Add query parameters to the input if available
    input_text = question
    if context.get("query_params"):
        input_text = f"{question} (Current filters: {context['query_params']})"
    
    # Print modified input text
    print(f"Modified input with filters: {input_text}")
    
    # Track if we need to inject data
    location_data_to_inject = None
    filter_data_to_inject = None
    
    # Stream the response with context
    final_answer = ""
    async for event in agent.astream_events(
        {
            "input": input_text,
            "chat_history": chat_history,
            "context": context  # Pass the context to make it available to tools
        },
        version="v2"
    ):
        # Capture tool results that contain location data
        if event["event"] == "on_tool_end":
            tool_name = event.get("name", "")
            tool_output = event.get("data", {}).get("output", {})
            tool_input = event.get("data", {}).get("input", {})
            
            
            print(f"Tool execution completed: {tool_name}")
            if tool_name == "nearby_location_search" and isinstance(tool_output, dict):
                print("Found nearby_location_search tool result, processing for location update")
                
                # Extract the coordinates and other data
                if tool_output.get("success") and tool_output.get("coordinates"):
                    coords = tool_output["coordinates"]
                    location_data_to_inject = {
                        "centerLat": coords.get("lat"),
                        "centerLng": coords.get("lng"),
                        "radius": tool_output.get("search_radius_km", 5),
                        "locationName": tool_output.get("location_name", "Searched Location")
                    }
                    
                    # Include any additional filter data if present
                    if "maxPrice" in context.get("query_params", {}):
                        location_data_to_inject["maxPrice"] = context["query_params"]["maxPrice"]
                        
                    if "minPrice" in context.get("query_params", {}):
                        location_data_to_inject["minPrice"] = context["query_params"]["minPrice"]
                        
                    if "propertyType" in context.get("query_params", {}):
                        location_data_to_inject["propertyType"] = context["query_params"]["propertyType"]
                    
                    print(f"Prepared location data to inject: {json.dumps(location_data_to_inject)}")
                    
                    # Immediately yield the location update - don't wait for the end
                    location_update_marker = f"\n\n__LOCATION_UPDATE__{json.dumps(location_data_to_inject)}__END_LOCATION_UPDATE__\n\n"
                    print(f"Immediately injecting location update marker: {location_update_marker}")
                    yield location_update_marker
            
            elif tool_name == "filtered_property_search" and isinstance(tool_input, dict):
                print("Found filtered_property_search tool result, processing for filter update")
                
                # Extract the filter data that was used
                filter_data = {}
                
                # Check for max_price_constraint specifically and map it to maxPrice
                if "max_price_constraint" in tool_input and tool_input["max_price_constraint"] is not None:
                    filter_data["maxPrice"] = tool_input["max_price_constraint"]
                
                # Extract params from the FilteredPropertySearchTool input
                for param in ["min_price", "max_price", "property_type", "min_area", "max_area"]:
                    if param in tool_input and tool_input[param] is not None:
                        # Convert snake_case to camelCase for frontend
                        camel_param = param.replace('_', ' ').title().replace(' ', '')
                        camel_param = camel_param[0].lower() + camel_param[1:]
                        filter_data[camel_param] = tool_input[param]
                
                # Include existing query parameters
                if context.get("query_params"):
                    # Add any additional parameters from the current context
                    for key, value in context["query_params"].items():
                        if key not in filter_data and value:
                            filter_data[key] = value
                
                if filter_data:
                    filter_data_to_inject = filter_data
                    print(f"Prepared filter data to inject: {json.dumps(filter_data_to_inject)}")
                    
                    # Immediately yield the filter update - don't wait for the end
                    filter_update_marker = f"\n\n__FILTER_UPDATE__{json.dumps(filter_data_to_inject)}__END_FILTER_UPDATE__\n\n"
                    print(f"Immediately injecting filter update marker: {filter_update_marker}")
                    yield filter_update_marker
        
        # Process text chunks from the model
        if event["event"] == "on_chat_model_stream":
            content = event['data']['chunk'].content
            if content:
                final_answer += content
                yield content
    
    
    # Save chat history to database
    if final_answer:
        save_chat_history(context["thread_id"], question, final_answer)

def get_answer(question: str, thread_id: str, query_params: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
    try:
        # Add query parameters to the context
        context = {
            "thread_id": thread_id,
            "query_params": query_params or {}
        }
        
        # Get the answer with context
        response = get_response(question, context)
        return {"output": response}
    except Exception as e:
        print(f"Error in get_answer: {str(e)}")
        raise

async def get_answer_stream(question: str, thread_id: str, query_params: Optional[Dict[str, Any]] = None) -> AsyncGenerator[str, None]:
    try:
        # Add query parameters to the context
        context = {
            "thread_id": thread_id,
            "query_params": query_params or {}
        }
        
        # Get the answer stream with context
        async for chunk in get_streaming_response(question, context):
            yield chunk
    except Exception as e:
        print(f"Error in get_answer_stream: {str(e)}")
        yield f"Error: {str(e)}"

if __name__ == "__main__":
    import asyncio
    
    async def test():
        # answer = get_answer_stream("hi", "test-session")
        # print(answer)
        async for event in get_answer_stream("hi", "test-session"):
            print('event:', event)
        print('done')

    
    asyncio.run(test())


