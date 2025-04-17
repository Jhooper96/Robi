import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { messageFilterSchema, messageResponseSchema, messageAssignSchema, messageStatusUpdateSchema } from "@shared/schema";
import { analyzeTenant, generateAIResponse } from "./ai/openai";
import { setupTwilioWebhook, sendSMS } from "./services/twilio";
import { handleIncomingEmail } from "./services/sendgrid";
import { setupSMSWebhook } from "./routes/smsWebhook";

export async function registerRoutes(app: Express): Promise<Server> {
const httpServer = createServer(app);
  return httpServer;
}
  // Set up Twilio webhook endpoints
  setupTwilioWebhook(app);
  setupSMSWebhook(app);

  // Test endpoint for sending SMS messages
  app.post("/api/test-sms", async (req, res) => {
    try {
      const { phoneNumber, message } = req.body;
      
      if (!phoneNumber || !message) {
        return res.status(400).json({ 
          success: false, 
          message: "Phone number and message are required" 
        });
      }
      
      console.log(`Attempting to send SMS to ${phoneNumber} with message: "${message}"`);
      console.log(`Using Twilio phone number: ${process.env.TWILIO_PHONE_NUMBER}`);
      
      try {
        const messageSid = await sendSMS(phoneNumber, message);
        console.log(`SMS sent successfully, SID: ${messageSid}`);
        
        return res.status(200).json({ 
          success: true, 
          sid: messageSid,
          message: `SMS sent successfully to ${phoneNumber}`
        });
      } catch (twilioError: any) {
        console.error("Twilio API Error:", twilioError);
        
        // Check for common Twilio errors
        let errorMessage = "Failed to send SMS message";
        let errorDetails = twilioError.message;
        let recommendation = "";
        
        // Add specific advice for common error codes
        if (twilioError.code) {
          if (twilioError.code === 21211) {
            errorMessage = "Invalid phone number format";
            errorDetails = "Please use E.164 format (e.g., +15551234567)";
            recommendation = "Make sure your phone number starts with + followed by country code and number with no spaces or special characters.";
          } else if (twilioError.code === 21608) {
            errorMessage = "Unverified recipient number";
            errorDetails = "This phone number is not verified in your Twilio trial account";
            recommendation = "In trial accounts, you must verify each recipient phone number in the Twilio console before sending messages to it. Log into your Twilio account, go to 'Phone Numbers' > 'Verified Caller IDs' and add this number.";
          } else if (twilioError.code === 21219) {
            errorMessage = "Invalid sender phone number";
            errorDetails = "Check if your Twilio phone number is properly set up";
            recommendation = "Verify that you've purchased a Twilio phone number and that the TWILIO_PHONE_NUMBER environment variable is properly set.";
          } else if (twilioError.code === 20003) {
            errorMessage = "Authentication Failed";
            errorDetails = "Your Twilio API credentials are invalid";
            recommendation = "Check that your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables are correct.";
          } else if (twilioError.code === 20404) {
            errorMessage = "Resource not found";
            errorDetails = "The requested Twilio resource could not be found";
            recommendation = "Your Twilio account may not be properly set up or might be suspended. Check your account status in the Twilio console.";
          }
        }
        
        return res.status(400).json({ 
          success: false, 
          message: errorMessage,
          error: errorDetails,
          recommendation,
          code: twilioError.code
        });
      }
    } catch (error: any) {
      console.error("Server error sending test SMS:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Server error processing SMS request",
        error: error.message
      });
    }
  });

  // API routes
  // Get all messages with optional filtering
  app.get("/api/messages", async (req, res) => {
    try {
      // Validate filters
      const filterResult = messageFilterSchema.safeParse(req.query);
      if (!filterResult.success) {
        return res.status(400).json({ message: "Invalid filter parameters" });
      }

      const messages = await storage.getMessages(filterResult.data);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get message statistics
  app.get("/api/messages/stats", async (req, res) => {
    try {
      const stats = await storage.getMessageStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching message stats:", error);
      res.status(500).json({ message: "Failed to fetch message statistics" });
    }
  });

  // Get properties
  app.get("/api/properties", async (req, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: "Failed to fetch properties" });
    }
  });

  // Get tenants
  app.get("/api/tenants", async (req, res) => {
    try {
      const tenants = await storage.getTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ message: "Failed to fetch tenants" });
    }
  });
  
  // Create a new tenant
  app.post("/api/tenants", async (req, res) => {
    try {
      const { name, email, phone, propertyId, unitNumber } = req.body;
      
      // Basic validation
      if (!name || !unitNumber) {
        return res.status(400).json({ 
          success: false,
          message: "Name and unit number are required" 
        });
      }
      
      // Check that property exists if propertyId is provided
      if (propertyId) {
        const property = await storage.getProperty(propertyId);
        if (!property) {
          return res.status(404).json({ 
            success: false,
            message: "Property not found"
          });
        }
      }
      
      // Create the tenant
      const newTenant = await storage.createTenant({
        name,
        email: email || null,
        phone: phone || null,
        propertyId: propertyId || null,
        unitNumber
      });
      
      return res.status(201).json(newTenant);
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to create tenant" 
      });
    }
  });

  // Respond to message
  app.post("/api/messages/respond", async (req, res) => {
    try {
      const responseData = messageResponseSchema.parse(req.body);
      const message = await storage.getMessage(responseData.messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Update message with response
      const updatedMessage = await storage.updateMessage(responseData.messageId, {
        responseContent: responseData.responseContent,
        respondedAt: new Date(),
        status: "resolved"
      });

      // Send the response via the appropriate channel
      if (message.channel === "sms") {
        await sendSMS(message.metadata.phone, responseData.responseContent);
      } else if (message.channel === "email") {
        // Send email response using SendGrid
        // Implementation in sendgrid.ts
      }

      res.json(updatedMessage);
    } catch (error) {
      console.error("Error responding to message:", error);
      res.status(500).json({ message: "Failed to respond to message" });
    }
  });

  // Assign message
  app.post("/api/messages/assign", async (req, res) => {
    try {
      const assignData = messageAssignSchema.parse(req.body);
      const message = await storage.getMessage(assignData.messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Update message with assignment
      const updatedMessage = await storage.updateMessage(assignData.messageId, {
        assignedTo: assignData.userId,
        status: "in_progress"
      });

      res.json(updatedMessage);
    } catch (error) {
      console.error("Error assigning message:", error);
      res.status(500).json({ message: "Failed to assign message" });
    }
  });

  // Mark message as resolved
  app.post("/api/messages/:id/resolve", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Update message status
      const updatedMessage = await storage.updateMessage(messageId, {
        status: "resolved"
      });

      res.json(updatedMessage);
    } catch (error) {
      console.error("Error resolving message:", error);
      res.status(500).json({ message: "Failed to resolve message" });
    }
  });

  // Update message status (for escalation, repair scheduling, etc.)
  app.post("/api/messages/:id/status", async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      
      // Use Zod schema for validation
      const validationResult = messageStatusUpdateSchema.safeParse({
        messageId,
        status: req.body.status
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid status value", 
          errors: validationResult.error.errors 
        });
      }
      
      const message = await storage.getMessage(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Update message status
      const updatedMessage = await storage.updateMessage(
        messageId, 
        { status: validationResult.data.status }
      );

      res.json(updatedMessage);
    } catch (error) {
      console.error("Error updating message status:", error);
      res.status(500).json({ message: "Failed to update message status" });
    }
  });

  // Setup SendGrid webhook for incoming emails
  app.post("/api/email/incoming", async (req, res) => {
    try {
      await handleIncomingEmail(req.body);
      res.status(200).send("OK");
    } catch (error) {
      console.error("Error processing incoming email:", error);
      res.status(500).json({ message: "Failed to process incoming email" });
    }
  });
  
  // Simulate incoming SMS (for testing purposes)
  app.post("/api/simulate/sms", async (req, res) => {
    try {
      // This endpoint simulates Twilio webhook by calling the SMS webhook handler directly
      console.log("Simulating incoming SMS from:", req.body.From);
      console.log("Message content:", req.body.Body);

      const { From, Body } = req.body;
      
      // Find tenant by phone number or create a temporary tenant if not found
      let tenant = await storage.getTenantByPhone(From);
      
      if (!tenant) {
        console.log(`Creating temporary tenant for number: ${From}`);
        // Create a temporary tenant profile for this number
        tenant = await storage.createTenant({
          name: `Tenant (${From})`,
          phone: From,
          email: null,
          propertyId: 1, // Assign to the first property in the system
          unitNumber: "TMP-" + Date.now().toString().slice(-4)
        });
        console.log(`Created temporary tenant with ID: ${tenant.id}`);
      }

      // Generate simpler AI response with fallback for potential API issues
      let classification;
      let aiResponse;
      
      try {
        // Analyze the message with AI
        classification = await analyzeTenant(Body);
        // Generate AI response
        aiResponse = await generateAIResponse(tenant.name, Body, classification);
      } catch (aiError) {
        console.error("AI processing error, using fallback:", aiError);
        // Fallback classification and response
        classification = {
          urgency: Body.toLowerCase().includes('emergency') || 
                   Body.toLowerCase().includes('fire') || 
                   Body.toLowerCase().includes('flood') ? 'emergency' : 'medium',
          category: 'maintenance',
          summary: 'Tenant message requiring attention'
        };
        aiResponse = `Thank you for your message. A property manager will review it shortly and contact you.`;
      }
      
      // Get property name safely
      const propertyName = tenant.propertyId ? 
        (await storage.getProperty(tenant.propertyId))?.name || 'Unknown Property' : 
        'Unknown Property';
      
      // Create message record
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
          propertyName
        }
      });
      
      console.log(`Created message with ID: ${message.id}`);
      console.log(`[SIMULATION] Would send SMS to ${From}: ${aiResponse}`);
      
      // Update message as responded
      await storage.updateMessage(message.id, {
        responseContent: aiResponse,
        respondedAt: new Date(),
        status: classification.urgency === "emergency" ? "in_progress" : "open"
      });
      
      return res.status(200).json({
        success: true,
        message: "Simulated SMS processed successfully",
        response: aiResponse,
        classification
      });
    } catch (error) {
      console.error("Error processing simulated SMS:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process simulated SMS",
        error: error.message 
      });
    }
  });

  return httpServer;
}
