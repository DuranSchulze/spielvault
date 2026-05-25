import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { randomUUID } from "crypto";
import { users } from "./auth";
import { spiels } from "./spiel";

export const userSpielFavorites = pgTable("user_spiel_favorite", {
  id: text("id").primaryKey().$defaultFn(() => randomUUID()),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  spielId: text("spielId").notNull().references(() => spiels.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt", { mode: "date" }).notNull().defaultNow(),
}, (t) => [unique("user_spiel_favorite_userId_spielId_key").on(t.userId, t.spielId)]);
