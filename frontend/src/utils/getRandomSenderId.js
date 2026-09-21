export default function getRandomSenderId() {
  let senderId = sessionStorage.getItem("senderId");

  if (!senderId) {
    senderId = crypto.randomUUID();
    sessionStorage.setItem("senderId", senderId);
  }

  return senderId;
}
