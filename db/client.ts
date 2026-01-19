import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expoDb = openDatabaseSync("geargrabber.db");
export const db = drizzle(expoDb, { schema });

export function initDatabase() {
  expoDb.execSync(`
    CREATE TABLE IF NOT EXISTS receipt_items (
      id text PRIMARY KEY NOT NULL,
      receipt_id text,
      description text NOT NULL,
      quantity integer DEFAULT 1,
      unit_price integer NOT NULL,
      total_price integer NOT NULL,
      category text NOT NULL,
      brand text,
      model text,
      instrument_type text,
      subcategory text,
      created_at text DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id)
    );
    CREATE TABLE IF NOT EXISTS receipts (
      id text PRIMARY KEY NOT NULL,
      profile_id text,
      merchant text NOT NULL,
      date text NOT NULL,
      total integer NOT NULL,
      subtotal integer,
      tax integer,
      image_url text,
      abn text,
      raw_ocr_data text,
      sync_status text DEFAULT pending,
      created_at text DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
