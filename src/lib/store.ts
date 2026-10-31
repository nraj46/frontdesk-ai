/**
 * In-memory store for bookings and conversation logs (globalThis singleton,
 * shared across route handlers). Demo-grade: swap for a database + a real
 * calendar integration (Google Calendar, Square Appointments, etc.) in
 * production.
 */

export interface Booking {
  id: string;
  code: string;
  service: string;
  stylist: string;
  slotLabel: string;
  name: string;
  phone: string;
  createdAt: string;
  source: "chat";
}

export interface ConversationLog {
  id: string;
  at: string;
  sessionId: string;
  customer: string;
  agent: string;
  intent: string;
}

interface Store {
  bookings: Booking[];
  logs: ConversationLog[];
  seq: number;
}

const g = globalThis as unknown as { __frontdesk?: Store };
const store: Store = g.__frontdesk ?? (g.__frontdesk = { bookings: [], logs: [], seq: 0 });

export function nextSeq(): number {
  store.seq += 1;
  return store.seq;
}

export function addBooking(b: Omit<Booking, "id" | "code" | "createdAt">): Booking {
  const n = nextSeq();
  const booking: Booking = {
    ...b,
    id: `bk-${n}`,
    code: `LX-${1000 + n}`,
    createdAt: new Date().toISOString(),
  };
  store.bookings.unshift(booking);
  return booking;
}

export function listBookings(): Booking[] {
  return store.bookings.slice(0, 50);
}

export function addLog(entry: Omit<ConversationLog, "id">): void {
  store.logs.unshift({ ...entry, id: `log-${nextSeq()}` });
  store.logs = store.logs.slice(0, 50);
}

export function listLogs(): ConversationLog[] {
  return store.logs;
}
