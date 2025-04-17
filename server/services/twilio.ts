import { Express } from "express";
import { storage } from "../storage";
import { analyzeTenant, generateAIResponse, transcribeAudio } from "../ai/openai";
import twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Format phone number to ensure E.164 compliance
let twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || "+14703007379";
if (twilioPhoneNumber && !twilioPhoneNumber.startsWith('+')) {
  // Convert to E.164 format if not already
  twilioPhoneNumber = '+1' + twilioPhoneNumber.replace(/\D/g, '');
  console.log(`Reformatted Twilio phone number to E.164 format: ${twilioPhoneNumber}`);
}

// Create Twilio client (real or mock based on credentials)
let twilioClient: any;

if (accountSid && authToken) {
  // Use real Twilio client if credentials are available
  console.log("Using real Twilio client with phone number:", twilioPhoneNumber);
  console.log(`Twilio Account SID: ${accountSid?.substring(0, 5)}...`);
  console.log(`Twilio Auth Token available: ${authToken ? 'Yes' : 'No'}`);
  twilioClient = twilio(accountSid, authToken);
} else {
  // Fall back to mock client for development
  console.log("Using mock Twilio client (no credentials found)");
  twilioClient = {
    messages: {
      create: async (options: any) => {
        console.log(`[MOCK TWILIO] Sending SMS to ${options.to}: ${options.body}`);
        return { sid: "mock-sid-" + Date.now() };
      }
    }
  };
}

// Setup Twilio webhook endpoints
export function setupTwilioWebhook(app: Express) {
  /* 
   * SECURITY NOTE: For production deployment
   * We need to add Twilio signature validation to ensure requests are coming from Twilio:
   * 
   * import { validateRequest } from "twilio";
   * 
   * // Middleware to validate Twilio requests
   * function validateTwilioRequest(req, res, next) {
   *   const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
   *   
   *   if (!validateRequest(authToken, req.headers["x-twilio-signature"], fullUrl, req.body)) {
   *     return res.status(403).send("Unauthorized");
   *   }
   *   
   *   next();
   * }
   * 
   * Then apply this middleware to the webhook routes:
   * app.post("/api/sms/incoming", validateTwilioRequest, async (req, res) => {...});
   * app.post("/api/voice/incoming", validateTwilioRequest, async (req, res) => {...});
   * app.post("/api/voice/recording", validateTwilioRequest, async (req, res) => {...});
   */
  
  // SMS webhook
  app.post("/api/sms/incoming", async (req, res) => {
    try {
      const { From, Body } = req.body;
      
      // Find tenant by phone number
      // Ensure phone number has a + prefix for E.164 format
      const formattedFrom = From.startsWith('+') ? From : `+${From}`;
      console.log(`Looking up tenant with phone: ${formattedFrom} (original: ${From})`);
      const tenant = await storage.getTenantByPhone(formattedFrom);
      
      if (!tenant) {
        console.warn(`Received SMS from unknown number: ${From}`);
        res.type("text/xml");
        res.send("<Response><Message>We couldn't identify your account. Please contact property management directly.</Message></Response>");
        return;
      }
      
      // Analyze the message with AI - with fallback for rate limits
      let classification = {
        urgency: "high",
        category: "maintenance",
        summary: "Tenant reported an issue that needs attention"
      };
      let aiResponse = `Thank you for your message, ${tenant.name}. We've recorded your maintenance request and will address it promptly. A property manager will contact you soon.`;
      
      // Only attempt AI analysis if needed, with proper fallback
      try {
        const aiClassification = await analyzeTenant(Body);
        const aiGeneratedResponse = await generateAIResponse(tenant.name, Body, aiClassification);
        
        // Only override if successful
        classification = aiClassification;
        aiResponse = aiGeneratedResponse;
        console.log("Successfully generated AI response");
      } catch (error: any) {
        console.warn("AI analysis failed, using fallback classification:", error.message || error);
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
      
      // Auto-respond to all incoming messages with the AI-generated response
      await twilioClient.messages.create({
        to: From,
        from: twilioPhoneNumber,
        body: aiResponse
      });
      
      // Update message as responded
      await storage.updateMessage(message.id, {
        responseContent: aiResponse,
        respondedAt: new Date(),
        status: classification.urgency === "emergency" ? "in_progress" : "open"
      });
      
      // In a real system, would also notify property manager for emergencies
      
      // Send acknowledgment response for Twilio webhook
      res.type("text/xml");
      res.send("<Response></Response>");
    } catch (error) {
      console.error("Error processing incoming SMS:", error);
      res.status(500).send("Error processing message");
    }
  });
  
  // Voice/Voicemail webhook
  app.post("/api/voice/incoming", async (req, res) => {
    // Respond with TwiML to record a voicemail
    res.type("text/xml");
    res.send(`<Response>
  <Say>Please leave your message after the tone.</Say>
  <Record action="/api/voice/recorded" method="POST" maxLength="60" />
  <Say>We did not receive a recording.</Say>
</Response>`);
  });
  
  // Handle recorded voicemail
  app.post("/api/voice/recorded", async (req, res) => {
    try {
      const { From, RecordingUrl, RecordingSid } = req.body;
      
      // Download the recording
      const response = await fetch(RecordingUrl);
      const audioBuffer = await response.arrayBuffer();
      
      // Transcribe the audio
      const transcription = await transcribeAudio(Buffer.from(audioBuffer));
      
      // Find tenant by phone number
      // Ensure phone number has a + prefix for E.164 format
      const formattedFrom = From.startsWith('+') ? From : `+${From}`;
      console.log(`Looking up tenant with phone: ${formattedFrom} (original: ${From})`);
      const tenant = await storage.getTenantByPhone(formattedFrom);
      
      if (!tenant) {
        console.warn(`Received voicemail from unknown number: ${From}`);
        // Respond with TwiML for unknown callers
        res.type("text/xml");
        res.send(`<Response>
  <Say>Thank you for your message. However, we could not identify your account. Please contact property management directly.</Say>
</Response>`);
        return;
      }
      
      // Analyze the transcription with AI - with fallback for rate limits
      let classification = {
        urgency: "high",
        category: "maintenance",
        summary: "Tenant left a voicemail about an issue that needs attention"
      };
      let aiResponse = `Thank you for your voicemail, ${tenant.name}. We've recorded your maintenance request and will address it promptly. A property manager will contact you soon.`;
      
      // Only attempt AI analysis if needed, with proper fallback
      try {
        const aiClassification = await analyzeTenant(transcription);
        const aiGeneratedResponse = await generateAIResponse(tenant.name, transcription, aiClassification);
        
        // Only override if successful
        classification = aiClassification;
        aiResponse = aiGeneratedResponse;
        console.log("Successfully generated AI response for voicemail");
      } catch (error: any) {
        console.warn("AI analysis failed for voicemail, using fallback classification:", error.message || error);
      }
      
      // Get property name safely
      const propertyName = tenant.propertyId ? 
        (await storage.getProperty(tenant.propertyId))?.name || 'Unknown Property' : 
        'Unknown Property';
        
      // Create message record
      const message = await storage.createMessage({
        tenantId: tenant.id,
        content: transcription,
        originalContent: transcription,
        channel: "voicemail",
        urgency: classification.urgency,
        category: classification.category,
        status: "open",
        aiSummary: classification.summary,
        aiResponse: aiResponse,
        metadata: {
          phone: From,
          recordingUrl: RecordingUrl,
          recordingSid: RecordingSid,
          tenantName: tenant.name,
          unitNumber: tenant.unitNumber,
          propertyName
        }
      });
      
      // Auto-respond to all voicemails via SMS if tenant has a phone number
      if (tenant.phone) {
        // First, send an immediate confirmation message
        await twilioClient.messages.create({
          to: tenant.phone,
          from: twilioPhoneNumber,
          body: `Thanks for your voicemail. We've flagged this as ${classification.urgency}. We'll follow up shortly.`
        });
        
        // Then send the detailed AI response
        // Customize message based on urgency
        const responsePrefix = classification.urgency === "emergency" 
          ? "We received your voicemail and identified it as urgent. " 
          : "We received your voicemail. ";
        
        // Send SMS with AI response
        await twilioClient.messages.create({
          to: tenant.phone,
          from: twilioPhoneNumber,
          body: responsePrefix + aiResponse
        });
        
        // Update message as responded
        await storage.updateMessage(message.id, {
          responseContent: aiResponse,
          respondedAt: new Date(),
          status: classification.urgency === "emergency" ? "in_progress" : "open"
        });
      }
      
      // Respond with TwiML to acknowledge the recording
      res.type("text/xml");
      res.send(`<Response>
  <Say>Thank you for your message. We'll get back to you shortly.</Say>
</Response>`);
    } catch (error) {
      console.error("Error processing voicemail:", error);
      // Return TwiML response even on error
      res.type("text/xml");
      res.send(`<Response>
  <Say>We're sorry, but there was an error processing your message. Please try again later or contact property management directly.</Say>
</Response>`);
    }
  });
}

// Send SMS message
export async function sendSMS(to: string, body: string): Promise<string> {
  try {
    console.log(`Sending SMS to ${to} from ${twilioPhoneNumber}:`, body.substring(0, 50) + (body.length > 50 ? '...' : ''));
    
    // Ensure phone number is in E.164 format
    let formattedTo = to;
    if (!to.startsWith('+')) {
      // Add + if missing, assuming it's a US number (as a fallback)
      formattedTo = '+' + to.replace(/[^0-9]/g, '');
      console.log(`Reformatted phone number from ${to} to ${formattedTo}`);
    }
    
    const message = await twilioClient.messages.create({
      body,
      from: twilioPhoneNumber,
      to: formattedTo
    });
    
    console.log(`SMS sent successfully with SID: ${message.sid}`);
    return message.sid;
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    
    // Enhanced error reporting
    if (error.code) {
      console.error(`Twilio Error Code: ${error.code}`);
      
      // Common Twilio error codes
      if (error.code === 21211) {
        console.error("Invalid phone number format. Please use E.164 format (e.g., +15551234567)");
      } else if (error.code === 21608) {
        console.error("This number isn't verified in your Twilio trial account.");
      } else if (error.code === 21219) {
        console.error("Invalid from phone number. Check Twilio phone number setup.");
      }
    }
    
    throw error; // Pass through the original error
  }
}
