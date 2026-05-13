import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, X, Minus, Sparkles, MessageCircle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/src/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const Chatbot: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load chat history from local storage
    const savedChat = localStorage.getItem('plantripgo_chat_history');
    if (savedChat) {
      setMessages(JSON.parse(savedChat));
    } else {
      // Add welcome message
      const welcome: Message = {
        id: 'welcome',
        role: 'bot',
        text: t('chatbot.welcome'),
        timestamp: new Date().toISOString(),
      };
      setMessages([welcome]);
    }
  }, [t]);

  useEffect(() => {
    // Save chat history
    if (messages.length > 0) {
      localStorage.setItem('plantripgo_chat_history', JSON.stringify(messages));
    }
    // Scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleClearChat = () => {
    localStorage.removeItem('plantripgo_chat_history');
    const welcome: Message = {
      id: 'welcome-' + Date.now(),
      role: 'bot',
      text: t('chatbot.welcome'),
      timestamp: new Date().toISOString(),
    };
    setMessages([welcome]);
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async (textOverride?: string) => {
    const text = textOverride || inputValue.trim();
    if (!text) return;

    if (!textOverride) setInputValue('');
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          text,
          language: i18n.language,
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: data.text || t('chatbot.fallback'),
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: t('chatbot.fallback'),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[110] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] md:w-[400px] h-[550px] bg-luxury-ivory rounded-3xl shadow-[0_30px_60px_-15px_rgba(90,62,54,0.3)] overflow-hidden flex flex-col pointer-events-auto border border-luxury-beige/30"
          >
            {/* Header */}
            <div className="bg-luxury-espresso p-5 flex items-center justify-between border-b border-luxury-beige/10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-luxury-gold flex items-center justify-center shadow-lg shadow-luxury-gold/20">
                  <Sparkles size={20} className="text-luxury-ivory" />
                </div>
                <div>
                  <h3 className="text-luxury-ivory font-serif font-bold text-base leading-none tracking-tight">{t('chatbot.title')}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <p className="text-luxury-gold/60 text-[9px] font-bold uppercase tracking-widest leading-none">AI CONCIERGE</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleClearChat}
                  title={t('chatbot.clearChat')}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-luxury-ivory/60 hover:text-luxury-gold"
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-luxury-ivory/60 hover:text-luxury-ivory"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-luxury-bg/5 scrollbar-none"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={cn(
                    "max-w-[85%] px-4 py-3 rounded-[20px] text-sm leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? 'bg-luxury-espresso text-luxury-ivory rounded-tr-none' 
                      : 'bg-luxury-ivory text-luxury-espresso border border-luxury-beige/20 rounded-tl-none'
                  )}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-luxury-ivory px-4 py-3 rounded-[20px] rounded-tl-none border border-luxury-beige/20 shadow-sm">
                    <div className="flex gap-1.5 px-1 py-1">
                      <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                        className="w-1.5 h-1.5 bg-luxury-gold rounded-full" 
                      />
                      <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                        className="w-1.5 h-1.5 bg-luxury-gold rounded-full" 
                      />
                      <motion.div 
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                        transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                        className="w-1.5 h-1.5 bg-luxury-gold rounded-full" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Predefined Questions */}
            {messages.length === 1 && (
              <div className="px-6 pb-4 bg-luxury-bg/5">
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {[t('chatbot.faq1'), t('chatbot.faq2'), t('chatbot.faq3')].map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(q)}
                      className="whitespace-nowrap px-4 py-2 bg-luxury-ivory border border-luxury-beige/30 rounded-xl text-[10px] font-bold text-luxury-espresso/60 hover:bg-luxury-espresso hover:text-luxury-ivory hover:border-luxury-espresso transition-all shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-5 bg-luxury-ivory border-t border-luxury-beige/10">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t('chatbot.placeholder')}
                  className="w-full bg-luxury-bg/40 border border-luxury-beige/30 rounded-2xl px-5 py-4 pr-14 text-sm focus:outline-none focus:border-luxury-gold/50 transition-all placeholder:text-luxury-cacao/40 shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-luxury-espresso text-luxury-ivory rounded-xl hover:bg-luxury-gold transition-colors disabled:opacity-20 shadow-lg shadow-luxury-espresso/10"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-luxury-espresso rounded-[24px] shadow-[0_20px_40px_-10px_rgba(90,62,54,0.4)] flex items-center justify-center text-white pointer-events-auto group relative overflow-hidden border border-luxury-beige/10"
      >
        <div className="absolute inset-0 bg-luxury-gold opacity-0 group-hover:opacity-10 transition-opacity" />
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X size={28} />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
              className="relative"
            >
              <MessageCircle size={28} />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-luxury-gold border-2 border-luxury-espresso rounded-full led-glow" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default Chatbot;
