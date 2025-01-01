import axios from "axios";
const API_URL = "http://localhost:8030";

/**
 * Service xử lý các tương tác chat với backend
 */
export const chatService = {
  /**
   * Gửi tin nhắn đến server và nhận phản hồi một lần
   *
   * @param {string} message - Nội dung tin nhắn cần gửi
   * @param {string} sessionId - ID phiên chat
   * @param {function} onChunk - Callback xử lý khi nhận được phản hồi
   * @returns {Promise<string>} Phản hồi từ server
   */
  sendMessage: async (message, sessionId, onChunk = (chunk) => {}) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/chat/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: message,
          thread_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      onChunk(data.answer);
      return data.answer;
    } catch (error) {
      console.error("Chat service error:", error);
      throw error;
    }
  },

  /**
   * Gửi tin nhắn đến server và nhận phản hồi dạng stream
   *
   * @param {string} message - Nội dung tin nhắn cần gửi
   * @param {string} sessionId - ID phiên chat
   * @param {function} onToken - Callback xử lý từng token nhận được
   * @param {function} onError - Callback xử lý khi có lỗi
   */
  sendMessageStream: async (
    message,
    sessionId,
    onToken = (token) => {},
    onError = (error) => {}
  ) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/chat/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: message,
          thread_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split("\n")
          .filter((line) => line.trim() !== "" && line.startsWith("data: "));

        for (const line of lines) {
          try {
            const jsonStr = line.replace("data: ", "");
            const json = JSON.parse(jsonStr);

            if (json.error) {
              onError(json.error);
              return;
            }

            if (json.content) {
              onToken(json.content);
            }
          } catch (e) {
            console.error("Error parsing SSE message:", e);
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      onError(error.message);
    }
  },
};
