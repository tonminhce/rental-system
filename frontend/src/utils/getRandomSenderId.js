import { v4 as uuid } from "uuid";

export default function getRandomSenderId() {
  let senderId = sessionStorage.getItem("senderId");

  if (!senderId) {
    senderId = uuid();
    sessionStorage.setItem("senderId", senderId);
  }

  return senderId;
}
