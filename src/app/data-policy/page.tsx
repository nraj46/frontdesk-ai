export default function DataPolicyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl bg-zinc-950 px-6 py-10 text-zinc-100">
      <p className="mb-2 text-sm">
        <a href="/" className="text-sky-400 hover:underline">← Back to FrontDesk AI</a>
      </p>
      <h1 className="text-3xl font-bold tracking-tight">Data &amp; Privacy Policy</h1>
      <p className="mt-2 text-sm text-zinc-400">
        What FrontDesk AI collects from your customers, what it keeps, and what it never does with
        it. The short version: your customers' information works for your business — and nobody else.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-zinc-300">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-2 text-base font-semibold text-zinc-100">What data FrontDesk AI handles</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Booking details</strong> — customer name, phone number, service, stylist, and appointment time, collected to make the booking.</li>
            <li><strong>Conversation content</strong> — what customers ask the receptionist, used to answer questions and shown to the owner in the conversation log.</li>
            <li><strong>The business knowledge base</strong> — services, prices, hours, and policies the owner provides. This is the only source the receptionist answers from.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-2 text-base font-semibold text-zinc-100">What we do with it</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Booking details go to the business owner so the appointment happens — and nowhere else.</li>
            <li>Conversation logs help the owner see what customers ask about, so the knowledge base (and the business) can improve.</li>
            <li>Phone numbers are used only for booking confirmations and reminders for that appointment.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-red-900/60 bg-red-950/30 p-5">
          <h2 className="mb-2 text-base font-semibold text-zinc-100">What we never do</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Never train models on your customers' conversations or personal details.</strong> Your customers are not training data.</li>
            <li><strong>Never sell or share</strong> customer names, phone numbers, or conversations with third parties, advertisers, or other businesses.</li>
            <li><strong>Never market to your customers</strong> on anyone else's behalf. A phone number given for a haircut confirmation is used for that confirmation — full stop.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-2 text-base font-semibold text-zinc-100">Retention &amp; owner controls</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Conversation logs are retained for 90 days in a production deployment, then deleted; bookings follow the business's own records policy.</li>
            <li>Owners can view, export, or delete any customer's data on request — and customers can ask the business to remove their information at any time.</li>
            <li>If the AI can't answer from the knowledge base, it offers a human handoff instead of guessing with customer data.</li>
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
          <h2 className="mb-2 text-base font-semibold text-zinc-100">About this demo</h2>
          <p>
            This public demo keeps everything in server memory — nothing is written to a database,
            and all data disappears when the server restarts. Please use a fake name and number
            when trying the booking flow.
          </p>
        </section>
      </div>

      <footer className="mt-10 text-xs text-zinc-600">
        FrontDesk AI — the 24/7 AI receptionist for small business. Policy v1.0, November 2026.
      </footer>
    </main>
  );
}
