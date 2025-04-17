import type { Express } from "express";
import { storage } from "../storage";
import { analyzeTenant, generateAIResponse } from "../ai/openai";
import { sendSMS } from "../services/twilio";

export function setupSMSWebhook(app: Express) {
  app.post("/api/sms", async (req, res) => {
    try {
      const { From, Body } = req.body;

      if (!From || !Body) {
        return res.status(400).send("Missing sender or message body");
      }

      console.log(`[LIVE SMS] Received from ${From}: "${Body}"`);

      // Check if tenant exists, else create temp tenant
      let tenant = await storage.getTenantByPhone(From);
      if (!tenant) {
        console.log(`Creating temp tenant for ${From}`);
        tenant = await storage.createTenant({
          name: `Tenant (${From})`,
          phone: From,
          email: null,
          propertyId: 1,
          unitNumber: "TMP-" + Date.now().toString().slice(-4),
        });
      }

      // Analyze and generate response
      let classification;
      let aiResponse;

      try {
        classification = await analyzeTenant(Body);
        aiResponse = await generateAIResponse(tenant.name, Body, classification);
      } catch (err) {
        console.error("AI fallback triggered:", err);
        classification = {
          urgency: Body.toLowerCase().includes("emergency") ? "emergency" : "medium",
          category: "general",
          summary: "Auto-generated fallback summary",
        };
        aiResponse = `Thanks for your message. A property manager will be with you shortly.`;
      }

      const message = await storage.createMessage({
        tenantId: tenant.id,
        content: Body,
        originalContent: Body,
        channel: "sms",
        urgency: classification.urgency,
        category: classification.category,
        status: "open",
        aiSummary: classification.summary,
        aiResponse: aiResponse,
        metadata: {
          phone: From,
          tenantName: tenant.name,
          unitNumber: tenant.unitNumber,
          propertyName: "Unknown Property",
        },
      });

      // Send the AI-generated reply
      await sendSMS(From, aiResponse);

      res.status(200).json({ messageId: message.id, response: aiResponse });
    } catch (err: any) {
      console.error("Error in SMS webhook:", err);
      res.status(500).send("Server error");
    }
  });
}
