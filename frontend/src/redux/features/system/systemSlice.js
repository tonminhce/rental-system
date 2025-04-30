const { createSlice } = require("@reduxjs/toolkit");

const systemSlice = createSlice({
  name: "system",
  initialState: {
    isChatOpened: false,
    chatOnlineUsers: [],
    chatTargetingUser: null,
  },
  reducers: {
    toggleChatWidget: (state) => {
      state.isChatOpened = !state.isChatOpened;
    },

    setChatTargetingUser: (state, action) => {
      state.chatTargetingUser = action.payload;
    },

    setChatOnlineUsers: (state, action) => {
      state.chatOnlineUsers = action.payload;
    },
  },
});

export const { toggleChatWidget, setChatOnlineUsers, setChatTargetingUser } = systemSlice.actions;
export default systemSlice.reducer;
