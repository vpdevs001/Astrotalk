import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: text("phone").unique(),
  email: text("email").unique(),
  name: text("name"),
  // 'en' | 'hi' | 'hinglish' — enforced at the application layer, not a DB enum,
  // so adding a language later doesn't need a migration.
  preferredLanguage: text("preferred_language").default("hinglish").notNull(),
  isPro: boolean("is_pro").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const birthProfiles = pgTable("birth_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  // e.g. "Self", "Partner" — lets one user hold multiple profiles for matching (Chapter 6)
  label: text("label").notNull(),
  // Stored as entered by the user, e.g. "1995-08-21T14:30:00" — timezone resolution
  // happens at calculation time (Chapter 3), not at storage time.
  localDateTime: text("local_date_time").notNull(),
  placeName: text("place_name").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  // Cached output of the ephemeris engine (Chapter 3) — nullable because a profile
  // can be saved before the chart is computed.
  chartData: jsonb("chart_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
