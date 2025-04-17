import OpenAI from "openai";
import { InsertMessage } from "@shared/schema";
import fs from 'fs-extra';
import path from 'path';
import { tmpdir } from 'os';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Message object for OpenAI classification
interface ClassificationResult {
  urgency: 'emergency' | 'high' | 'medium' | 'low';
  category: string;
  summary: string;
}

export async function analyzeTenant(message: string): Promise<ClassificationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for property managers. Analyze tenant messages and classify them by urgency and category.
Return JSON with the following structure: {
  "urgency": "emergency" | "high" | "medium" | "low",
  "category": (maintenance category like "plumbing", "hvac", "electrical", "general", etc.),
  "summary": (brief 1-sentence summary of the issue)
}

Urgency levels:
- emergency: life-threatening, severe property damage, safety hazard (flooding, fire, gas leak, no heat in winter, etc.)
- high: serious issues that affect habitability but not immediately dangerous (AC not working in summer, hot water out, multiple fixtures not working)
- medium: important issues that should be addressed soon (appliance malfunction, minor leaks, some electrical outlets not working)
- low: general inquiries, minor aesthetics, amenity questions, non-urgent requests
          `
        },
        {
          role: "user",
          content: message
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '';

    try {
      const result = JSON.parse(content);

      if (
        ["emergency", "high", "medium", "low"].includes(result.urgency) &&
        typeof result.category === "string" &&
        typeof result.summary === "string"
      ) {
        return result as ClassificationResult;
      } else {
        throw new Error("Invalid AI response structure");
      }
    } catch (err) {
      console.error("Failed to parse or validate GPT response:", err);
      throw new Error("AI response failed validation");
    }

  } catch (err) {
    console.error("Error from OpenAI API:", err);
    throw new Error("Failed to analyze tenant message");
  }
}

// Generate AI response based on tenant message and classification
export async function generateAIResponse(
  tenantName: string, 
  message: string,
  classification: ClassificationResult
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a property manager responding to tenant communications.
          Create a professional, helpful, and empathetic response to the tenant message.
          Address the tenant by name. The message is classified as ${classification.urgency} urgency in the category of ${classification.category}.
          
          Keep responses under 150 words. Be specific about next steps and when the tenant can expect assistance.
          For emergencies, emphasize immediate action being taken.
          For high urgency, provide specific timeframes for resolution.
          For medium urgency, provide general timeframes and clear expectations.
          For low urgency, be courteous but indicate the request will be handled in normal business order.`
        },
        {
          role: "user",
          content: `Tenant name: ${tenantName}\nMessage: ${message}\nClassification: ${classification.urgency} urgency, ${classification.category} category`
        }
      ]
    });

    const content = response.choices[0].message.content || '';
    return content ? content : "I'll look into this issue and get back to you as soon as possible.";
  } catch (error) {
    console.error("OpenAI response generation error:", error);
    return "I'll look into this issue and get back to you as soon as possible.";
  }
}

// Transcribe voicemail audio using Whisper API
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    // Create a temporary file path
    const tempFilePath = path.join(tmpdir(), `voicemail-${Date.now()}.mp3`);
    
    // Write the audio buffer to a temporary file
    await fs.writeFile(tempFilePath, audioBuffer);
    
    // Transcribe the audio using Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: "whisper-1",
    });
    
    // Clean up the temporary file
    await fs.remove(tempFilePath);
    
    // Return the transcription text
    return transcription.text || "No transcription available.";
  } catch (error) {
    console.error("Audio transcription error:", error);
    throw new Error("Failed to transcribe audio message.");
  }
}
