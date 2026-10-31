# FrontDesk AI — the 24/7 AI Receptionist for Small Business

Small businesses lose bookings every time a call goes to voicemail. **FrontDesk AI** is an AI receptionist that answers customer questions from the business's own knowledge base and books appointments end to end — in chat or by voice — so the phone never goes unanswered.

Demo business: **Luxe Locks Salon**, a hair salon in Dallas. The customer chats with "Luna"; the owner watches bookings land in a live dashboard.

Built with **Next.js + TypeScript**. No API keys needed to run the demo.

## What it does

- **Answers FAQs from the business's knowledge base** — hours, location & parking, cancellation policy, walk-ins, payments, gift cards, products. Retrieval-grounded: it only says what the business's docs say (the RAG pattern), and offers a human handoff instead of guessing.
- **Books appointments end to end** — service → stylist → live availability → name → phone → confirm, with a confirmation code. Bookings appear instantly in the owner dashboard.
- **Voice in and out** — tap the mic to talk (Web Speech API) and toggle voice replies to hear Luna speak, like a phone receptionist.
- **Owner dashboard** — bookings table and a conversation log with the detected intent for every message, so the owner sees what customers ask about.

## Try it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Things to try in the chat:
- "What are your opening hours?" / "Where can I park?" / "What's your cancellation policy?"
- "See services & prices"
- "Book a balayage" → pick a stylist → pick a time → give a name and phone → reply YES
- Watch the booking appear in the dashboard with its confirmation code (LX-1001, …)

## How it works

```
Customer chat / voice (Next.js client)
        │  POST /api/chat  { message, state, sessionId }
        ▼
Receptionist agent (src/lib/agent.ts)
  intent detection → KB retrieval → booking state machine
        │                                    │
        ▼                                    ▼
Knowledge base (business.ts)        Bookings store (store.ts)
services, stylists, policies        → GET /api/bookings (owner dashboard)
                                    → GET /api/logs (conversation intents)
```

The reasoning layer is deterministic so the demo runs anywhere with zero setup. The design is deliberately model-agnostic: keep the `ChatState` contract, let an LLM (OpenAI/Anthropic) classify intents and fill slots for open-ended questions, and keep retrieval + the booking flow as deterministic tools underneath — the same architecture production AI-receptionist products (voice agent platforms, RAG support bots) use.

## Project layout

- `src/lib/business.ts` — the demo business: services, stylists, and FAQ knowledge-base chunks.
- `src/lib/agent.ts` — intent detection, KB retrieval, and the booking state machine.
- `src/lib/store.ts` — in-memory bookings + conversation log (swap for a database in production).
- `src/app/api/chat` — the agent endpoint; `api/bookings` and `api/logs` feed the dashboard.
- `src/app/page.tsx` — customer chat (with voice) + owner dashboard.

## Roadmap ideas

- Plug in an LLM for open-ended questions, with retrieval grounding and a confidence-based handoff.
- Real channels: website widget embed, SMS (Twilio), and phone voice via a voice-agent platform.
- Calendar sync (Google Calendar / Square Appointments) and automated reminders to cut no-shows.
- Multi-business support: an onboarding flow where owners paste their website URL and the KB builds itself.

## License

MIT
