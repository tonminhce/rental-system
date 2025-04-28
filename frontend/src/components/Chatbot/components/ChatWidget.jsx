// components/Chatbot.js
import getRandomSenderId from "@/utils/getRandomSenderId";
import SendIcon from "@mui/icons-material/Send";
import { Box, IconButton, List, ListItem, ListItemText, Paper, styled, TextField } from "@mui/material";
import { grey } from "@mui/material/colors";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";

const ChatbotContainer = styled(Box)(({ theme }) => ({
  position: "fixed",
  right: 20,
  bottom: 80,
  width: "100%",
  maxWidth: 500,
  mx: "auto",
  mt: 5,
}));

const ChatWidget = () => {
  // Create sender id from user
  const user = useSelector((s) => s.auth.user);
  const senderId = useMemo(() => (user && user?.id ? user.id : getRandomSenderId(), []));
  const lastMessageEl = useRef(null);
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Load previous messages from session storage
  useEffect(() => {
    console.log(sessionStorage.getItem("chatMessages") ?? []);
    const storedMessages = JSON.parse(sessionStorage.getItem("chatMessages") ?? "[]");
    setMessages(storedMessages);
  }, []);

  // Save messages to session storage
  useEffect(() => {
    sessionStorage.setItem("chatMessages", JSON.stringify(messages));
  }, [messages]);

  const handleSend = () => {
    if (input.trim() === "") return;

    // Add the user's message to the chat
    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);

    // Call to RASA API to get the bot response
    fetch(`${process.env.NEXT_PUBLIC_RASA_WEBHOOK_URL}/webhooks/rest/webhook`, {
      method: "POST",
      body: JSON.stringify({ sender: senderId, message: input }),
    })
      .then((response) => response.json())
      .then((data) => {
        for (const message of data) {
          if (message?.custom?.message_type == "search_properties") {
            const { message_type, transaction, ...params } = message.custom;

            const searchParam = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
              searchParam.append(key, value);
            }

            console.log(searchParam.toString());
            router.push(`/${transaction ?? "rent"}?${searchParam.toString()}`);
            setMessages((prev) => [...prev, { text: "Tôi đã tìm những phòng trọ phù hợp với bạn", sender: "bot" }]);
          } else {
            console.log(message.text);
            setMessages((prev) => [...prev, { text: message.text, sender: "bot" }]);
          }
        }
      });

    setInput("");
  };

  return (
    <ChatbotContainer>
      <Paper sx={{ p: 2, height: "70vh", display: "flex", flexDirection: "column" }}>
        <List sx={{ flexGrow: 1, overflowY: "auto" }}>
          {messages.map((message, index) => (
            <ListItem key={index} sx={{ justifyContent: message.sender === "user" ? "flex-end" : "flex-start" }}>
              <ListItemText
                primary={message.text}
                sx={{
                  color: message.sender === "user" ? "#fff" : "inherit",
                  bgcolor: message.sender === "user" ? "primary.main" : grey[200],
                  borderRadius: 2,
                  p: 1,
                  maxWidth: "75%",
                }}
              />
            </ListItem>
          ))}
          <div ref={lastMessageEl} />
        </List>
        <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
          <TextField
            variant="outlined"
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <IconButton color="primary" onClick={handleSend}>
            <SendIcon />
          </IconButton>
        </Box>
      </Paper>
    </ChatbotContainer>
  );
};

export default ChatWidget;
