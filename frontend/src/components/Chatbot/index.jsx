"use client";
// This function is a website wrapper that provides the chatbot feature.
import { ChatBubbleOutline } from "@mui/icons-material";
import { Box, Collapse, Fab, Fade, Grow, Slide, Tooltip } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import ChatWidget from "./components/ChatWidget";
import { toggleChatWidget } from "@/redux/features/system/systemSlice";
import { usePathname } from "next/navigation";

export default function ChatbotProvider({ children }) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const isChatOpened = useSelector((s) => s.system.isChatOpened);

  console.log("ChatbotProvider", pathname);

  if (pathname === "/landlord/notifications") return children;

  return (
    <>
      {children}
      <Tooltip title="Chat with us">
        <Fab
          onClick={() => dispatch(toggleChatWidget())}
          color="primary"
          sx={{ position: "fixed", bottom: 16, right: 16 }}
        >
          <ChatBubbleOutline />
        </Fab>
      </Tooltip>
      <Fade in={isChatOpened}>
        <div>
          <ChatWidget />
        </div>
      </Fade>
    </>
  );
}
