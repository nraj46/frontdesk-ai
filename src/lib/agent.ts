import { BUSINESS, KB, SERVICES, STYLISTS } from "./business";
import { addBooking, addLog, type Booking } from "./store";

/**
 * The receptionist agent.
 *
 * Pipeline per message: intent detection → knowledge-base retrieval (the FAQ
 * chunks in business.ts) → booking state machine (service → stylist → slot →
 * name → phone → confirm) → response.
 *
 * The reasoning layer is deterministic so the demo runs with no API keys.
 * In production this is exactly where an LLM call goes: keep the same
 * ChatState contract, let the model pick the intent and fill the slots, and
 * keep retrieval + the booking tools unchanged.
 */

export type Stage = "idle" | "service" | "stylist" | "slot" | "name" | "phone" | "confirm";

export interface Slot {
  id: string;
  label: string;
}

export interface ChatState {
  stage: Stage;
  serviceId?: string;
  stylistId?: string;
  slotLabel?: string;
  slots?: Slot[];
  name?: string;
  phone?: string;
}

export interface ChatOutcome {
  reply: string;
  state: ChatState;
  intent: string;
  quickReplies: string[];
  booking?: Booking;
}

const IDLE_QUICK = ["Book an appointment", "See services & prices", "Opening hours", "Where are you located?"];

export function getSlots(): Slot[] {
  const dayFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const weekdayFmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
  });
  const times = ["10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];
  const slots: Slot[] = [];
  const now = Date.now();
  for (let d = 1; d <= 5 && slots.length < 6; d++) {
    const date = new Date(now + d * 24 * 60 * 60 * 1000);
    if (weekdayFmt.format(date) === "Sun") continue; // closed Sundays
    times.forEach((time, ti) => {
      if (slots.length >= 6) return;
      const taken = (d * 7 + ti * 3) % 4 === 0; // deterministic "already booked" slots
      if (!taken) slots.push({ id: `slot-${slots.length}`, label: `${dayFmt.format(date)} · ${time}` });
    });
  }
  return slots;
}

function serviceList(): string {
  return SERVICES.map(
    (s, i) => `${i + 1}. ${s.name} — $${s.price} (${s.minutes} min)`,
  ).join("\n");
}

function stylistList(): string {
  return STYLISTS.map((s, i) => `${i + 1}. ${s.name} — ${s.specialty}`).join("\n");
}

function retrieveKb(message: string): string | null {
  const lower = message.toLowerCase();
  const words = lower.split(/[^a-z0-9]+/).filter((w) => w.length >= 3);
  let best: { score: number; answer: string } | null = null;
  for (const chunk of KB) {
    const score = chunk.keywords.reduce(
      (acc, kw) =>
        acc + (lower.includes(kw) || words.some((w) => w.startsWith(kw)) ? 1 : 0),
      0,
    );
    if (score > 0 && (!best || score > best.score)) best = { score, answer: chunk.answer };
  }
  return best?.answer ?? null;
}

function matchService(message: string) {
  const m = message.toLowerCase().trim();
  const num = parseInt(m, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= SERVICES.length) return SERVICES[num - 1];
  return SERVICES.find(
    (s) =>
      m.includes(s.id) ||
      s.name.toLowerCase().split(" ").some((w) => w.length > 3 && m.includes(w)),
  );
}

function matchStylist(message: string) {
  const m = message.toLowerCase().trim();
  const num = parseInt(m, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= STYLISTS.length) return STYLISTS[num - 1];
  return STYLISTS.find((s) => m.includes(s.name.toLowerCase()) || m.includes("first") || m.includes("any"));
}

function outcome(
  reply: string,
  state: ChatState,
  intent: string,
  quickReplies: string[] = [],
  booking?: Booking,
): ChatOutcome {
  return { reply, state, intent, quickReplies, booking };
}

export function handleMessage(raw: string, state: ChatState, sessionId: string): ChatOutcome {
  const message = raw.trim();
  const lower = message.toLowerCase();
  let result: ChatOutcome;

  const abort = () =>
    outcome(
      "No problem — I've cancelled that booking. Anything else I can help with?",
      { stage: "idle" },
      "booking-cancelled",
      IDLE_QUICK,
    );

  switch (state.stage) {
    case "service": {
      if (/\b(cancel|stop|never ?mind)\b/.test(lower)) { result = abort(); break; }
      const service = matchService(message);
      if (!service) {
        result = outcome(
          `I didn't catch that — which service would you like?\n${serviceList()}\nReply with a number or the name.`,
          state,
          "booking-service-retry",
        );
        break;
      }
      result = outcome(
        `${service.name} — great choice. Who would you like to book with?\n${stylistList()}`,
        { ...state, stage: "stylist", serviceId: service.id },
        "booking-stylist",
      );
      break;
    }
    case "stylist": {
      if (/\b(cancel|stop|never ?mind)\b/.test(lower)) { result = abort(); break; }
      const stylist = matchStylist(message);
      if (!stylist) {
        result = outcome(
          `Which stylist works for you?\n${stylistList()}`,
          state,
          "booking-stylist-retry",
        );
        break;
      }
      const slots = getSlots();
      result = outcome(
        `Here are the next openings with ${stylist.name}:\n${slots.map((s, i) => `${i + 1}. ${s.label}`).join("\n")}\nReply with a number.`,
        { ...state, stage: "slot", stylistId: stylist.id, slots },
        "booking-slot",
      );
      break;
    }
    case "slot": {
      if (/\b(cancel|stop|never ?mind)\b/.test(lower)) { result = abort(); break; }
      const slots = state.slots ?? getSlots();
      const num = parseInt(lower, 10);
      const slot =
        !Number.isNaN(num) && num >= 1 && num <= slots.length
          ? slots[num - 1]
          : slots.find((s) => lower.includes(s.label.toLowerCase().split("·")[1]?.trim() ?? "###"));
      if (!slot) {
        result = outcome(
          `Pick one of these openings:\n${slots.map((s, i) => `${i + 1}. ${s.label}`).join("\n")}`,
          state,
          "booking-slot-retry",
        );
        break;
      }
      result = outcome(
        `${slot.label} — held for you. What's your name?`,
        { ...state, stage: "name", slotLabel: slot.label },
        "booking-name",
      );
      break;
    }
    case "name": {
      if (/\b(cancel|stop|never ?mind)\b/.test(lower)) { result = abort(); break; }
      if (message.length < 2) {
        result = outcome("What's the name for the booking?", state, "booking-name-retry");
        break;
      }
      result = outcome(
        `Thanks, ${message.split(" ")[0]}! What's the best phone number for your confirmation text?`,
        { ...state, stage: "phone", name: message },
        "booking-phone",
      );
      break;
    }
    case "phone": {
      if (/\b(cancel|stop|never ?mind)\b/.test(lower)) { result = abort(); break; }
      const digits = message.replace(/\D/g, "");
      if (digits.length < 10) {
        result = outcome(
          "I need a 10-digit phone number so we can text your confirmation — could you try again?",
          state,
          "booking-phone-retry",
        );
        break;
      }
      const phone = `(${digits.slice(-10, -7)}) ${digits.slice(-7, -4)}-${digits.slice(-4)}`;
      const service = SERVICES.find((s) => s.id === state.serviceId);
      const stylist = STYLISTS.find((s) => s.id === state.stylistId);
      result = outcome(
        `Almost done — here's your booking:\n• ${service?.name} ($${service?.price})\n• With ${stylist?.name}\n• ${state.slotLabel}\n• For ${state.name}, ${phone}\nReply YES to confirm, or NO to start over.`,
        { ...state, stage: "confirm", phone },
        "booking-confirm",
        ["YES", "NO"],
      );
      break;
    }
    case "confirm": {
      const service = SERVICES.find((s) => s.id === state.serviceId);
      const stylist = STYLISTS.find((s) => s.id === state.stylistId);
      if (/^(yes|y|confirm|book it|sounds good|ok)\b/.test(lower)) {
        const booking = addBooking({
          service: service?.name ?? "Service",
          stylist: stylist?.name ?? "First available",
          slotLabel: state.slotLabel ?? "",
          name: state.name ?? "",
          phone: state.phone ?? "",
          source: "chat",
        });
        result = outcome(
          `You're booked! 🎉\nConfirmation code: ${booking.code}\n${booking.service} with ${booking.stylist}, ${booking.slotLabel}.\nA confirmation text is on its way to ${booking.phone}. Anything else I can help with?`,
          { stage: "idle" },
          "booking-created",
          IDLE_QUICK,
          booking,
        );
      } else {
        result = outcome(
          "No problem — I didn't book anything. Want to pick a different service or time?",
          { stage: "idle" },
          "booking-declined",
          IDLE_QUICK,
        );
      }
      break;
    }
    default: {
      // idle stage: intents + retrieval
      if (/^(hi|hello|hey|good (morning|afternoon|evening))\b/.test(lower)) {
        result = outcome(
          `Hi there! Welcome to ${BUSINESS.name} 💇 I can answer questions about our services, prices, and hours — or book you an appointment. What can I do for you?`,
          state,
          "greeting",
          IDLE_QUICK,
        );
        break;
      }
      const preselected = matchService(message);
      if (/\b(book|appointment|schedule)\b/.test(lower) || (preselected && !lower.includes("?"))) {
        if (preselected && /\b(book|appointment|schedule)\b/.test(lower)) {
          result = outcome(
            `Let's book your ${preselected.name}. Who would you like to book with?\n${stylistList()}`,
            { stage: "stylist", serviceId: preselected.id },
            "booking-stylist",
          );
        } else {
          result = outcome(
            `I'd love to book you in! Which service are you thinking?\n${serviceList()}\nReply with a number or the name.`,
            { stage: "service" },
            "booking-service",
          );
        }
        break;
      }
      if (/\b(price|prices|cost|how much|services|menu|offer)\b/.test(lower)) {
        result = outcome(
          `Here are our services:\n${serviceList()}\nWant me to book one for you?`,
          state,
          "prices",
          ["Book an appointment", "Opening hours"],
        );
        break;
      }
      if (/\b(human|person|real person|owner|manager|call me|phone call)\b/.test(lower)) {
        result = outcome(
          `Of course — you can reach the front desk at ${BUSINESS.phone} during opening hours, or leave your number here and we'll call you back within the hour.`,
          state,
          "handoff",
          IDLE_QUICK,
        );
        break;
      }
      const kb = retrieveKb(message);
      if (kb) {
        result = outcome(kb, state, "faq", IDLE_QUICK);
        break;
      }
      result = outcome(
        `I want to make sure I get that right — I can help with bookings, services & prices, opening hours, directions, and our cancellation policy. Which of those can I help with?`,
        state,
        "fallback",
        IDLE_QUICK,
      );
    }
  }

  addLog({
    at: new Date().toISOString(),
    sessionId,
    customer: raw,
    agent: result.reply,
    intent: result.intent,
  });
  return result;
}
