import React, { useState, useEffect, useRef } from 'react';
import { loadQAExamples, findBestMatch } from '../knowledgeRetrieval';
import './ChatBot.css';

const suggestionChips = [
  { emoji: '💼', label: "Give me a quick overview of Atishay's experience" },
  { emoji: '🎓', label: "What is Atishay's education qualification" },
  { emoji: '🛠️', label: 'How many years of experience Atishay have?' },
];

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qaExamples, setQaExamples] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [sessionId] = useState(() => {
    try {
      const existing = window.localStorage.getItem('aibot_session_id');
      if (existing) return existing;
      const id = window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      window.localStorage.setItem('aibot_session_id', id);
      return id;
    } catch {
      return `sess_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
  });

  useEffect(() => {
    loadQAExamples().then((data) => setQaExamples(data.examples || []));
  }, []);

  useEffect(() => {
    if (!hasShownWelcome && isOpen) {
      setMessages([
        {
          id: Date.now(),
          text: "Hey — ask me anything about Atishay's work, projects, or experience.",
          sender: 'bot',
        },
      ]);
      setHasShownWelcome(true);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [hasShownWelcome, isOpen]);

  const sendMessage = (userQuery) => {
    const trimmed = userQuery.trim();
    if (!trimmed || isLoading) return;
    setMessages((prev) => [...prev, { id: Date.now(), text: trimmed, sender: 'user' }]);
    setQuery('');
    setIsLoading(true);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    setTimeout(() => {
      const match = findBestMatch(qaExamples, trimmed);
      const answer =
        match?.answer ||
        "I don't have a specific answer for that. You can reach Atishay at hire@atishaykasliwal.com or on LinkedIn at linkedin.com/in/atishay-kasliwal.";
      setMessages((prev) => [...prev, { id: Date.now(), text: answer, sender: 'bot' }]);
      setIsLoading(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        inputRef.current?.focus();
      }, 100);
      fetch(import.meta.env.VITE_LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          userMessage: trimmed,
          botReply: answer,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }, 350);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(query);
  };

  return (
    <>
      <div className="chat-popup-button-wrapper">
        <button
          className="chat-popup-button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
          aria-expanded={isOpen}
          translate="no"
        >
          {isOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="chat-popup-window" aria-label="Ask Atishay anything">
          <div className="chat-widget">
            <div className="chat-widget-header">
              <span className="chat-status-dot" />
              <div>
                <h2 className="chat-widget-title">Ask about Atishay</h2>
                <p className="chat-widget-subtitle">work, projects, experience</p>
              </div>
            </div>

            {messages.filter((m) => m.sender === 'user').length === 0 && (
              <div className="chat-suggestions">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => sendMessage(chip.label)}
                    className="chat-chip"
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="chat-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-message ${msg.sender === 'bot' ? 'chat-message-bot' : 'chat-message-user'}`}
                >
                  <div className="chat-message-content">{msg.text}</div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-message chat-message-bot">
                  <div className="chat-typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="chat-widget-form">
              <div className="chat-input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything..."
                  className="chat-input"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="chat-submit"
                  disabled={!query.trim() || isLoading}
                  aria-label="Send message"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </button>
              </div>
            </form>

            <p className="chat-footer">Just doing my part to help Atishay get hired 🤞</p>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBot;
