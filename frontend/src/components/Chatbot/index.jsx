"use client";
// This function is a website wrapper that provides the chatbot feature.
import { ChatBubbleOutline } from "@mui/icons-material";
import { Box, Fab, Fade, Tooltip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import ChatWidget from "./components/ChatWidget";
import { toggleChatWidget } from "@/redux/features/system/systemSlice";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ChatbotProvider({ children }) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const isChatOpened = useSelector((s) => s.system.isChatOpened);

  // Debug: Kiểm tra trạng thái chat khi component được render
  useEffect(() => {
    console.log("ChatbotProvider: isChatOpened =", isChatOpened);
  }, [isChatOpened]);

  if (pathname === "/landlord/notifications") return children;

  return (
    <>
      {children}
      <Tooltip title="Chat với chúng tôi">
        <Fab
          onClick={() => dispatch(toggleChatWidget())}
          color="primary"
          sx={{ 
            position: "fixed", 
            bottom: 16, 
            right: 16,
            zIndex: 1100
          }}
        >
          <ChatBubbleOutline />
        </Fab>
      </Tooltip>
      
      {/* Chỉ render ChatWidget khi isChatOpened là true */}
      {isChatOpened && (
        <ChatWidget />
      )}
    </>
  );
}
