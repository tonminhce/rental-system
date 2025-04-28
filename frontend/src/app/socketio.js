"use client";
import { setChatOnlineUsers } from "@/redux/features/system/systemSlice";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { io } from "socket.io-client";

export default function SocketProvider({ children }) {
  const socket = useRef();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  // Connect to socket.io server
  useEffect(() => {
    if (user && !socket.current) {
      socket.current = io("http://localhost:3000");
      console.log("connect");
    }

    return () => {
      socket.current.disconnect();
    };
  }, [user]);

  // Send the user info to the server
  useEffect(() => {
    if (!socket) return;

    socket.current.on("connect", () => {
      socket.current.emit("join", { userId: user.id });
    });

    socket.current.on("online-users-updated", (data) => {
      dispatch(setChatOnlineUsers(data));
    });

    socket.current.on("new-message", (data) => {
      const event = new CustomEvent("new-message", { detail: data });
      window.dispatchEvent(event);
    });

    const sendMessage = (e) => {
      const { message, receiverId } = e.detail;
      socket.current.emit("send-message", { text: message, senderId: user.id, receiverId });
    };

    window.addEventListener("send-message", sendMessage);

    return () => window.removeEventListener("send-message", sendMessage);
  }, [socket]);

  return <>{children}</>;
}

export function sendMessage({ message, receiverId }) {
  if (!message || !receiverId) return;
  const event = new CustomEvent("send-message", { detail: { message, receiverId } });
  window.dispatchEvent(event);
}
