import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Sparkles, Trash2, HelpCircle, ArrowLeft } from 'lucide-react';
import { chatApi } from '../../api';

const STORAGE_KEY = 'foodhub.chat.v1';

const QUICK_QUESTIONS = [
  'How do I place an order?',
  'Is delivery free?',
  'How do I track my order?',
  'What payment methods are available?',
  'How do I apply a coupon?',
  'Tell me a joke',
];

const WELCOME = {
  role: 'bot',
  text: "Hi there! 👋 I'm Foodie, the FoodHub AI assistant.\nAsk me about the menu, orders, delivery, payments, coupons, your account — or just chat!",
  suggestions: QUICK_QUESTIONS,
};

const FAQ_GROUPS = [
  { title: 'Ordering', qs: ['How do I place an order?', 'How do I cancel my order?', 'How do I track my order?'] },
  { title: 'Delivery', qs: ['Is delivery free?', 'How fast is delivery?', 'How do I change my delivery address?'] },
  { title: 'Payments', qs: ['What payment methods are available?', 'Are online payments secure?', 'How do I get a refund?'] },
  { title: 'Coupons', qs: ['How do I apply a coupon?', 'Do you have any current offers?', 'Why is my coupon not working?'] },
  { title: 'Menu & Food', qs: ['What are the bestsellers?', 'Do you have veg options?', 'Is anything new on the menu?'] },
  { title: 'Account & Support', qs: ['How do I change my password?', 'How do I contact support?', 'Do you deliver to my area?'] },
];

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
};

export default function ChatWidget() {
  const [state] = useState(loadState);
  const [open, setOpen] = useState(state?.open ?? false);
  const [messages, setMessages] = useState(state?.messages?.length ? state.messages : [WELCOME]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [mode, setMode] = useState('chat');
  const [unread, setUnread] = useState(true);
  const bodyRef = useRef(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open, mode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, open }));
    } catch {
      /* storage unavailable — ignore */
    }
  }, [messages, open]);

  const send = async (text) => {
    const clean = String(text || '').trim();
    if (!clean || typing) return;
    setMode('chat');
    setMessages((m) => [...m, { role: 'user', text: clean }]);
    setInput('');
    setTyping(true);
    try {
      const res = await chatApi.ask(clean);
      setMessages((m) => [...m, { role: 'bot', text: res.data.reply, suggestions: res.data.suggestions || [] }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: "Oops, I couldn't reach the kitchen just now. Please try again in a moment!" }]);
    } finally {
      setTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([WELCOME]);
    setMode('chat');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  };

  const toggle = () => {
    setOpen((o) => !o);
    if (!open) setUnread(false);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={toggle}
        aria-label="Open AI help assistant"
        className="fixed bottom-5 right-5 z-[45] h-14 w-14 rounded-full bg-brand-gradient text-white shadow-glow-lg grid place-items-center hover:scale-105 active:scale-95 transition-transform"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={26} />
            </motion.span>
          ) : (
            <motion.span key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={26} />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && unread && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white dark:border-ink-900 animate-pulse-soft" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed right-4 sm:right-5 z-[45] w-[calc(100vw-2rem)] max-w-[380px] h-[70vh] max-h-[560px] flex flex-col rounded-3xl overflow-hidden shadow-float border border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900"
            style={{ bottom: '5.5rem' }}
          >
            {/* Header */}
            <div className="bg-brand-gradient text-white px-4 py-3.5 flex items-center gap-3 shrink-0">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur grid place-items-center">
                <Bot size={22} />
              </div>
              <div className="min-w-0">
                <p className="font-bold leading-tight flex items-center gap-1.5">Foodie <Sparkles size={14} /></p>
                <p className="text-xs text-white/85 truncate">AI help — 100+ questions, 24/7</p>
              </div>
              <button
                onClick={() => setMode(mode === 'faq' ? 'chat' : 'faq')}
                className="ml-auto p-2 rounded-lg hover:bg-white/15"
                aria-label={mode === 'faq' ? 'Back to chat' : 'Browse FAQ'}
                title={mode === 'faq' ? 'Back to chat' : 'Browse FAQ'}
              >
                {mode === 'faq' ? <ArrowLeft size={18} /> : <HelpCircle size={18} />}
              </button>
              <button onClick={clearChat} className="p-2 rounded-lg hover:bg-white/15" aria-label="Clear chat history" title="Clear chat history">
                <Trash2 size={18} />
              </button>
              <button onClick={toggle} className="p-2 rounded-lg hover:bg-white/15" aria-label="Close chat">
                <X size={20} />
              </button>
            </div>

            {mode === 'faq' ? (
              /* FAQ browser */
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cream dark:bg-ink-950/50">
                <div>
                  <h3 className="font-bold text-ink-900 dark:text-ink-100 mb-1">Quick answers</h3>
                  <p className="text-xs text-ink-500 dark:text-ink-400 mb-3">Tap a question and I'll answer it right here — or type your own below.</p>
                </div>
                {FAQ_GROUPS.map((g) => (
                  <div key={g.title}>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500 dark:text-brand-400 mb-2">{g.title}</p>
                    <div className="flex flex-col gap-1.5">
                      {g.qs.map((q) => (
                        <button
                          key={q}
                          onClick={() => send(q)}
                          className="text-left text-sm font-medium px-3 py-2 rounded-xl bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 text-ink-700 dark:text-ink-200 hover:border-brand-300 dark:hover:border-brand-600 hover:text-brand-600 dark:hover:text-brand-300 transition-colors shadow-card"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Chat messages */
              <div ref={bodyRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-cream dark:bg-ink-950/50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start animate-fade-in-up'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-line ${
                        m.role === 'user'
                          ? 'bg-brand-gradient text-white rounded-br-md shadow-glow'
                          : 'bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 text-ink-800 dark:text-ink-100 rounded-bl-md shadow-card'
                      }`}
                    >
                      {m.text}
                      {m.suggestions?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {(m.suggestions || []).slice(0, 4).map((s) => (
                            <button
                              key={s}
                              onClick={() => send(s)}
                              className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-300 border border-brand-200 dark:border-brand-700 hover:bg-brand-100 transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-white dark:bg-ink-800 border border-ink-100 dark:border-ink-700 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                      {[0, 1, 2].map((d) => (
                        <span key={d} className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="p-3 border-t border-ink-100 dark:border-ink-800 bg-white dark:bg-ink-900 flex items-center gap-2 shrink-0"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Foodie anything…"
                className="input !py-2.5 rounded-full flex-1"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="h-10 w-10 rounded-full bg-brand-gradient text-white grid place-items-center disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shrink-0"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}