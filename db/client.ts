import { Platform } from "react-native";
import * as schema from "./schema";

let expoDb: any = null;
let dbInstance: any = null;
let isInitialized = false;

const initTablesSQL = `
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
    sync_status text DEFAULT 'pending',
    created_at text DEFAULT CURRENT_TIMESTAMP
  );
`;

// Mock database for web
const createMockDb = () => ({
  select: () => ({
    from: () => ({
      orderBy: () => Promise.resolve([]),
      where: () => Promise.resolve([]),
    }),
  }),
  insert: () => ({
    values: () => Promise.resolve(),
  }),
  delete: () => ({
    where: () => Promise.resolve(),
  }),
});

function ensureDb() {
  if (dbInstance) {
    return dbInstance;
  }
  
  if (Platform.OS === 'web') {
    return createMockDb();
  }
  
  throw new Error('Database not initialized. Call initDatabase() first.');
}

export const db = new Proxy({} as any, {
  get: (target, prop) => {
    const db = ensureDb();
    return (db as any)[prop];
  },
});

export async function initDatabase() {
  if (isInitialized) {
    return;
  }

  try {
    if (Platform.OS === 'web') {
      // For web, use mock database
      dbInstance = createMockDb();
      isInitialized = true;
      console.log('Web: Using mock database');
      return;
    }

    // For native platforms, dynamically import SQLite
    const { openDatabaseSync } = await import("expo-sqlite");
    const { drizzle } = await import("drizzle-orm/expo-sqlite");
    
    expoDb = openDatabaseSync("geargrabber.db");
    expoDb.execSync(initTablesSQL);
    dbInstance = drizzle(expoDb, { schema });
    
    isInitialized = true;
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    // Use mock DB as fallback
    dbInstance = createMockDb();
    isInitialized = true;
  }
}
