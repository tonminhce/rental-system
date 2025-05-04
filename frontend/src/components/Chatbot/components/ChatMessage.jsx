import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Box, styled } from '@mui/material';

const MessageContainer = styled(Box)(({ theme, isUser }) => ({
  display: 'flex',
  marginBottom: theme.spacing(3),
  justifyContent: isUser ? 'flex-end' : 'flex-start',
  width: '100%',
  paddingLeft: isUser ? theme.spacing(2) : 0,
  paddingRight: isUser ? 0 : theme.spacing(2),
}));

const MessageBubble = styled(Box)(({ theme, isUser }) => ({
  maxWidth: '75%',
  padding: '14px 18px',
  borderRadius: isUser ? '20px 20px 0 20px' : '20px 20px 20px 0',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[200],
  color: isUser ? '#ffffff' : 'inherit',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  wordBreak: 'break-word',
  position: 'relative',

  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },

  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    [isUser ? 'right' : 'left']: -8,
    width: 16,
    height: 16,
    backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[200],
    clipPath: isUser ? 'polygon(0 0, 100% 0, 100% 100%)' : 'polygon(0 0, 100% 0, 0 100%)',
    display: 'none',
  },

  '& p': {
    margin: 0,
    lineHeight: 1.6,
  },

  '& p + p': {
    marginTop: 12,
  },

  '& img': {
    maxWidth: '100%',
    maxHeight: '240px',
    borderRadius: '10px',
    margin: '12px 0',
    display: 'block',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },

  '& code': {
    backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : theme.palette.grey[100],
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '14px',
  },

  '& pre': {
    backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : theme.palette.grey[100],
    padding: '12px',
    borderRadius: '8px',
    overflowX: 'auto',
    margin: '12px 0',

    '& code': {
      backgroundColor: 'transparent',
      padding: 0,
    },
  },

  '& ul, & ol': {
    margin: '12px 0',
    paddingLeft: '20px',
  },

  '& li': {
    marginBottom: '8px',
  },

  '& table': {
    borderCollapse: 'collapse',
    margin: '12px 0',
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    border: `1px solid ${isUser ? 'rgba(255, 255, 255, 0.2)' : theme.palette.grey[300]}`,

    '& th, & td': {
      border: `1px solid ${isUser ? 'rgba(255, 255, 255, 0.2)' : theme.palette.grey[300]}`,
      padding: '10px',
      textAlign: 'left',
    },

    '& th': {
      backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : theme.palette.grey[100],
      fontWeight: 'bold',
    },
  },

  '& a': {
    color: isUser ? '#ffffff' : theme.palette.primary.main,
    textDecoration: 'underline',
    transition: 'opacity 0.2s ease',
    '&:hover': {
      opacity: 0.8,
    },
  },

  '& hr': {
    border: 0,
    height: '1px',
    margin: '16px 0',
    backgroundColor: isUser ? 'rgba(255, 255, 255, 0.2)' : theme.palette.grey[300],
  }
}));

/**
 * Component hiển thị một tin nhắn trong cuộc trò chuyện
 * Hỗ trợ:
 * - Hiển thị tin nhắn người dùng và bot với style khác nhau
 * - Render markdown content
 * - Style cho code blocks, tables, lists, images
 * 
 * @param {Object} props - Props của component
 * @param {string|Object} props.message - Nội dung tin nhắn hoặc object có text
 * @param {string} props.sender - "user" hoặc "bot"
 * @param {boolean} props.isPartial - Nếu true, tin nhắn đang được stream
 */
const ChatMessage = ({ message, sender, isPartial }) => {
  const isUser = sender === 'user';
  
  // Chuyển đổi tin nhắn sang string phù hợp
  let messageText = '';
  
  if (typeof message === 'string') {
    messageText = message;
  } else if (message && typeof message === 'object') {
    messageText = message.text || '';
  }
  
  // Make sure messageText is a string
  if (typeof messageText !== 'string') {
    messageText = JSON.stringify(messageText);
  }

  // Replace --- with horizontal rule for better property separation
  messageText = messageText.replace(/\s+---\s+/g, '\n\n---\n\n');

  return (
    <MessageContainer isUser={isUser}>
      <MessageBubble isUser={isUser} sx={{ fontStyle: isPartial ? 'italic' : 'normal' }}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Make images responsive
            img: ({ node, ...props }) => (
              <img 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '240px', 
                  borderRadius: '10px',
                  margin: '12px 0',
                  display: 'block',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }} 
                {...props} 
                loading="lazy"
              />
            )
          }}
        >
          {messageText}
        </ReactMarkdown>
      </MessageBubble>
    </MessageContainer>
  );
};

export default ChatMessage; 