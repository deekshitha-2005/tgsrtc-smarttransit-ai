import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, AlertTriangle, Phone, Bus } from 'lucide-react';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "👋 **Namaskaram!** Welcome to TGSRTC AI Transit Assistant.\n\nAsk me about Hyderabad routes, schedules, driver contacts, or rain delays.\n\n*Ameerpet nundi Koti ki bus undha? (Is there a bus from Ameerpet to Koti?)*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestions = [
    "Ameerpet nundi Koti ki bus undha?",
    "Show rain waterlogging alerts",
    "driver contact for TS09Z 1001",
    "Secunderabad to Gachibowli buses"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: textToSend }),
      });
      const data = await response.json();

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: data.response,
          type: data.type,
          payload: data.data,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          text: "⚠️ **Connection Error:** Could not contact the transit AI backend. Please verify that the FastAPI backend server is running on `http://localhost:8000`.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputText);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-all duration-200 cursor-pointer pulse-alert"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Expanded Chat Box */}
      {isOpen && (
        <div className="w-[380px] h-[550px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-10 duration-200">
          {/* Header */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-rose-600/10 p-1.5 rounded-lg border border-rose-500/20">
                <Bot className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs text-slate-100 uppercase tracking-widest">
                  TGSRTC AI Assistant
                </h3>
                <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-semibold mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live Agent Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md leading-relaxed whitespace-pre-line ${
                      isBot
                        ? 'bg-slate-800/80 text-slate-200 border border-slate-700/50'
                        : 'bg-rose-600 text-white font-medium'
                    }`}
                  >
                    {msg.text}

                    {/* Render rich visual helper blocks inside bubbles based on type */}
                    {isBot && msg.type === 'contact_info' && msg.payload && (
                      <div className="mt-3 bg-slate-900 border border-slate-850 p-2.5 rounded-xl space-y-1.5 text-[10px]">
                        <p className="font-bold text-slate-400">🚨 EMERGENCY CONTACT CARD</p>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Driver: {msg.payload.driver.name}</span>
                          <a href={`tel:${msg.payload.driver.phone}`} className="text-rose-400 font-bold hover:underline flex items-center gap-0.5">
                            <Phone className="h-3 w-3" /> Call
                          </a>
                        </div>
                        <div className="flex justify-between items-center text-slate-300">
                          <span>Conductor: {msg.payload.conductor.name}</span>
                          <a href={`tel:${msg.payload.conductor.phone}`} className="text-rose-400 font-bold hover:underline flex items-center gap-0.5">
                            <Phone className="h-3 w-3" /> Call
                          </a>
                        </div>
                      </div>
                    )}

                    {isBot && msg.type === 'disruptions' && msg.payload && (
                      <div className="mt-3 space-y-2">
                        {msg.payload.map((dis, dIdx) => (
                          <div key={dIdx} className="bg-rose-950/20 border border-rose-900/30 p-2.5 rounded-xl text-[10px] flex gap-2">
                            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                            <div>
                              <p className="font-bold text-rose-300">{dis.type} at {dis.location}</p>
                              <p className="text-slate-400 mt-0.5">{dis.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 font-medium mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex flex-col items-start">
                <div className="bg-slate-800/80 text-slate-400 rounded-2xl px-4 py-3 text-xs border border-slate-700/50 flex gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Prompt Suggestions */}
          <div className="px-4 py-2 border-t border-slate-800/50 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
            {suggestions.map((sug, sIdx) => (
              <button
                key={sIdx}
                onClick={() => handleSendMessage(sug)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/50 text-[10px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer font-semibold"
              >
                {sug}
              </button>
            ))}
          </div>

          {/* Form Input */}
          <form
            onSubmit={handleFormSubmit}
            className="p-4 bg-slate-950 border-t border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask TGSRTC SmartTransit AI..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-semibold"
            />
            <button
              type="submit"
              className="bg-rose-600 hover:bg-rose-500 text-white p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
