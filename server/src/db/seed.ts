import { db, pool } from "./client.js";
import { birthProfiles, users } from "./schema.js";

async function main() {
  console.log("Seeding database...");

  const [demoUser] = await db
    .insert(users)
    .values({
      phone: "+919999999999",
      email: "demo@astroapp.dev",
      name: "Demo User",
      preferredLanguage: "hinglish",
    })
    .returning();

  if (!demoUser) {
    throw new Error("Failed to insert demo user");
  }

  await db.insert(birthProfiles).values({
    userId: demoUser.id,
    label: "Self",
    // A well-known reference birth datetime/place is intentionally NOT hardcoded here —
    // swap this for a real known-correct chart once Chapter 3's validation step needs one.
    localDateTime: "1995-08-21T14:30:00",
    placeName: "Kanpur, Uttar Pradesh, India",
    latitude: 26.4499,
    longitude: 80.3319,
  });

  console.log(`Seeded user #${demoUser.id} with one birth profile.`);
  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
