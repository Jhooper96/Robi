import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (property managers)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("property_manager"),
  createdAt: timestamp("created_at").defaultNow()
});

// Properties schema
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Tenants schema
export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  propertyId: integer("property_id").references(() => properties.id),
  unitNumber: text("unit_number").notNull(),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});

// Message schema
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id").references(() => tenants.id),
  content: text("content").notNull(),
  originalContent: text("original_content").notNull(),
  channel: text("channel").notNull(), // sms, email, voicemail
  urgency: text("urgency").notNull().default("medium"), // emergency, high, medium, low
  aiSummary: text("ai_summary"),
  aiResponse: text("ai_response"),
  category: text("category"), // plumbing, hvac, electrical, etc.
  status: text("status").notNull().default("open"), // open, in_progress, resolved
  responseContent: text("response_content"),
  respondedAt: timestamp("responded_at"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  metadata: jsonb("metadata").default({})
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPropertySchema = createInsertSchema(properties).omit({ id: true, createdAt: true });
export const insertTenantSchema = createInsertSchema(tenants).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ 
  id: true, 
  createdAt: true, 
  respondedAt: true
}).extend({
  aiSummary: z.string().optional(),
  aiResponse: z.string().optional()
});

// Zod schemas for validation
export const messageFilterSchema = z.object({
  propertyId: z.number().optional(),
  urgency: z.enum(['emergency', 'high', 'medium', 'low']).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'escalated_vendor', 'pending_repair']).optional(),
  tenantId: z.number().optional(),
  category: z.string().optional(),
  channel: z.enum(['sms', 'email', 'voicemail']).optional(),
  sortOrder: z.enum(['newest', 'oldest']).optional(),
});

export const messageResponseSchema = z.object({
  messageId: z.number(),
  responseContent: z.string(),
  useAiResponse: z.boolean().optional()
});

export const messageAssignSchema = z.object({
  messageId: z.number(),
  userId: z.number()
});

export const messageStatusUpdateSchema = z.object({
  messageId: z.number(),
  status: z.enum(['open', 'in_progress', 'resolved', 'escalated_vendor', 'pending_repair'])
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type MessageFilter = z.infer<typeof messageFilterSchema>;
export type MessageResponse = z.infer<typeof messageResponseSchema>;
export type MessageAssign = z.infer<typeof messageAssignSchema>;
export type MessageStatusUpdate = z.infer<typeof messageStatusUpdateSchema>;

export type User = typeof users.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type Message = typeof messages.$inferSelect;
