import { Platform } from "react-native";
import * as schema from "./schema";

let expoDb: any = null;
let dbInstance: any = null;
let isInitialized = false;

const initTablesSQL = `
  -- Transactions table (the receipt/invoice document)
  CREATE TABLE IF NOT EXISTS transactions (
    id text PRIMARY KEY NOT NULL,
    profile_id text,
    merchant text NOT NULL,
    merchant_abn text,
    merchant_address text,
    merchant_phone text,
    document_type text NOT NULL DEFAULT 'receipt',
    invoice_number text,
    reference_number text,
    transaction_date text NOT NULL,
    due_date text,
    subtotal integer,
    discount_total integer,
    tax integer,
    total integer NOT NULL,
    amount_paid integer,
    amount_due integer,
    currency text DEFAULT 'AUD',
    payment_status text DEFAULT 'paid',
    payment_method text,
    image_url text,
    raw_ocr_data text,
    sync_status text DEFAULT 'pending',
    created_at text DEFAULT CURRENT_TIMESTAMP,
    updated_at text DEFAULT CURRENT_TIMESTAMP
  );

  -- Line items table (individual items in the transaction)
  CREATE TABLE IF NOT EXISTS line_items (
    id text PRIMARY KEY NOT NULL,
    transaction_id text,
    description text NOT NULL,
    category text NOT NULL,
    brand text,
    model text,
    instrument_type text,
    gear_category text,
    serial_number text,
    quantity integer DEFAULT 1,
    original_unit_price integer,
    unit_price integer NOT NULL,
    discount_amount integer,
    discount_percentage real,
    total_price integer NOT NULL,
    education_details text,
    notes text,
    confidence real,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
  );
`;

// In-memory storage for web platform
const webStorage: { transactions: any[]; lineItems: any[] } = {
  transactions: [],
  lineItems: [],
};

// Mock database for web - actually stores data in memory
const createMockDb = () => ({
  select: () => ({
    from: (table: any) => ({
      orderBy: () => Promise.resolve(table === schema.transactions ? webStorage.transactions : webStorage.lineItems),
      where: (condition: any) => {
        // Simple mock - return all for now
        const data = table === schema.transactions ? webStorage.transactions : webStorage.lineItems;
        return Promise.resolve(data);
      },
    }),
  }),
  insert: (table: any) => ({
    values: (data: any) => {
      if (table === schema.transactions) {
        webStorage.transactions.push(data);
        console.log('[MockDB] Inserted transaction:', data.id);
      } else {
        const items = Array.isArray(data) ? data : [data];
        webStorage.lineItems.push(...items);
        console.log('[MockDB] Inserted line items:', items.length);
      }
      return Promise.resolve();
    },
  }),
  delete: (table: any) => ({
    where: () => Promise.resolve(),
  }),
});

let initPromise: Promise<void> | null = null;

function ensureDb() {
  if (dbInstance) {
    return dbInstance;
  }

  if (Platform.OS === 'web') {
    dbInstance = createMockDb();
    isInitialized = true;
    return dbInstance;
  }

  throw new Error('Database not initialized. Call initDatabase() first or await waitForDb().');
}

export const db = new Proxy({} as any, {
  get: (target, prop) => {
    const database = ensureDb();
    return (database as any)[prop];
  },
});

/**
 * Initialize the database. Safe to call multiple times.
 */
export async function initDatabase(): Promise<void> {
  if (isInitialized) {
    return;
  }

  // Prevent concurrent initialization
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      if (Platform.OS === 'web') {
        dbInstance = createMockDb();
        isInitialized = true;
        console.log('[DB] Web: Using in-memory mock database');
        return;
      }

      // For native platforms, dynamically import SQLite
      const { openDatabaseSync } = await import("expo-sqlite");
      const { drizzle } = await import("drizzle-orm/expo-sqlite");

      expoDb = openDatabaseSync("crescender_geargrabber.db");
      expoDb.execSync(initTablesSQL);
      dbInstance = drizzle(expoDb, { schema });

      isInitialized = true;
      console.log('[DB] SQLite database initialized');
    } catch (error) {
      console.error('[DB] Initialization error:', error);
      // Use mock DB as fallback
      dbInstance = createMockDb();
      isInitialized = true;
      console.log('[DB] Fallback: Using mock database');
    }
  })();

  return initPromise;
}

/**
 * Wait for database to be ready. Use this before any DB operations.
 */
export async function waitForDb(): Promise<void> {
  if (isInitialized) return;
  await initDatabase();
}
