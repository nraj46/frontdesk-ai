"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ChatState {
  stage: string;
  [key: string]: unknown;
}

interface Booking {
  id: string;
  code: string;
  service: string;
  stylist: string;
  slotLabel: string;
  name: string;
  phone: string;
  createdAt: string;
}

interface LogEntry {
  id: string;
  at: string;
  customer: string;
  intent: string;
}

interface Msg {
  role: "agent" | "user";
  text: string;
}

const GREETING =
  "Hi! I'm Luna, the AI receptionist at Luxe Locks Salon 💇 I can answer questions about services, prices, and hours — or book you an appointment in under a minute. How can I help?";

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "agent", text: GREETING }]);
  const [input, setInput] = useState("");
  const [chatState, setChatState] = useState<ChatState>({ stage: "idle" });
  const [quickReplies, setQuickReplies] = useState<string[]>([
    "Book an appointment",
    "See services & prices",
    "Opening hours",
    "Where are you located?",
  ]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sending, setSending] = useState(false);
  const [voiceOn, setVoiceOn] = useState(false);
  const [listening, setListening] = useState(false);
  const sessionId = useRef("web-session");
  useEffect(() => {
    sessionId.current = `web-${Math.random().toString(36).slice(2, 8)}`;
  }, []);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshDashboard = useCallback(async () => {
    const [b, l] = await Promise.all([
      fetch("/api/bookings").then((r) => r.json()),
      fetch("/api/logs").then((r) => r.json()),
    ]);
    setBookings(b.bookings ?? []);
    setLogs(l.logs ?? []);
  }, []);

  useEffect(() => {
    refreshDashboard().catch(() => {});
    const id = setInterval(() => refreshDashboard().catch(() => {}), 4000);
    return () => clearInterval(id);
  }, [refreshDashboard]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function speak(text: string) {
    if (!("speechSynthesis" in window)) return;
    const clean = text.replace(/[\n•-]/g, " ").replace(/[^\x20-\x7E ]/g, "");
    const utter = new SpeechSynthesisUtterance(clean);
    utter.rate = 1.02;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setInput("");
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, state: chatState, sessionId: sessionId.current }),
      });
      const data = await res.json();
      setChatState(data.state ?? { stage: "idle" });
      setQuickReplies(data.quickReplies ?? []);
      setMessages((m) => [...m, { role: "agent", text: data.reply }]);
      if (voiceOn) speak(data.reply);
      refreshDashboard().catch(() => {});
    } catch {
      setMessages((m) => [
        ...m,
        { role: "agent", text: "Sorry — I had a connection hiccup. Please try that once more." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function startListening() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRec;
      webkitSpeechRecognition?: new () => SpeechRec;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setMessages((m) => [
        ...m,
        {
          role: "agent",
          text: "Voice input isn't supported in this browser — Chrome works best. You can still type, and tap the speaker to hear my replies.",
        },
      ]);
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.onresult = (event: SpeechRecEvent) => {
      const transcript = event.results[0][0].transcript;
      setListening(false);
      send(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }

  interface SpeechRec {
    lang: string;
    interimResults: boolean;
    onresult: ((event: SpeechRecEvent) => void) | null;
    onend: (() => void) | null;
    onerror: (() => void) | null;
    start: () => void;
  }
  interface SpeechRecEvent {
    results: { [index: number]: { [index: number]: { transcript: string } } };
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl bg-zinc-950 px-6 py-10 text-zinc-100">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          FrontDesk AI <span className="font-normal text-zinc-500">— the 24/7 AI receptionist</span>
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-zinc-400">
          Small businesses lose bookings every time a call goes to voicemail. FrontDesk AI answers
          customer questions from the business's own knowledge base and books appointments in chat
          or by voice — no phone tag, no missed calls. Demo business:{" "}
          <span className="text-zinc-200">Luxe Locks Salon, Dallas</span>.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* Customer chat */}
        <section className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <div>
              <p className="text-sm font-semibold">Luxe Locks Salon</p>
              <p className="text-xs text-emerald-400">● Luna is online — replies instantly</p>
            </div>
            <button
              onClick={() => {
                const next = !voiceOn;
                setVoiceOn(next);
                if (!next && "speechSynthesis" in window) window.speechSynthesis.cancel();
              }}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                voiceOn
                  ? "border-sky-500/50 bg-sky-500/15 text-sky-300"
                  : "border-zinc-700 text-zinc-400 hover:bg-zinc-800"
              }`}
              title="Hear Luna's replies out loud"
            >
              🔊 Voice replies {voiceOn ? "on" : "off"}
            </button>
          </div>

          <div ref={scrollRef} className="h-[430px] space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-sky-600 text-white"
                      : "border border-zinc-800 bg-zinc-950 text-zinc-200"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && <p className="text-xs text-zinc-500">Luna is typing…</p>}
          </div>

          {quickReplies.length > 0 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            className="flex gap-2 border-t border-zinc-800 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <button
              type="button"
              onClick={startListening}
              className={`rounded-md border px-3 text-sm ${
                listening
                  ? "border-red-500/60 bg-red-500/15 text-red-300"
                  : "border-zinc-700 hover:bg-zinc-800"
              }`}
              title="Speak instead of typing"
            >
              {listening ? "● Listening…" : "🎙️"}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about prices, hours… or say 'book a haircut'"
              className="flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>

        {/* Owner dashboard */}
        <section className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold">
              Owner dashboard{" "}
              <span className="text-sm font-normal text-zinc-500">
                — bookings land here in real time
              </span>
            </h2>
            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900 text-xs uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-2">Code</th>
                    <th className="px-4 py-2">Service</th>
                    <th className="px-4 py-2">Stylist</th>
                    <th className="px-4 py-2">When</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-t border-zinc-800">
                      <td className="px-4 py-2 font-mono text-xs text-sky-300">{b.code}</td>
                      <td className="px-4 py-2">{b.service}</td>
                      <td className="px-4 py-2">{b.stylist}</td>
                      <td className="px-4 py-2 text-zinc-400">{b.slotLabel}</td>
                      <td className="px-4 py-2">{b.name}</td>
                      <td className="px-4 py-2 text-zinc-400">{b.phone}</td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-zinc-500">
                        No bookings yet — book one in the chat and watch it appear here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Recent conversations</h2>
            <div className="space-y-2">
              {logs.slice(0, 6).map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm"
                >
                  <span className="max-w-md truncate text-zinc-300">“{l.customer}”</span>
                  <span className="ml-3 shrink-0 rounded-full border border-zinc-700 px-2 py-0.5 font-mono text-[11px] text-zinc-400">
                    {l.intent}
                  </span>
                </div>
              ))}
              {logs.length === 0 && <p className="text-sm text-zinc-500">No conversations yet.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
            <p className="mb-1 font-semibold text-zinc-200">Why owners buy this</p>
            <p>
              A missed call is a missed booking. FrontDesk AI answers instantly at 2 PM or 2 AM,
              only says what the business's own knowledge base says, and books straight into the
              owner's dashboard — the owner never touches it until the customer walks in.
            </p>
          </div>
        </section>
      </div>

      <footer className="mt-10 text-xs text-zinc-600">
        Built with Next.js + TypeScript. The agent's retrieval and booking pipeline is
        model-agnostic — plug in an LLM for open-ended questions, keep deterministic tools for
        bookings. Demo data is in-memory.
      </footer>
    </main>
  );
}
