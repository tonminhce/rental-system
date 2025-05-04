import { chatService } from "@/utils/chatService";
import SendIcon from "@mui/icons-material/Send";
import { Box, IconButton, List, ListItem, Paper, styled, TextField, Typography, Tooltip } from "@mui/material";
import { grey } from "@mui/material/colors";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from 'uuid';
import ChatMessage from "./ChatMessage";

const ChatbotContainer = styled(Box)(({ theme }) => ({
  position: "fixed",
  right: 20,
  bottom: 80,
  width: "100%",
  maxWidth: 500,
  mx: "auto",
  mt: 5,
  zIndex: 1000,
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
  // Generate a new UUID on every page refresh
  // Use both useState and useEffect to ensure we get a new UUID on refresh
  const [threadId, setThreadId] = useState('');
  
  // Generate new UUID on component mount (which happens on refresh)
  useEffect(() => {
    setThreadId(uuidv4());
    // We can also clear messages when generating a new thread
    sessionStorage.removeItem("chatMessages");
  }, []);
  
  // Create ref for streaming message
  const streamedMessageRef = useRef('');
  
  const lastMessageEl = useRef(null);
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Load previous messages from session storage
  useEffect(() => {
    if (threadId) {
      const storedMessages = JSON.parse(sessionStorage.getItem("chatMessages") ?? "[]");
      setMessages(storedMessages);
    }
  }, [threadId]);

  // Save messages to session storage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (lastMessageEl.current) {
      lastMessageEl.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (input.trim() === "" || isTyping || !threadId) return;

    // Add the user's message to the chat
    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: "user" }]);
    setInput("");
    setIsTyping(true);
    
    // Reset streaming message content
    streamedMessageRef.current = '';
    
    try {
      // Add an empty bot message to show streaming
      setMessages(prev => [...prev, { text: '', sender: "bot", isPartial: true }]);
      
      // Use chat service streaming function to get response
      await chatService.sendMessageStream(
        userMessage,
        threadId,
        (token) => {
          // Handle each token as it comes in
          streamedMessageRef.current += token;
          
          // Update the last message with new content
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            lastMessage.text = streamedMessageRef.current;
            return newMessages;
          });
        },
        (error) => {
          console.error("Chat error:", error);
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              text: "Sorry, there was an error processing your request.", 
              sender: "bot"
            };
            return newMessages;
          });
        }
      );

      // Once stream is complete, finalize the message (remove isPartial flag)
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.isPartial) {
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
            text: "Sorry, there was an error processing your request.",
            sender: "bot"
          };
          return newMessages;
        }
        // Otherwise add a new error message
        return [...prev, { 
          text: "Sorry, there was an error processing your request.", 
          sender: "bot" 
        }];
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <ChatbotContainer>
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
            Property Assistant
          </Typography>
        </ChatHeader>

        <ChatMessagesContainer>
          {messages.length === 0 ? (
            <ListItem disableGutters sx={{ display: 'block', mb: 2 }}>
              <ChatMessage 
                message="Hi there! How can I help you?" 
                sender="bot"
              />
            </ListItem>
          ) : (
            messages.map((message, index) => (
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
            ))
          )}
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
            placeholder="Enter your message..."
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
