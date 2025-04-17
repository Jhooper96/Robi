import type { Express } from "express";

type Urgency = "emergency" | "time-sensitive" | "low";

interface LoggedMessage {
  from: string;
  body: string;
  timestamp: string;
  urgency: Urgency;
}

const messages: LoggedMessage[] = [];

function triageMessage(body: string): Urgency {
  const text = body.toLowerCase();

  if (text.includes("flood") || text.includes("fire") || text.includes("gas") || text.includes("water"))
    return "emergency";

  if (text.includes("leak") || text.includes("no heat") || text.includes("broken") || text.includes("outlet"))
    return "time-sensitive";

  return "low";
}

export function setupSMSRoutes(app: Express) {
  app.post("/api/sms", async (req, res) => {
    const { From, Body } = req.body;
    const urgency = triageMessage(Body);

    const message: LoggedMessage = {
      from: From,
      body: Body,
      timestamp: new Date().toISOString(),
      urgency,
    };

    messages.push(message);

    console.log(`📨 [${urgency.toUpperCase()}] ${From}: "${Body}"`);

    // Optional: send auto-response
    res.status(200).send("SMS received");
  });

  app.get("/api/messages", (req, res) => {
    res.json(messages);
  });
}
