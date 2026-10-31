import { connection } from "next/server";
import { listBookings } from "@/lib/store";

export async function GET() {
  await connection();
  return Response.json({ bookings: listBookings() });
}
