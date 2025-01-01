import React from 'react';
import styled from 'styled-components';
import ReactMarkdown from 'react-markdown';

const MessageContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  justify-content: ${props => props.isUser ? 'flex-end' : 'flex-start'};
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: 16px 20px;
  border-radius: ${props => props.isUser ? '20px 20px 0 20px' : '20px 20px 20px 0'};
  background-color: ${props => props.isUser ? '#1a237e' : '#ffffff'};
  color: ${props => props.isUser ? '#ffffff' : '#000000'};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  font-size: 16px;
  line-height: 1.5;

  p {
    margin: 0;
  }

  code {
    background-color: ${props => props.isUser ? '#283593' : '#f5f5f5'};
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
  }

  pre {
    background-color: ${props => props.isUser ? '#283593' : '#f5f5f5'};
    padding: 12px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;

    code {
      background-color: transparent;
      padding: 0;
    }
  }

  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  table {
    border-collapse: collapse;
    margin: 8px 0;
    width: 100%;

    th, td {
      border: 1px solid ${props => props.isUser ? '#283593' : '#e0e0e0'};
      padding: 8px;
      text-align: left;
    }

    th {
      background-color: ${props => props.isUser ? '#283593' : '#f5f5f5'};
    }
  }
`;

const ChatMessage = ({ message, isUser }) => {
  // Convert message to string if it's not already
  const messageText = typeof message.text === 'string' 
    ? message.text 
    : JSON.stringify(message.text);

  return (
    <MessageContainer isUser={isUser}>
      <MessageBubble isUser={isUser}>
        <ReactMarkdown>{messageText}</ReactMarkdown>
      </MessageBubble>
    </MessageContainer>
  );
};

export default ChatMessage;