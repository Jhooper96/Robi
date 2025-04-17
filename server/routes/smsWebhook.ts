import type { Express } from "express";
import { analyzeTenant, generateAIResponse } from "../ai/openai";
import { storage } from "../storage";
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
          phone:
