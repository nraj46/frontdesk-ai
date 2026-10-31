import { handleMessage, type ChatState } from "@/lib/agent";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: string;
    state?: ChatState;
    sessionId?: string;
  };
  if (!body.message) {
    return Response.json({ error: "Expected { message, state, sessionId }" }, { status: 400 });
  }
  const state: ChatState = body.state ?? { stage: "idle" };
  const result = handleMessage(body.message, state, body.sessionId ?? "anonymous");
  return Response.json(result);
}
