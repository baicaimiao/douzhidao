import React from 'react';
import { Message, Sender } from '../types';
import { SparklesIcon, UserIcon } from './Icons';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === Sender.User;

  // Function to format text with simple bolding **text**
  const formatText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-sm 
          ${isUser ? 'bg-soft-secondary text-white' : 'bg-soft-primary text-white'}`}>
          {isUser ? <UserIcon className="w-5 h-5 md:w-6 md:h-6" /> : <SparklesIcon className="w-5 h-5 md:w-6 md:h-6" />}
        </div>

        {/* Message Content */}
        <div 
          className={`relative px-4 py-3 md:px-5 md:py-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed whitespace-pre-wrap
            ${isUser 
              ? 'bg-white text-gray-800 rounded-tr-none border border-gray-100' 
              : 'bg-white text-gray-800 rounded-tl-none border border-rose-100'
            }`}
        >
          {formatText(message.text)}
          
          {/* Streaming Indicator */}
          {message.isStreaming && (
             <span className="inline-block w-2 h-4 ml-1 align-middle bg-rose-400 animate-pulse"></span>
          )}
          
          {/* Timestamp or decorative small text could go here */}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
