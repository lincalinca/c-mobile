import { Platform } from "react-native";
import * as schema from "./schema";

let expoDb: any = null;
let dbInstance: any = null;
let isInitialized = false;

// Migration SQL to add missing columns to existing tables
const migrationSQL = `
  -- Add summary column if it doesn't exist (Phase 1)
  ALTER TABLE transactions ADD COLUMN summary text;

  -- Add warranty_details column if it doesn't exist (Phase 2)
  ALTER TABLE line_items ADD COLUMN warranty_details text;
`;

const initTablesSQL = `
  -- Transactions table (the receipt/invoice document)
  CREATE TABLE IF NOT EXISTS transactions (
    id text PRIMARY KEY NOT NULL,
    profile_id text,
    summary text,
    merchant text NOT NULL,
    merchant_abn text,
    merchant_address text,
    merchant_phone text,
    merchant_email text,
    merchant_website text,
    merchant_suburb text,
    merchant_state text,
    merchant_postcode text,
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
    sku text,
    serial_number text,
    quantity integer DEFAULT 1,
    original_unit_price integer,
    unit_price integer NOT NULL,
    discount_amount integer,
    discount_percentage real,
    total_price integer NOT NULL,
    gear_details text,
    education_details text,
    service_details text,
    warranty_details text,
    notes text,
    confidence real,
    images text,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
  );

  -- Students table (people/student profiles)
  CREATE TABLE IF NOT EXISTS students (
    id text PRIMARY KEY NOT NULL,
    name text NOT NULL,
    relationship text,
    instrument text,
    started_lessons_date text,
    notes text,
    created_at text DEFAULT CURRENT_TIMESTAMP,
    updated_at text DEFAULT CURRENT_TIMESTAMP
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

      // Run migrations - these will fail silently if columns already exist
      // Phase 1: Merchant details columns
      const phase1Migrations = [
        'ALTER TABLE transactions ADD COLUMN summary text;',
        'ALTER TABLE transactions ADD COLUMN merchant_phone text;',
        'ALTER TABLE transactions ADD COLUMN merchant_email text;',
        'ALTER TABLE transactions ADD COLUMN merchant_website text;',
        'ALTER TABLE transactions ADD COLUMN merchant_address text;',
        'ALTER TABLE transactions ADD COLUMN merchant_suburb text;',
        'ALTER TABLE transactions ADD COLUMN merchant_state text;',
        'ALTER TABLE transactions ADD COLUMN merchant_postcode text;',
      ];

      for (const migration of phase1Migrations) {
        try {
          expoDb.execSync(migration);
          console.log('[DB] Migration:', migration.split('ADD COLUMN ')[1]);
        } catch (e) {
          // Column already exists, ignore
        }
      }

      // Phase 2: Warranty details column
      try {
        expoDb.execSync('ALTER TABLE line_items ADD COLUMN warranty_details text;');
        console.log('[DB] Migration: Added warranty_details to line_items');
      } catch (e) {
        // Column already exists, ignore
      }

      // Phase 3: SKU column (transaction capture improvements)
      try {
        expoDb.execSync('ALTER TABLE line_items ADD COLUMN sku text;');
        console.log('[DB] Migration: Added sku to line_items');
      } catch (e) {
        // Column already exists, ignore
      }

      // Phase 4: Service details column (service dates and event generation)
      try {
        expoDb.execSync('ALTER TABLE line_items ADD COLUMN service_details text;');
        console.log('[DB] Migration: Added service_details to line_items');
      } catch (e) {
        // Column already exists, ignore
      }

      // Added images column
      try {
        expoDb.execSync('ALTER TABLE line_items ADD COLUMN images text;');
        console.log('[DB] Migration: Added images to line_items');
      } catch (e) {
        // Column already exists, ignore
      }

      // Phase 5: Students table (people/student profiles)
      try {
        expoDb.execSync(`
          CREATE TABLE IF NOT EXISTS students (
            id text PRIMARY KEY NOT NULL,
            name text NOT NULL,
            relationship text,
            instrument text,
            started_lessons_date text,
            notes text,
            created_at text DEFAULT CURRENT_TIMESTAMP,
            updated_at text DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('[DB] Migration: Created students table');
      } catch (e) {
        // Table already exists, ignore
      }

      // Phase 6: Notification tables
      try {
        expoDb.execSync(`
          CREATE TABLE IF NOT EXISTS notification_settings (
            id text PRIMARY KEY NOT NULL DEFAULT 'default',
            global_enabled integer DEFAULT 0,
            per_category_enabled text NOT NULL DEFAULT '{}',
            daily_limit integer DEFAULT 1,
            weekly_limit integer DEFAULT 6,
            created_at text DEFAULT CURRENT_TIMESTAMP,
            updated_at text DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('[DB] Migration: Created notification_settings table');
      } catch (e) {
        // Table already exists, ignore
      }

      try {
        expoDb.execSync(`
          CREATE TABLE IF NOT EXISTS notification_events (
            id text PRIMARY KEY NOT NULL,
            category text NOT NULL,
            key text NOT NULL,
            scheduled_at text NOT NULL,
            trigger_at text NOT NULL,
            status text NOT NULL DEFAULT 'scheduled',
            metadata text NOT NULL DEFAULT '{}',
            os_notification_id text,
            created_at text DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('[DB] Migration: Created notification_events table');
      } catch (e) {
        // Table already exists, ignore
      }

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
