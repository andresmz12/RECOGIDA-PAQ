"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { useT } from "@/lib/i18n-context";

interface SupportMessage {
  id: string;
  senderName: string;
  senderRole: string;
  isFromCustomer: boolean;
  body: string;
  createdAt: string;
}

interface Thread {
  customer: { id: string; name: string; email: string };
  lastMessage: SupportMessage | null;
  unreadCount: number;
}

const POLL_MS = 7000;

export default function SoportePage() {
  const { data: session, status } = useSession();
  const { t, lang } = useT();
  const router = useRouter();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const role = (session?.user as any)?.role;

  useEffect(() => {
    if (status === "loading") return;
    if (!["ADMIN", "DISPATCHER"].includes(role)) { router.replace("/dashboard"); return; }
  }, [status, role, router]);

  const loadThreads = async () => {
    try {
      const res = await fetch("/api/support-chat/inbox");
      if (!res.ok) return;
      const data = await res.json();
      setThreads(data.threads ?? []);
    } finally {
      setLoadingThreads(false);
    }
  };

  useEffect(() => {
    if (!["ADMIN", "DISPATCHER"].includes(role)) return;
    loadThreads();
    const id = setInterval(loadThreads, POLL_MS);
    return () => clearInterval(id);
  }, [role]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMessages = async (customerId: string) => {
    const res = await fetch(`/api/support-chat/${customerId}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages ?? []);
    // Reflect the read receipt locally so the badge clears immediately
    setThreads(prev => prev.map(th => th.customer.id === customerId ? { ...th, unreadCount: 0 } : th));
  };

  useEffect(() => {
    if (!selectedId) return;
    loadMessages(selectedId);
    const id = setInterval(() => loadMessages(selectedId), POLL_MS);
    return () => clearInterval(id);
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = input.trim();
    if (!body || sending || !selectedId) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/support-chat/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        await loadMessages(selectedId);
        loadThreads();
      }
    } finally {
      setSending(false);
    }
  };

  const selectedThread = threads.find(th => th.customer.id === selectedId);

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 h-[calc(100vh-56px)] flex flex-col">
        <div className="mb-4 shrink-0">
          <h1 className="text-2xl font-black text-slate-900">{t("soporte.title")}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{t("soporte.subtitle")}</p>
        </div>

        <div className="flex-1 min-h-0 flex gap-4">
          {/* Thread list */}
          <div className="w-72 shrink-0 bg-white border border-slate-200 rounded-2xl overflow-y-auto">
            {loadingThreads ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
              </div>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-slate-400 text-sm">{t("soporte.noThreads")}</p>
              </div>
            ) : (
              threads.map(th => (
                <button
                  key={th.customer.id}
                  onClick={() => setSelectedId(th.customer.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-slate-100 transition-colors ${
                    selectedId === th.customer.id ? "bg-indigo-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <p className="font-semibold text-slate-900 text-sm truncate">{th.customer.name}</p>
                    {th.unreadCount > 0 && (
                      <span className="shrink-0 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {th.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500 text-xs truncate">
                    {th.lastMessage
                      ? `${th.lastMessage.isFromCustomer ? "" : t("soporte.youPrefix") + " "}${th.lastMessage.body}`
                      : ""}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Thread view */}
          <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden">
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-slate-400 text-sm">{t("soporte.selectPrompt")}</p>
              </div>
            ) : (
              <>
                <div className="px-5 py-3.5 border-b border-slate-100 shrink-0">
                  <p className="font-bold text-slate-900 text-sm">{selectedThread.customer.name}</p>
                  <p className="text-slate-400 text-xs">{selectedThread.customer.email}</p>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
                  {messages.map(m => (
                    <div key={m.id} className={`flex ${!m.isFromCustomer ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${
                          !m.isFromCustomer
                            ? "bg-indigo-600 text-white rounded-br-sm"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                        }`}
                      >
                        {!m.isFromCustomer && <p className="text-[10px] font-bold text-indigo-200 mb-0.5">{m.senderName}</p>}
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={`text-[10px] mt-1 ${!m.isFromCustomer ? "text-indigo-200" : "text-slate-400"}`}>
                          {new Date(m.createdAt).toLocaleTimeString(lang === "en" ? "en-US" : "es-CO", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-slate-100 shrink-0">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={t("chat.placeholder")}
                    maxLength={2000}
                    className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="px-4 py-2.5 shrink-0 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                  >
                    {t("soporte.send")}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
