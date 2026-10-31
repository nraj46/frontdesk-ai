/**
 * The demo business: a hair salon in Dallas.
 * In production this content would come from the owner's website, Google
 * Business profile, and policy documents — chunked and embedded for RAG.
 * Here it is a small structured knowledge base the agent retrieves from.
 */

export interface Service {
  id: string;
  name: string;
  price: number;
  minutes: number;
  blurb: string;
}

export interface Stylist {
  id: string;
  name: string;
  specialty: string;
}

export const BUSINESS = {
  name: "Luxe Locks Salon",
  city: "Dallas, TX",
  phone: "(214) 555-0134",
  address: "4210 McKinney Ave, Dallas, TX 75205",
  hours: {
    "Mon–Fri": "9:00 AM – 7:00 PM",
    Sat: "9:00 AM – 5:00 PM",
    Sun: "Closed",
  } as Record<string, string>,
};

export const SERVICES: Service[] = [
  { id: "cut", name: "Haircut & Style", price: 65, minutes: 60, blurb: "Consultation, cut, wash, and finish." },
  { id: "color", name: "Full Color", price: 120, minutes: 120, blurb: "Single-process color with gloss treatment." },
  { id: "balayage", name: "Balayage", price: 185, minutes: 150, blurb: "Hand-painted highlights with toner." },
  { id: "blowout", name: "Blowout", price: 45, minutes: 45, blurb: "Wash and blow-dry styling." },
  { id: "treatment", name: "Deep Conditioning Treatment", price: 40, minutes: 30, blurb: "Repair treatment for dry or damaged hair." },
  { id: "kids", name: "Kids Cut (under 12)", price: 35, minutes: 30, blurb: "Gentle cut for young guests." },
];

export const STYLISTS: Stylist[] = [
  { id: "any", name: "First available", specialty: "Whoever is free first" },
  { id: "maya", name: "Maya", specialty: "Color and balayage" },
  { id: "jordan", name: "Jordan", specialty: "Precision cuts" },
  { id: "priya", name: "Priya", specialty: "Styling and treatments" },
];

export interface KbChunk {
  id: string;
  topic: string;
  keywords: string[];
  answer: string;
}

export const KB: KbChunk[] = [
  {
    id: "hours",
    topic: "Hours",
    keywords: ["hour", "open", "close", "when", "sunday", "saturday", "weekend"],
    answer:
      "We're open Mon–Fri 9 AM–7 PM, Saturday 9 AM–5 PM, and closed on Sundays. Want me to book you a slot?",
  },
  {
    id: "location",
    topic: "Location & parking",
    keywords: ["where", "located", "address", "park", "parking", "directions", "uptown"],
    answer:
      "You'll find us at 4210 McKinney Ave in Uptown Dallas. There's free parking behind the building, and we're a 5-minute walk from the McKinney Ave trolley stop.",
  },
  {
    id: "cancel",
    topic: "Cancellation policy",
    keywords: ["cancel", "reschedule", "policy", "late", "no-show", "noshow", "fee", "change"],
    answer:
      "Life happens! You can cancel or reschedule free of charge up to 4 hours before your appointment. Later cancellations and no-shows are charged 50% of the service price.",
  },
  {
    id: "walkins",
    topic: "Walk-ins",
    keywords: ["walk", "walkin", "walk-in", "without appointment", "drop in"],
    answer:
      "We take walk-ins when a chair is free, but weekends fill up fast — booking ahead is the safe bet. I can check the next openings for you right now.",
  },
  {
    id: "payment",
    topic: "Payment",
    keywords: ["pay", "payment", "card", "cash", "apple pay", "tip", "gratuity"],
    answer:
      "We accept all major cards, Apple Pay, and cash. Tips are never expected but always appreciated — you can add them on the card or in cash.",
  },
  {
    id: "products",
    topic: "Products",
    keywords: ["product", "shampoo", "sell", "buy", "brand", "olaplex", "kerastase"],
    answer:
      "We carry Olaplex and Kérastase in the salon, and your stylist can recommend a take-home routine for your hair type after your service.",
  },
  {
    id: "giftcards",
    topic: "Gift cards",
    keywords: ["gift", "giftcard", "gift card", "certificate", "present"],
    answer:
      "Gift cards are available in any amount from $25, in the salon or by phone at (214) 555-0134. They never expire.",
  },
  {
    id: "covid",
    topic: "Health & safety",
    keywords: ["mask", "sick", "covid", "sanitize", "clean", "health"],
    answer:
      "Tools and stations are sanitized between every guest. If you're feeling unwell, we're happy to reschedule you free of charge — just let us know.",
  },
];
