import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "../storage";
import {
  messageFilterSchema,
  messageResponseSchema,
  messageAssignSchema,
  messageStatusUpdateSchema,
} from "../../shared/schema";
import { analyzeTenant, generateAIResponse } from "../ai/openai";
import { setupTwilioWebhook, sendSMS } from "../services/twilio";
import { handleIncomingEmail } from "../services/sendgrid";
import { setupSMSWebhook } from "./smsWebhook";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  setupTwilioWebhook(app);
  setupSMSWebhook(app);
  return httpServer;
}
