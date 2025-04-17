import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  messageFilterSchema,
  messageResponseSchema,
  messageAssignSchema,
  messageStatusUpdateSchema
} from "@shared/schema";
import { analyzeTenant, generateAIResponse } from "./ai/openai";
import { setupTwilioWebhook, sendSMS } from "./services/twilio";
import { handleIncomingEmail } from "./services/sendgrid";
import { setupSMSWebhook } from "./routes/smsWebhook";

const registerRoutes = async (app: Express): Promise<Server> => {
  const httpServer = createServer(app);

  // ✅ All routes MUST be inside this function to access `app`
  setupTwilioWebhook(app);
  setupSMSWebhook(app);

  // --- START OF ALL YOUR ROUTES ---

  // Test endpoint for sending SMS
  app.post("/api/test-sms", async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      if (!phoneNumber || !message) {
        return res.status(400).json({
          success: false,
          message: "Phone number and message are required"
        });
      }

      const messageSid = await sendSMS(phoneNumber, message);
      return res.status(200).json({
        success: true,
        sid: messageSid,
        message: `SMS sent successfully to ${phoneNumber}`
      });
    } catch (error: any) {
      console.error("SMS error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  // 💡 INSERT ALL YOUR OTHER ROUTES RIGHT HERE — EXACTLY AS THEY WERE
  //     (GET tenants, POST tenants, assign, status, etc.)

  return httpServer;
};

export { registerRoutes };
