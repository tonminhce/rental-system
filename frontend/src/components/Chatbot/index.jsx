"use client";
import { ChatBubbleOutline } from "@mui/icons-material";
import { Fab, Tooltip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import ChatWidget from "./components/ChatWidget";
import { toggleChatWidget } from "@/redux/features/system/systemSlice";
import { usePathname } from "next/navigation";

export default function ChatbotProvider({ children }) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const isChatOpened = useSelector((s) => s.system.isChatOpened);


  if (pathname !== "/rent") return children;

  return (
    <>
      {children}
      <Tooltip title="Chat with us">
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
      
      {isChatOpened && (
        <ChatWidget />
      )}
    </>
  );
}
