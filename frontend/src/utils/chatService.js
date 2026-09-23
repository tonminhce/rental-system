// No localhost fallback: an unset NEXT_PUBLIC_CHAT must never point at the user's own machine.
// The chat entrypoint (components/Chatbot) stays disabled when this is empty.
const API_URL = process.env.NEXT_PUBLIC_CHAT;

/**
 * Service xử lý các tương tác chat với backend
 */
export const chatService = {
  /**
   * Gửi tin nhắn đến server và nhận phản hồi một lần
   *
   * @param {string} message - Nội dung tin nhắn cần gửi
   * @param {string} threadId - ID phiên chat (UUID)
   * @param {object} queryParams - Query parameters to be included in the request
   * @param {function} onChunk - Callback xử lý khi nhận được phản hồi
   * @returns {Promise<string>} Phản hồi từ server
   */
  sendMessage: async (message, threadId, queryParams = {}, onChunk = (chunk) => {}, accessToken = "") => {
    try {
      const url = `${API_URL}/api/v1/chat/chat`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          question: message,
          thread_id: threadId,
          query_params: queryParams,
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
   * @param {string} threadId - ID phiên chat (UUID)
   * @param {object} queryParams - Query parameters to be included in the request
   * @param {function} onToken - Callback xử lý từng token nhận được
   * @param {function} onError - Callback xử lý khi có lỗi
   * @returns {Promise<void>} Promise hoàn thành khi stream kết thúc
   */
  sendMessageStream: async (message, threadId, queryParams = {}, onToken = (token) => {}, onError = (error) => {}, accessToken = "") => {
    try {
      const url = `${API_URL}/api/v1/chat/chat/stream`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          "Accept-Language": "en-US,en;q=0.9",
          Connection: "keep-alive",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          question: message,
          thread_id: threadId,
          query_params: queryParams,
        }),
      });

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        pending += decoder.decode(value, { stream: true });
        const events = pending.split(/\r?\n\r?\n/);
        pending = events.pop();
        const lines = events.flatMap((event) => event.split(/\r?\n/)).filter((line) => line.startsWith("data: "));

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
            console.error("Error parsing SSE message:", e, line);
          }
        }
      }
    } catch (error) {
      console.error("Stream error:", error);
      onError(error.message);
    }
  },
};
