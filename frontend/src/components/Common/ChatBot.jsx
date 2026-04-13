import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Bot, User as UserIcon, Minus } from 'lucide-react';
import { knowledgeBase, fallbackResponse } from '../../data/knowledgeBase';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Welcome to CloudNest! I'm NestAI. How can I assist you with your cloud storage today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    // Simulate AI Processing
    setTimeout(() => {
      const response = generateResponse(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
      setIsTyping(false);
    }, 1000);
  };

  const generateResponse = (query) => {
    const q = query.toLowerCase();
    
    // Simple Keyword Matcher
    const match = knowledgeBase.find(item => 
      item.keywords.some(keyword => q.includes(keyword))
    );

    return match ? match.answer : fallbackResponse;
  };

  return (
    <div className="chatbot-wrapper">
      {/* Floating Button */}
      {!isOpen && (
        <button className="chatbot-fab bounce-in" onClick={() => setIsOpen(true)}>
          <MessageCircle size={24} color="white" />
          <span className="fab-badge">1</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-window slide-up glass">
          <div className="chatbot-header">
            <div className="bot-info">
              <div className="bot-avatar">
                <Bot size={18} />
              </div>
              <div>
                <div className="bot-name">NestAI Assistant</div>
                <div className="bot-status">Online</div>
              </div>
            </div>
            <div className="header-actions">
              <button onClick={() => setIsOpen(false)}><Minus size={18} /></button>
            </div>
          </div>

          <div className="chat-body" ref={scrollRef}>
            {messages.map((ms, idx) => (
              <div key={idx} className={`chat-line ${ms.role}`}>
                <div className="bubble">
                  {ms.text}
                </div>
              </div>
            ))}
            {isTyping && (
                <div className="chat-line bot">
                    <div className="bubble typing">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            )}
          </div>

          <div className="chat-input-area">
            <input 
              type="text" 
              placeholder="Ask me anything..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button disabled={!input.trim()} onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
