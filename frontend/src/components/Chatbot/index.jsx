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

  if (pathname === "/login" || pathname === "/signup") return children;

  return (
    <>
      {children}
      <Tooltip title="Chat with us">
        <Fab
          aria-label={isChatOpened ? "Close rental assistant" : "Open rental assistant"}
          onClick={() => dispatch(toggleChatWidget())}
          color="primary"
          sx={{
            position: "fixed",
            bottom: { xs: 16, sm: 24 },
            right: { xs: 16, sm: 24 },
            zIndex: 1100,
            boxShadow: "0 8px 24px rgba(32, 45, 29, 0.22)",
            transition: "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease",
            "&:hover": {
              transform: "scale(1.08) translateY(-2px)",
              boxShadow: "0 14px 32px rgba(32, 45, 29, 0.32)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
          }}
        >
          <ChatBubbleOutline />
        </Fab>
      </Tooltip>

      {isChatOpened && <ChatWidget />}
    </>
  );
}
