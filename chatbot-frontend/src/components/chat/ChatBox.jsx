import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { chatService } from '../../services/chatService';
import ChatMessage from './ChatMessage';
import { v4 as uuidv4 } from 'uuid';

const ChatContainer = styled.div`
  width: 100%;
  height: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  background-color: #ffffff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background-color: #f8f9fa;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

const InputContainer = styled.div`
  display: flex;
  padding: 24px;
  border-top: 1px solid #e0e0e0;
  background-color: #ffffff;
`;

const Input = styled.input`
  flex: 1;
  padding: 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  margin-right: 16px;
  font-size: 16px;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #1a237e;
  }

  &::placeholder {
    color: #9e9e9e;
  }
`;

const Button = styled.button`
  padding: 16px 32px;
  background: #1a237e;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: background-color 0.3s ease;

  &:hover {
    background: #283593;
  }

  &:disabled {
    background: #9e9e9e;
    cursor: not-allowed;
  }
`;

const PageWrapper = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  color: #1a237e;
  text-align: center;
  margin-bottom: 24px;
  font-size: 2.5rem;
  font-weight: bold;
`;

function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [threadId] = useState(uuidv4());
  const streamedMessageRef = useRef('');

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    streamedMessageRef.current = '';

    // Add user message
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);

    try {
      // Add an empty bot message that will be updated with streaming content
      setMessages(prev => [...prev, { text: '', isUser: false }]);

      // Use streaming response
      await chatService.sendMessageStream(
        userMessage,
        threadId,
        (token) => {
          streamedMessageRef.current += token;
          // Update the last message with complete streamed content
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            lastMessage.text = streamedMessageRef.current;
            return newMessages;
          });
        },
        (error) => {
          console.error('Stream error:', error);
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = 'Sorry, I am not able to process your request.';
            return newMessages;
          });
        }
      );
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        text: 'Sorry, I am not able to process your request.', 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <PageWrapper>
      <Title>Sales Assistant AI</Title>
      <ChatContainer>
        <MessagesContainer>
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message}
              isUser={message.isUser}
            />
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>
        <InputContainer>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder="Enter your message..."
            disabled={isLoading}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </InputContainer>
      </ChatContainer>
    </PageWrapper>
  );
}

export default ChatBox; 