import { MailService } from '@sendgrid/mail';
import { storage } from "../storage";
import { analyzeTenant, generateAIResponse } from "../ai/openai";

// Initialize SendGrid
const sendgridApiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM_EMAIL || "property@example.com";

// Create a mail service
const mailService = new MailService();
if (sendgridApiKey) {
  mailService.setApiKey(sendgridApiKey);
}

// Handle incoming email from SendGrid webhook
export async function handleIncomingEmail(payload: any): Promise<void> {
  try {
    // Extract email data from the SendGrid inbound parse webhook payload
    const { from, text, subject } = payload;
    
    // Extract email address from the "from" field
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emailMatch = from.match(emailRegex);
    
    if (!emailMatch || !emailMatch[1]) {
      console.error("Could not extract email address from:", from);
      return;
    }
    
    const fromEmail = emailMatch[1];
    
    // Find tenant by email
    const tenant = await storage.getTenantByEmail(fromEmail);
    
    if (!tenant) {
      console.warn(`Received email from unknown address: ${fromEmail}`);
      // Could send a reply that we couldn't identify them
      return;
    }
    
    // Combine subject and body for analysis
    const fullContent = `Subject: ${subject}\n\n${text}`;
    
    // Analyze the message with AI
    const classification = await analyzeTenant(fullContent);
    
    // Generate AI response
    const aiResponse = await generateAIResponse(tenant.name, fullContent, classification);
    
    // Get property name safely
    const propertyName = tenant.propertyId ? 
      (await storage.getProperty(tenant.propertyId))?.name || 'Unknown Property' : 
      'Unknown Property';
      
    // Create message record
    const message = await storage.createMessage({
      tenantId: tenant.id,
      content: text,
      originalContent: fullContent,
      channel: "email",
      urgency: classification.urgency,
      category: classification.category,
      status: "open",
      aiSummary: classification.summary,
      aiResponse: aiResponse,
      metadata: {
        email: fromEmail,
        subject,
        tenantName: tenant.name,
        unitNumber: tenant.unitNumber,
        propertyName
      }
    });
    
    // Auto-respond to all incoming emails
    // Customize subject based on urgency
    const responseSubject = classification.urgency === "emergency" 
      ? `RE: ${subject || "Your Maintenance Request"} - URGENT` 
      : `RE: ${subject || "Your Maintenance Request"}`;
    
    // Send email response
    await mailService.send({
      to: fromEmail,
      from: fromEmail, // using the verified SendGrid domain email
      subject: responseSubject,
      text: aiResponse,
      html: `<p>${aiResponse.replace(/\n/g, '<br>')}</p>`
    });
    
    // Update message as responded
    await storage.updateMessage(message.id, {
      responseContent: aiResponse,
      respondedAt: new Date(),
      status: classification.urgency === "emergency" ? "in_progress" : "open"
    });
  } catch (error) {
    console.error("Error processing incoming email:", error);
    throw new Error("Failed to process incoming email");
  }
}

// Send email via SendGrid
export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> {
  try {
    await mailService.send({
      to: params.to,
      from: fromEmail,
      subject: params.subject,
      text: params.text,
      html: params.html || params.text.replace(/\n/g, '<br>')
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}
