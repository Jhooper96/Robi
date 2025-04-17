import { storage } from "../server/storage"; // adjust this import if needed

async function resetDemoData() {
  // Optional: clear existing data if needed
  // await storage.clearTenants();
  // await storage.clearMessages();

  const demoTenants = [
    {
      name: "Maria Lopez",
      unit: "A102",
      phone: "+14045550001",
      email: "maria.lopez@example.com",
    },
    {
      name: "James Taylor",
      unit: "B204",
      phone: "+14045550002",
      email: "james.taylor@example.com",
    },
    {
      name: "Ava Chen",
      unit: "C303",
      phone: "+14045550003",
      email: "ava.chen@example.com",
    },
    {
      name: "DeShawn Wright",
      unit: "D101",
      phone: "+14045550004",
      email: "deshawn.wright@example.com",
    },
    {
      name: "Liam Patel",
      unit: "E202",
      phone: "+14045550005",
      email: "liam.patel@example.com",
    },
  ];

  const demoMessages = [
    {
      tenantPhone: "+14045550001",
      content:
        "There’s water leaking from under the kitchen sink. It’s starting to spread on the floor.",
      urgency: "high",
      category: "plumbing",
      summary: "Leak under kitchen sink causing minor flooding",
      status: "open",
      via: "sms",
    },
    {
      tenantPhone: "+14045550002",
      content:
        "It’s been 90 degrees all day and the AC won’t turn on. I need help ASAP.",
      urgency: "emergency",
      category: "hvac",
      summary: "No air conditioning during extreme heat",
      status: "open",
      via: "sms",
    },
    {
      tenantPhone: "+14045550003",
      content: "When is the trash pickup for this week?",
      urgency: "low",
      category: "general",
      summary: "Tenant asking about trash pickup schedule",
      status: "open",
      via: "email",
    },
    {
      tenantPhone: "+14045550004",
      content: "Two of my electrical outlets in the bedroom aren’t working.",
      urgency: "medium",
      category: "electrical",
      summary: "Non-functioning outlets in bedroom",
      status: "open",
      via: "sms",
    },
    {
      tenantPhone: "+14045550005",
      content:
        "Just wondering if I’m allowed to have a small dog in the apartment.",
      urgency: "low",
      category: "general",
      summary: "Inquiry about pet policy",
      status: "open",
      via: "email",
    },
  ];

  for (const tenant of demoTenants) {
    await storage.createTenant(tenant);
  }

  for (const msg of demoMessages) {
    const tenant = await storage.getTenantByPhone(msg.tenantPhone);
    if (!tenant) {
      console.warn(`Tenant not found for phone: ${msg.tenantPhone}`);
      continue;
    }

    await storage.createMessage({
      tenantId: tenant.id,
      content: msg.content,
      summary: msg.summary,
      urgency: msg.urgency,
      category: msg.category,
      status: msg.status,
      via: msg.via,
    });
  }

  console.log("✅ Demo tenants and messages loaded.");
}

resetDemoData().catch((err) => {
  console.error("Error seeding demo data:", err);
});
