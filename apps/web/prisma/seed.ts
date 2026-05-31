import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const interests = [
  { name: "Hiking", icon: "🥾", category: "HIKING" as const },
  { name: "Sports", icon: "⚽", category: "SPORTS" as const },
  { name: "Movies", icon: "🎬", category: "MOVIES" as const },
  { name: "Festivals", icon: "🎪", category: "FESTIVALS" as const },
  { name: "Photography", icon: "📸", category: "PHOTOGRAPHY" as const },
  { name: "Food", icon: "🍔", category: "FOOD" as const },
  { name: "Music", icon: "🎵", category: "MUSIC" as const },
  { name: "Gaming", icon: "🎮", category: "GAMING" as const },
  { name: "Cycling", icon: "🚴", category: "CYCLING" as const },
  { name: "Camping", icon: "⛺", category: "CAMPING" as const },
  { name: "Art", icon: "🎨", category: "ART" as const },
  { name: "Wellness", icon: "🧘", category: "WELLNESS" as const },
  { name: "Travel", icon: "✈️", category: "TRAVEL" as const },
  { name: "Nightlife", icon: "🌙", category: "NIGHTLIFE" as const },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Seed interests
  for (const interest of interests) {
    await prisma.interest.upsert({
      where: { name: interest.name },
      update: {},
      create: interest,
    });
  }
  console.log(`✅ Seeded ${interests.length} interests`);

  // Create demo users
  const passwordHash = await bcrypt.hash("Demo1234!", 12);

  const alice = await prisma.user.upsert({
    where: { email: "alice@demo.com" },
    update: {},
    create: {
      email: "alice@demo.com",
      username: "alice_explorer",
      passwordHash,
      city: "Barcelona",
      bio: "Adventure seeker | Hiking enthusiast | Coffee lover ☕",
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@demo.com" },
    update: {},
    create: {
      email: "bob@demo.com",
      username: "bob_outdoors",
      passwordHash,
      city: "Berlin",
      bio: "Cyclist and nature photographer 📸",
    },
  });

  console.log("✅ Created demo users (alice@demo.com, bob@demo.com — password: Demo1234!)");

  // Create some demo activities
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const activities = [
    {
      title: "Sunrise Hike at Collserola",
      description: "Join us for a breathtaking sunrise hike through the Collserola Natural Park. We'll start before dawn and catch the sunrise from the peaks. All fitness levels welcome!",
      category: "HIKING" as const,
      mood: "ADVENTUROUS" as const,
      date: tomorrow,
      latitude: 41.4143,
      longitude: 2.0828,
      city: "Barcelona",
      address: "Carretera de les Aigues",
      priceLevel: "FREE" as const,
      maxParticipants: 15,
      creatorId: alice.id,
    },
    {
      title: "Photography Walk: Gothic Quarter",
      description: "Explore the medieval streets of the Gothic Quarter with fellow photography enthusiasts. All skill levels welcome. Bring your camera or smartphone!",
      category: "PHOTOGRAPHY" as const,
      mood: "CREATIVE" as const,
      date: nextWeek,
      latitude: 41.3831,
      longitude: 2.1761,
      city: "Barcelona",
      address: "Barri Gòtic, Barcelona",
      priceLevel: "FREE" as const,
      maxParticipants: 10,
      creatorId: alice.id,
    },
    {
      title: "Sunday Cycling — Tempelhofer Feld",
      description: "Casual 30km cycling tour around Berlin. We'll stop for coffee and enjoy the scenery. Bring a bike and a smile!",
      category: "CYCLING" as const,
      mood: "ACTIVE" as const,
      date: nextWeek,
      latitude: 52.4728,
      longitude: 13.4012,
      city: "Berlin",
      address: "Tempelhofer Feld, Berlin",
      priceLevel: "FREE" as const,
      maxParticipants: 20,
      creatorId: bob.id,
    },
    {
      title: "Board Game Night 🎲",
      description: "Weekly board game night at a cozy café. We play everything from Catan to Codenames. Beginners and veterans welcome!",
      category: "GAMING" as const,
      mood: "SOCIAL" as const,
      date: tomorrow,
      latitude: 52.5244,
      longitude: 13.4105,
      city: "Berlin",
      address: "Prenzlauer Berg, Berlin",
      priceLevel: "CHEAP" as const,
      maxParticipants: 12,
      creatorId: bob.id,
    },
  ];

  for (const activity of activities) {
    const existing = await prisma.activity.findFirst({
      where: { title: activity.title },
    });

    if (!existing) {
      await prisma.activity.create({
        data: {
          ...activity,
          participants: {
            create: { userId: activity.creatorId },
          },
        },
      });
    }
  }

  console.log(`✅ Seeded ${activities.length} demo activities`);
  console.log("\n🎉 Seeding complete!");
  console.log("\n📧 Demo accounts:");
  console.log("   alice@demo.com / Demo1234!");
  console.log("   bob@demo.com / Demo1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
