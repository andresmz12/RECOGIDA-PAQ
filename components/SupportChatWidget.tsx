"use client";

import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n-context";

interface SupportMessage {
  id: string;
  senderName: string;
  isFromCustomer: boolean;
  body: string;
  createdAt: string;
}

const POLL_MS = 7000;

// Persistent, always-available support chat for a customer — one
// continuous conversation, not tied to any single pickup request.
export default function SupportChatWidget() {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  const load = async () => {
    try {
      const res = await fetch("/api/support-chat");
      if (!res.ok) return;
      const data = await res.json();
      const msgs: SupportMessage[] = data.messages ?? [];
      if (!open && msgs.length > lastCountRef.current) {
        const newOnes = msgs.slice(lastCountRef.current);
        if (newOnes.some(m => !m.isFromCustomer)) setHasUnread(true);
      }
      lastCountRef.current = msgs.length;
      setMessages(msgs);
    } catch {
      /* silent — chat polling shouldn't surface errors */
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [open, messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) await load();
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-transform hover:scale-105"
        style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}
        aria-label={t("chat.open")}
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
        {!open && hasUnread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm h-[28rem] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 text-white shrink-0" style={{ background: "linear-gradient(135deg,#1d4f86,#2c629b)" }}>
            <p className="font-bold text-sm">{t("chat.title")}</p>
            <p className="text-white/70 text-xs">{t("chat.subtitle")}</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
            {messages.length === 0 ? (
              <p className="text-slate-400 text-xs text-center mt-6">{t("chat.empty")}</p>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`flex ${m.isFromCustomer ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${
                      m.isFromCustomer
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {!m.isFromCustomer && <p className="text-[10px] font-bold text-indigo-500 mb-0.5">{m.senderName}</p>}
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${m.isFromCustomer ? "text-indigo-200" : "text-slate-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString(lang === "en" ? "en-US" : "es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-slate-100 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              maxLength={2000}
              className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
