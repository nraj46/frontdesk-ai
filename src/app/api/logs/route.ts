import { connection } from "next/server";
import { listLogs } from "@/lib/store";

export async function GET() {
  await connection();
  return Response.json({ logs: listLogs() });
}
