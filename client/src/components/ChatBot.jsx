import { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import api from '../api/client';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';

const QUICK_QUESTIONS = [
    "How many emails did I send this month?",
    "What's my open rate?",
    "Any replies today?",
    "How do I set up follow-ups?",
    "Tips to improve my outreach",
];

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hi! 👋 I'm your **AutoMindz Assistant**. Ask me anything about your outreach — stats, performance, how-to, or best practices!" },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const sendMessage = async (question) => {
        const q = question || input.trim();
        if (!q || loading) return;

        setMessages(prev => [...prev, { role: 'user', text: q }]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post('/chatbot/ask', { question: q });
            setMessages(prev => [...prev, { role: 'bot', text: res.data.answer }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'bot', text: `⚠️ ${e.response?.data?.error || 'Something went wrong. Please try again.'}` }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Simple markdown: bold, bullet points, code
    const renderMarkdown = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n- /g, '\n• ')
            .replace(/`([^`]+)`/g, '<code class="bg-surface-200 dark:bg-surface-700 px-1 py-0.5 rounded text-xs">$1</code>')
            .replace(/\n/g, '<br/>');
    };

    return (
        <>
            {/* Floating Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
                    title="Chat with AI Assistant"
                >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-surface-900 animate-pulse" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[560px] flex flex-col rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden bg-white dark:bg-surface-900 animate-in slide-in-from-bottom-5 duration-300">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-primary-500 to-accent-500 text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">AutoMindz Assistant</h3>
                                <p className="text-[10px] opacity-80">Powered by Gemini AI</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'bot'
                                        ? 'bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30'
                                        : 'bg-surface-200 dark:bg-surface-700'
                                    }`}>
                                    {msg.role === 'bot' ? <Sparkles className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" /> : <User className="w-3.5 h-3.5 text-surface-600 dark:text-surface-400" />}
                                </div>
                                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'bot'
                                        ? 'bg-surface-100 dark:bg-surface-800 text-surface-800 dark:text-surface-200 rounded-tl-sm'
                                        : 'bg-primary-500 text-white rounded-tr-sm'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.role === 'bot' ? renderMarkdown(msg.text) : msg.text) }}
                                />
                            </div>
                        ))}

                        {loading && (
                            <div className="flex gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="bg-surface-100 dark:bg-surface-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Questions (only show when few messages) */}
                    {messages.length <= 2 && !loading && (
                        <div className="px-4 pb-2 shrink-0">
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_QUESTIONS.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(q)}
                                        className="text-[11px] px-2.5 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/20 dark:hover:text-primary-400 transition-colors border border-surface-200 dark:border-surface-700"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input */}
                    <div className="px-4 py-3 border-t border-surface-200 dark:border-surface-700 shrink-0 bg-surface-50 dark:bg-surface-800/50">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Ask anything about your outreach..."
                                className="flex-1 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all placeholder:text-surface-400"
                                disabled={loading}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || loading}
                                className="w-10 h-10 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-surface-300 dark:disabled:bg-surface-700 text-white flex items-center justify-center transition-colors shrink-0"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
