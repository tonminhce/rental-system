import { chatService } from "@/utils/chatService";
import SendIcon from "@mui/icons-material/Send";
import { Box, IconButton, List, ListItem, Paper, styled, TextField, Typography, Tooltip } from "@mui/material";
import { grey } from "@mui/material/colors";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from "./ChatMessage";
import { useSelector } from "react-redux";
import eventBus, { CHATBOT_EVENTS } from '@/utils/chatbotEventBus';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch } from "react-redux";
import { toggleChatWidget } from "@/redux/features/system/systemSlice";

const ChatbotContainer = styled(Box)(({ theme }) => ({
  position: "fixed",
  right: 20,
  bottom: 80,
  width: "100%",
  maxWidth: 500,
  mx: "auto",
  mt: 5,
  zIndex: 1000,
  display: "none", 
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  padding: theme.spacing(1.5, 2),
  borderTopLeftRadius: theme.shape.borderRadius,
  borderTopRightRadius: theme.shape.borderRadius,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const ChatMessagesContainer = styled(List)(({ theme }) => ({
  flexGrow: 1,
  overflowY: "auto",
  padding: theme.spacing(2),
  backgroundColor: theme.palette.grey[50],
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: theme.palette.grey[300],
    borderRadius: '3px',
  },
}));

const ChatInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: 'white',
  borderTop: `1px solid ${theme.palette.grey[200]}`,
  display: 'flex',
  alignItems: 'center',
}));

const ChatWidget = () => {
  const dispatch = useDispatch();
  const filterState = useSelector((state) => state.filter);
  
  const isChatOpened = useSelector((state) => state.system.isChatOpened);
  const [threadId, setThreadId] = useState('');
  
  useEffect(() => {
    if (isChatOpened) {
      setThreadId(uuidv4());
      sessionStorage.removeItem("chatMessages");
    }
  }, [isChatOpened]);

  const streamedMessageRef = useRef('');
  
  const lastMessageEl = useRef(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (threadId && isChatOpened) {
      const storedMessages = JSON.parse(sessionStorage.getItem("chatMessages") ?? "[]");
      if (storedMessages.length === 0) {
        setMessages([{ 
          text: "Hello! How can i help you today?",
          sender: "bot" 
        }]);
      } else {
        setMessages(storedMessages);
      }
    }
  }, [threadId, isChatOpened]);

  useEffect(() => {
    if (messages.length > 0 && isChatOpened) {
      sessionStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages, isChatOpened]);

  useEffect(() => {
    if (lastMessageEl.current && isChatOpened) {
      lastMessageEl.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpened]);

  const processChatbotResponse = (content) => {
    try {
      let processedContent = content;
      let didUpdate = false;
      
      if (processedContent.includes("__LOCATION_UPDATE__")) {
        const locationRegex = /__LOCATION_UPDATE__\s*({[\s\S]*?})\s*__END_LOCATION_UPDATE__/;
        const match = processedContent.match(locationRegex);
        
        if (match && match[1]) {
          const locationData = JSON.parse(match[1]);
          
          if (locationData.centerLat && locationData.centerLng) {
            eventBus.publish(CHATBOT_EVENTS.UPDATE_MAP_LOCATION, {
              centerLat: locationData.centerLat,
              centerLng: locationData.centerLng,
              radius: locationData.radius || 1,
              locationName: locationData.locationName || "Searched Location"
            });
            
            eventBus.publish(CHATBOT_EVENTS.UPDATE_FILTERS, {
              centerLat: locationData.centerLat,
              centerLng: locationData.centerLng,
              radius: locationData.radius || 1,
              minPrice: locationData.minPrice,
              maxPrice: locationData.maxPrice,
              minArea: locationData.minArea,
              maxArea: locationData.maxArea,
              propertyType: locationData.propertyType,
              transactionType: locationData.transactionType || 'rent'
            });
            
            didUpdate = true;
          }
          
          processedContent = processedContent.replace(locationRegex, "");
        }
      }
      
      if (processedContent.includes("__FILTER_UPDATE__")) {
        const filterRegex = /__FILTER_UPDATE__\s*({[\s\S]*?})\s*__END_FILTER_UPDATE__/;
        const match = processedContent.match(filterRegex);
        
        if (match && match[1]) {
          const filterData = JSON.parse(match[1]);
          eventBus.publish(CHATBOT_EVENTS.UPDATE_FILTERS, filterData);
          didUpdate = true;
          processedContent = processedContent.replace(filterRegex, "");
        }
      }
      return processedContent;
    } catch (error) {
      console.error("Error processing chatbot response for updates:", error);
    }
        return content;
  };

  const handleSend = async () => {
    if (input.trim() === "" || isTyping || !threadId || !isChatOpened) return;

    // Add the user's message to the chat
    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    setIsTyping(true);
    
    streamedMessageRef.current = '';
    
    try {
      setMessages(prev => [...prev, { text: '', sender: "bot", isPartial: true }]);
      
      const queryParams = Object.keys(filterState).reduce((params, key) => {
        if (filterState[key] !== null && filterState[key] !== undefined && filterState[key] !== '') {
          params[key] = filterState[key];
        }
        return params;
      }, {});
      
      
      await chatService.sendMessageStream(
        userMessage,
        threadId,
        queryParams,
        (token) => {
          const processedToken = processChatbotResponse(token);
          streamedMessageRef.current += processedToken;
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage) {
              lastMessage.text = streamedMessageRef.current;
            }
            return newMessages;
          });
        },
        (error) => {
          console.error("Chat error:", error);
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage) {
              lastMessage.text = "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.";
              lastMessage.isPartial = false;
            }
            return newMessages;
          });
        }
      );

      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.isPartial) {
          lastMessage.isPartial = false;
        }
        return newMessages;
      });
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages(prev => {
        // Check if the last message is a partial bot message
        if (prev.length > 0 && prev[prev.length - 1].isPartial) {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            text: "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.",
            sender: "bot"
          };
          return newMessages;
        }
        // Otherwise add a new error message
        return [...prev, { 
          text: "Xin lỗi, đã xảy ra lỗi khi xử lý yêu cầu của bạn.", 
          sender: "bot" 
        }];
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleClose = () => {
    dispatch(toggleChatWidget());
  };

  if (!isChatOpened) {
    return null;
  }

  return (
    <ChatbotContainer sx={{ display: isChatOpened ? 'block' : 'none' }}>
      <Paper 
        sx={{ 
          display: "flex", 
          flexDirection: "column",
          height: "70vh",
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)"
        }}
      >
        <ChatHeader>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Rental Assistant          
          </Typography>
          <Box sx={{ display: 'flex' }}>
            <Tooltip title="Close">
              <IconButton 
                size="small" 
                onClick={handleClose}
                sx={{ color: 'white' }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </ChatHeader>

        <ChatMessagesContainer>
          {messages.map((message, index) => (
            <ListItem 
              key={index} 
              disableGutters 
              disablePadding
              sx={{ 
                display: 'block',
                mb: index === messages.length - 1 ? 0 : 1 
              }}
            >
              <ChatMessage 
                message={message.text} 
                sender={message.sender}
                isPartial={message.isPartial}
              />
            </ListItem>
          ))}
          {isTyping && !messages[messages.length - 1]?.isPartial && (
            <ListItem disableGutters sx={{ display: 'block' }}>
              <ChatMessage 
                message="..." 
                sender="bot"
              />
            </ListItem>
          )}
          <div ref={lastMessageEl} />
        </ChatMessagesContainer>

        <ChatInputContainer>
          <TextField
            variant="outlined"
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nhập tin nhắn..."
            disabled={isTyping}
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "20px",
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                  borderWidth: "1px",
                },
              },
            }}
          />
          <IconButton 
            color="primary" 
            onClick={handleSend} 
            disabled={isTyping || input.trim() === ""}
            sx={{ 
              ml: 1,
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&.Mui-disabled': {
                backgroundColor: grey[300],
                color: grey[500],
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </ChatInputContainer>
      </Paper>
    </ChatbotContainer>
  );
};

export default ChatWidget;

