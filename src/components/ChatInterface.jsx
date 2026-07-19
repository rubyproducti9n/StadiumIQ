import React, { useState, useEffect, useRef } from 'react';
import { logCustomEvent } from '../services/analytics';

export default function ChatInterface({
  messages = [],
  isLoading = false,
  error = null,
  onSendMessage,
  currentPersona,
  crowdData,
  languageDetectionFailed = false,
  setLanguageDetectionFailed
}) {
  const [inputText, setInputText] = useState('');
  const [selectedLang, setSelectedLang] = useState('en');
  const messagesEndRef = useRef(null);

  const handleLanguageConfirm = () => {
    const langMap = {
      en: { language: 'English', iso: 'en' },
      es: { language: 'Spanish', iso: 'es' },
      fr: { language: 'French', iso: 'fr' },
      ar: { language: 'Arabic', iso: 'ar' },
      pt: { language: 'Portuguese', iso: 'pt' },
      de: { language: 'German', iso: 'de' }
    };
    const selected = langMap[selectedLang];
    if (selected) {
      sessionStorage.setItem('detected_language', JSON.stringify({ ...selected, confidence: 1.0 }));
      logCustomEvent('language_detected', { language: selected.language, iso: selected.iso, confidence: 1.0, source: 'fallback_dropdown' });
      if (setLanguageDetectionFailed) {
        setLanguageDetectionFailed(false);
      }
      
      const lastUserMsg = [...messages].reverse().find(msg => msg.role === 'user');
      if (lastUserMsg && onSendMessage) {
        onSendMessage(lastUserMsg.text);
      }
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className="flex flex-col h-[500px] border border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
      {/* Messages area */}
      <div 
        role="log" 
        aria-live="polite" 
        className="flex-1 p-4 overflow-y-auto space-y-4"
      >
        {messages.length === 0 && currentPersona?.suggestedQuestions && (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <p className="text-gray-500 font-medium">Hello! Choose a suggested question to start:</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {currentPersona.suggestedQuestions.slice(0, 4).map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(question)}
                  className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div 
              key={msg.id} 
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] rounded-lg px-4 py-2 shadow-sm ${
                  isUser 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
                <span className={`block text-[10px] text-right mt-1 ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-600 text-sm rounded-lg px-4 py-2 rounded-bl-none animate-pulse">
              StadiumIQ is thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-100 border-t border-b border-red-200 text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Fallback UI: Choose your language */}
      {languageDetectionFailed && (
        <div className="px-4 py-3 bg-blue-50 border-t border-b border-blue-200 text-blue-800 text-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col">
            <strong className="font-semibold">Choose your language:</strong>
            <span className="text-xs text-blue-600">Language detection failed. Please select your language to proceed.</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-blue-300 rounded text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English (EN)</option>
              <option value="es">Spanish (ES)</option>
              <option value="fr">French (FR)</option>
              <option value="ar">Arabic (AR)</option>
              <option value="pt">Portuguese (PT)</option>
              <option value="de">German (DE)</option>
            </select>
            <button
              type="button"
              onClick={handleLanguageConfirm}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          aria-label="Chat input"
          placeholder="Ask me anything about the stadium..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          aria-label="Send message"
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
