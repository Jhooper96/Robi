import { 
  User, 
  Property, 
  Tenant, 
  Message, 
  InsertUser, 
  InsertProperty, 
  InsertTenant, 
  InsertMessage,
  MessageFilter
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property methods
  getProperty(id: number): Promise<Property | undefined>;
  getProperties(): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  
  // Tenant methods
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantByEmail(email: string): Promise<Tenant | undefined>;
  getTenantByPhone(phone: string): Promise<Tenant | undefined>;
  getTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  
  // Message methods
  getMessage(id: number): Promise<Message | undefined>;
  getMessages(filter?: MessageFilter): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, updates: Partial<Message>): Promise<Message>;
  getMessageStats(): Promise<{ active: number; emergency: number; pending: number; resolved: number; }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private tenants: Map<number, Tenant>;
  private messages: Map<number, Message>;
  
  private userCurrentId: number;
  private propertyCurrentId: number;
  private tenantCurrentId: number;
  private messageCurrentId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.tenants = new Map();
    this.messages = new Map();
    
    this.userCurrentId = 1;
    this.propertyCurrentId = 1;
    this.tenantCurrentId = 1;
    this.messageCurrentId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create sample user
    const user: User = {
      id: this.userCurrentId++,
      username: "admin",
      password: "admin123",
      fullName: "Sarah Johnson",
      email: "sarah@example.com",
      role: "property_manager",
      createdAt: new Date()
    };
    this.users.set(user.id, user);

    // Create sample properties
    const properties: Property[] = [
      {
        id: this.propertyCurrentId++,
        name: "Sunset Apartments",
        address: "123 Sunset Blvd, Los Angeles, CA 90028",
        userId: user.id,
        createdAt: new Date()
      },
      {
        id: this.propertyCurrentId++,
        name: "Oakwood Heights",
        address: "456 Oak Street, San Francisco, CA 94109",
        userId: user.id,
        createdAt: new Date()
      },
      {
        id: this.propertyCurrentId++,
        name: "Riverside Condos",
        address: "789 River Road, New York, NY 10001",
        userId: user.id,
        createdAt: new Date()
      }
    ];
    
    properties.forEach(property => {
      this.properties.set(property.id, property);
    });

    // Create sample tenants
    const tenants: Tenant[] = [
      {
        id: this.tenantCurrentId++,
        name: "David Wilson",
        email: "david@example.com",
        phone: "+14155550101",
        propertyId: properties[0].id,
        unitNumber: "3B",
        userId: user.id,
        createdAt: new Date()
      },
      {
        id: this.tenantCurrentId++,
        name: "Lisa Rodriguez",
        email: "lisa@example.com",
        phone: "+14155550102",
        propertyId: properties[1].id,
        unitNumber: "5A",
        userId: user.id,
        createdAt: new Date()
      },
      {
        id: this.tenantCurrentId++,
        name: "Michael Brown",
        email: "michael@example.com",
        phone: "+14155550103",
        propertyId: properties[2].id,
        unitNumber: "2C",
        userId: user.id,
        createdAt: new Date()
      },
      {
        id: this.tenantCurrentId++,
        name: "Jennifer Taylor",
        email: "jennifer@example.com",
        phone: "+14155550104",
        propertyId: properties[0].id,
        unitNumber: "4D",
        userId: user.id,
        createdAt: new Date()
      }
    ];
    
    tenants.forEach(tenant => {
      this.tenants.set(tenant.id, tenant);
    });

    // Create sample messages
    const now = new Date();
    const messages: Message[] = [
      {
        id: this.messageCurrentId++,
        tenantId: tenants[0].id,
        content: "There's water flooding from under my kitchen sink! It's all over the floor and spreading fast. Need emergency help!",
        originalContent: "There's water flooding from under my kitchen sink! It's all over the floor and spreading fast. Need emergency help!",
        channel: "sms",
        urgency: "emergency",
        aiSummary: "Emergency water leak from kitchen sink causing flooding.",
        aiResponse: "Mr. Wilson, I'm sorry to hear about the water leak. This is an emergency situation. Please turn off the water valve under the sink immediately if possible. Our emergency plumber has been notified and will arrive within the next 30 minutes. Please move any valuables away from the water to prevent damage.",
        category: "plumbing",
        status: "open",
        createdAt: new Date(now.getTime() - 20 * 60000), // 20 minutes ago
        metadata: {
          phone: tenants[0].phone,
          tenantName: tenants[0].name,
          unitNumber: tenants[0].unitNumber,
          propertyName: properties[0].name
        }
      },
      {
        id: this.messageCurrentId++,
        tenantId: tenants[1].id,
        content: "Hi, this is Lisa Rodriguez from 5A. My air conditioning has stopped working completely. It's really hot in here, and I have a newborn baby. We can't stay here if it isn't fixed soon. Please send someone to fix it as soon as possible. It's urgent. Thank you.",
        originalContent: "Hi, this is Lisa Rodriguez from 5A. My air conditioning has stopped working completely. It's really hot in here, and I have a newborn baby. We can't stay here if it isn't fixed soon. Please send someone to fix it as soon as possible. It's urgent. Thank you.",
        channel: "voicemail",
        urgency: "high",
        aiSummary: "AC completely non-functional in Unit 5A. Tenant has newborn baby and cannot stay in unit without AC.",
        aiResponse: "Ms. Rodriguez, I understand your AC is completely out and this is especially concerning with your newborn. I've scheduled an HVAC technician to visit today between 2-4pm. In the meantime, would you like us to provide a portable AC unit? Please let me know if that would help until the repair is complete.",
        category: "hvac",
        status: "open",
        createdAt: new Date(now.getTime() - 60 * 60000), // 1 hour ago
        metadata: {
          phone: tenants[1].phone,
          tenantName: tenants[1].name,
          unitNumber: tenants[1].unitNumber,
          propertyName: properties[1].name
        }
      },
      {
        id: this.messageCurrentId++,
        tenantId: tenants[2].id,
        content: "Hello Property Management, I've noticed that several outlets in my living room have stopped working. I've checked the breaker and it hasn't tripped. This isn't an emergency but I'd like to have it fixed soon since I need those outlets for my work setup. Could someone come check it out this week? Thanks, Michael Brown",
        originalContent: "Hello Property Management, I've noticed that several outlets in my living room have stopped working. I've checked the breaker and it hasn't tripped. This isn't an emergency but I'd like to have it fixed soon since I need those outlets for my work setup. Could someone come check it out this week? Thanks, Michael Brown",
        channel: "email",
        urgency: "medium",
        aiSummary: "Multiple non-functioning electrical outlets in living room. Tenant needs for work setup.",
        aiResponse: "Mr. Brown, thank you for reporting the issue with your living room outlets. I've scheduled our electrician to visit your unit this Thursday between 9am-12pm. Please confirm if this time works for you. In the meantime, please avoid using extension cords between rooms as they can pose a safety hazard.",
        category: "electrical",
        status: "open",
        createdAt: new Date(now.getTime() - 3 * 60 * 60000), // 3 hours ago
        metadata: {
          email: tenants[2].email,
          tenantName: tenants[2].name,
          unitNumber: tenants[2].unitNumber,
          propertyName: properties[2].name
        }
      },
      {
        id: this.messageCurrentId++,
        tenantId: tenants[3].id,
        content: "Hi, I was wondering when the community pool will be reopened? The sign says it's closed for maintenance but doesn't give a date. Thanks!",
        originalContent: "Hi, I was wondering when the community pool will be reopened? The sign says it's closed for maintenance but doesn't give a date. Thanks!",
        channel: "sms",
        urgency: "low",
        aiSummary: "Inquiry about community pool reopening date.",
        aiResponse: "Hi Jennifer, thank you for your message. The community pool is scheduled to reopen next Monday, May 15th. The maintenance includes resurfacing and updating the filtration system. We appreciate your patience during these improvements!",
        category: "general",
        status: "open",
        createdAt: new Date(now.getTime() - 24 * 60 * 60000), // 24 hours ago
        metadata: {
          phone: tenants[3].phone,
          tenantName: tenants[3].name,
          unitNumber: tenants[3].unitNumber,
          propertyName: properties[0].name
        }
      }
    ];
    
    messages.forEach(message => {
      this.messages.set(message.id, message);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  // Property methods
  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.propertyCurrentId++;
    const property: Property = { ...insertProperty, id, createdAt: new Date() };
    this.properties.set(id, property);
    return property;
  }
  
  // Tenant methods
  async getTenant(id: number): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async getTenantByEmail(email: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(
      (tenant) => tenant.email === email,
    );
  }

  async getTenantByPhone(phone: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(
      (tenant) => tenant.phone === phone,
    );
  }

  async getTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const id = this.tenantCurrentId++;
    const tenant: Tenant = { ...insertTenant, id, createdAt: new Date() };
    this.tenants.set(id, tenant);
    return tenant;
  }
  
  // Message methods
  async getMessage(id: number): Promise<Message | undefined> {
    return this.messages.get(id);
  }

  async getMessages(filter: MessageFilter & { sortOrder?: 'newest' | 'oldest' } = {}): Promise<Message[]> {
    let messages = Array.from(this.messages.values());
    
    // Apply filters
    if (filter.propertyId !== undefined) {
      // First get tenants for this property
      const propertyTenants = Array.from(this.tenants.values())
        .filter(tenant => tenant.propertyId === filter.propertyId)
        .map(tenant => tenant.id);
      
      // Then filter messages by tenant IDs
      messages = messages.filter(message => 
        propertyTenants.includes(message.tenantId)
      );
    }
    
    if (filter.urgency !== undefined) {
      messages = messages.filter(message => message.urgency === filter.urgency);
    }
    
    if (filter.status !== undefined) {
      messages = messages.filter(message => message.status === filter.status);
    }
    
    if (filter.tenantId !== undefined) {
      messages = messages.filter(message => message.tenantId === filter.tenantId);
    }
    
    if (filter.category !== undefined) {
      messages = messages.filter(message => message.category === filter.category);
    }
    
    if (filter.channel !== undefined) {
      messages = messages.filter(message => message.channel === filter.channel);
    }
    
    // Sort by creation date
    if (filter.sortOrder === 'oldest') {
      // Sort oldest first
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      // Sort newest first (default)
      messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    
    return messages;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageCurrentId++;
    const message: Message = { 
      ...insertMessage, 
      id, 
      createdAt: new Date(),
      aiSummary: '',
      aiResponse: ''
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessage(id: number, updates: Partial<Message>): Promise<Message> {
    const message = this.messages.get(id);
    if (!message) {
      throw new Error(`Message with ID ${id} not found`);
    }
    
    const updatedMessage = { ...message, ...updates };
    this.messages.set(id, updatedMessage);
    return updatedMessage;
  }

  async getMessageStats(): Promise<{ active: number; emergency: number; pending: number; resolved: number; }> {
    const messages = Array.from(this.messages.values());
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return {
      active: messages.filter(m => m.status !== 'resolved').length,
      emergency: messages.filter(m => m.urgency === 'emergency' && m.status !== 'resolved').length,
      pending: messages.filter(m => m.status === 'open').length,
      resolved: messages.filter(m => 
        m.status === 'resolved' && 
        new Date(m.createdAt) >= oneDayAgo
      ).length
    };
  }
}

export const storage = new MemStorage();
