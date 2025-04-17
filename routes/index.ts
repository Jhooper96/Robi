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
import { setupSMSWebhook } from "./routes/smsWebhook.js";

const registerRoutes = async (app: Express): Promise<Server> => {
  const httpServer = createServer(app);

  setupTwilioWebhook(app);
  setupSMSWebhook(app);

  // Test SMS endpoint
  app.post("/api/test-sms", async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      if (!phoneNumber || !message) {
        return res.status(400).json({ success: false, message: "Phone number and message are required" });
      }
      const messageSid = await sendSMS(phoneNumber, message);
      return res.status(200).json({ success: true, sid: messageSid, message: `SMS sent to ${phoneNumber}` });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get messages
  app.get("/api/messages", async (req, res) => {
    try {
      const filterResult = messageFilterSchema.safeParse(req.query);
      if (!filterResult.success) return res.status(400).json({ message: "Invalid filter parameters" });
      const messages = await storage.getMessages(filterResult.data);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get stats
  app.get("/api/messages/stats", async (req, res) => {
    try {
      const stats = await storage.getMessageStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch message statistics" });
    }
  });

  // Tenants
  app.get("/api/tenants", async (_, res) => {
    try {
      const tenants = await storage.getTenants();
      res.json(tenants);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });

  app.post("/api/tenants", async (req, res) => {
    try {
      const { name, email, phone, propertyId, unitNumber } = req.body;
      if (!name || !unitNumber) return res.status(400).json({ success: false, message: "Name and unit required" });
      if (propertyId) {
        const property = await storage.getProperty(propertyId);
        if (!property) return res.status(404).json({ success: false, message: "Property not found" });
      }
      const newTenant = await storage.createTenant({ name, email, phone, propertyId, unitNumber });
      res.status(201).json(newTenant);
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to create tenant" });
    }
  });

  // Respond to message
  app.post("/api/messages/respond", async (req, res) => {
    try {
      const data = messageResponseSchema.parse(req.body);
      const message = await storage.getMessage(data.messageId);
      if (!message) return res.status(404).json({ message: "Message not found" });

      const updated = await storage.updateMessage(data.messageId, {
        responseContent: data.responseContent,
        respondedAt: new Date(),
        status: "resolved"
      });

      if (message.channel === "sms") await sendSMS(message.metadata.phone, data.responseContent);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to respond to message" });
    }
  });

  // Assign message
  app.post("/api/messages/assign", async (req, res) => {
    try {
      const data = messageAssignSchema.parse(req.body);
      const message = await storage.getMessage(data.messageId);
      if (!message) return res.status(404).json({ message: "Message not found" });

      const updated = await storage.updateMessage(data.messageId, {
        assignedTo: data.userId,
        status: "in_progress"
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign message" });
    }
  });

  // Mark resolved
  app.post("/api/messages/:id/resolve", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      if (!message) return res.status(404).json({ message: "Message not found" });
      const updated = await storage.updateMessage(messageId, { status: "resolved" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to resolve message" });
    }
  });

  // Update status
  app.post("/api/messages/:id/status", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const validation = messageStatusUpdateSchema.safeParse({ messageId, status: req.body.status });
      if (!validation.success) return res.status(400).json({ message: "Invalid status", errors: validation.error.errors });

      const message = await storage.getMessage(messageId);
      if (!message) return res.status(404).json({ message: "Message not found" });

      const updated = await storage.updateMessage(messageId, { status: validation.data.status });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // SendGrid webhook
  app.post("/api/email/incoming", async (req, res) => {
    try {
      await handleIncomingEmail(req.body);
      res.status(200).send("OK");
    } catch (error) {
      res.status(500).json({ message: "Failed to process email" });
    }
  });

  return httpServer;
};

export { registerRoutes };
