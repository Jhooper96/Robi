import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupTwilioWebhook } from "../services/twilio";
import { setupSMSWebhook } from "./smsWebhook";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  setupTwilioWebhook(app);
  setupSMSWebhook(app);

  return httpServer;
}
