import React from 'react';
import ChatBox from '../components/chat/ChatBox';
import styled from 'styled-components';

const PageWrapper = styled.div`
  height: 100%;
  padding: 24px;
  display: flex;
  flex-direction: column;
`;

/**
 * Trang chính của ứng dụng chat
 * Bao gồm:
 * - Layout trang
 * - Component ChatBox để xử lý chat
 */
const ChatPage = () => {
  return (
    <PageWrapper>
      <ChatBox />
    </PageWrapper>
  );
};

export default ChatPage;
