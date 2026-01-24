# Crescender Mobile

The official Crescender mobile app "GearGrabber" - an AI-powered receipt scanner for musicians, helping you track gear purchases, lessons, services, and events.

## Features

### Core Functionality
- **AI-Powered Receipt Scanning**: Capture receipts with your camera and automatically extract:
  - Musical gear with detailed specifications (brand, model, serial numbers, condition, tier)
  - Education/lessons (teacher, student, frequency, schedule)
  - Services (repairs, maintenance, warranty details)
  - Events (concerts, rehearsals, performances)
- **Smart Categorization**: AI automatically categorizes line items and extracts structured metadata
- **Calendar Integration**: Export education and service events directly to your device calendar
- **Financial Tracking**: Track spending by category with date range filtering
- **Local-First Architecture**: All data stored securely in local SQLite database
- **Anonymous Usage**: No registration required to start scanning

### Advanced Features
- **Event Series Grouping**: Education items automatically create recurring calendar events
- **Service Continuity**: Links related services (e.g., warranty with original purchase)
- **Multi-Step Review Workflow**: Guided review process for captured receipts with:
  - Transaction details editing
  - Missing data prompts
  - Item-by-item gear, service, and education verification
- **Simplified Review Mode**: Quick approval for simple receipts
- **Date Range Filtering**: Filter results by custom date ranges or financial year
- **Icon-Based Filters**: Quick filter by gear, events, services, or education
- **Ad-Free Base Experience**: 10 free scans included, with optional ad-supported additional scans

## Tech Stack

### Core Framework
- **Expo SDK 54** - React Native framework with modern tooling
- **React 19.1** - Latest React with improved performance
- **React Native 0.81.5** - Native mobile runtime
- **Expo Router 6** - File-based routing with type-safe navigation
- **TypeScript 5.9** - Full type safety across the codebase

### Styling & UI
- **NativeWind 4.2** - Tailwind CSS for React Native
- **React Native Reanimated 4.1** - High-performance animations
- **React Native SVG** - Vector graphics support
- **Expo Linear Gradient** - Gradient backgrounds

### Database & ORM
- **Expo SQLite 16** - Local SQLite database
- **Drizzle ORM 0.45** - Type-safe database ORM
- **Drizzle Kit 0.31** - Database migrations and schema management

### AI & Backend
- **Supabase Edge Functions** - Serverless AI processing
- **OpenAI Vision API** - Receipt image analysis and data extraction
- **Custom AI Prompts** - Specialized prompts for musical gear, education, and service extraction

### Key Libraries
- **expo-camera 17** - Camera access for receipt scanning
- **expo-image-picker 17** - Image selection from gallery
- **expo-document-picker 14** - Document file selection
- **expo-calendar 15** - Calendar integration for events
- **react-native-calendars 1.1313** - Calendar UI components
- **date-fns 4.1** - Modern date manipulation
- **expo-crypto 15** - Cryptographic functions for ID generation
- **@react-native-async-storage/async-storage 2.2** - Persistent key-value storage

### Monetization
- **react-native-google-mobile-ads 16** - AdMob integration
- **expo-tracking-transparency 6** - iOS App Tracking Transparency (ATT) compliance

### Development Tools
- **Jest 29** - Testing framework
- **TypeScript** - Static type checking
- **Babel** - JavaScript transpilation

## Project Structure

```
crescender-mobile/
├── app/                          # Expo Router pages
│   ├── index.tsx                # Home screen with filtered results grid
│   ├── scan.tsx                 # Camera screen for receipt capture
│   ├── history.tsx              # Receipt history browser
│   ├── settings.tsx             # App settings and preferences
│   ├── review/                  # Receipt review workflows
│   │   ├── index.tsx           # Review mode selector
│   │   ├── simplified/         # Quick review for simple receipts
│   │   └── workflow/           # Multi-step guided review
│   ├── gear/                    # Gear detail pages
│   │   ├── [id].tsx            # Receipt detail with captured gear
│   │   └── item/[id].tsx       # Individual gear item detail
│   ├── events/[id].tsx          # Event detail pages
│   ├── education/[id].tsx       # Education detail pages
│   ├── services/[id].tsx        # Service detail pages
│   └── cal/[eventId].tsx        # Calendar export confirmation
├── components/                   # Reusable UI components
│   ├── results/                 # Result card components
│   │   ├── BaseCard.tsx        # Shared card component with animations
│   │   ├── GearCard.tsx        # Gear item card
│   │   ├── EventCard.tsx       # Event/education card
│   │   ├── ServiceCard.tsx     # Service card
│   │   ├── EducationCard.tsx   # Education card with animated highlight
│   │   ├── SimpleCard.tsx      # Abridged card without footer (for detail pages)
│   │   └── CardGrid.tsx        # Responsive grid layout
│   ├── calendar/                # Calendar components
│   │   ├── DateRangeCalendarModal.tsx  # Date range picker
│   │   └── DatePickerModal.tsx         # Single date picker
│   ├── filters/                 # Filter bar components
│   ├── header/                  # Header components
│   ├── processing/              # AI processing UI
│   └── ads/                     # AdMob components
├── lib/                         # Business logic & utilities
│   ├── repository.ts           # Database repository layer
│   ├── results.ts              # Result reshaping and aggregation
│   ├── educationChain.ts       # Education item grouping logic
│   ├── educationContinuity.ts  # Series detection for education
│   ├── educationEvents.ts      # Calendar event generation
│   ├── educationUtils.ts       # Education formatting utilities
│   ├── serviceEvents.ts        # Service calendar events
│   ├── reviewWorkflow.ts       # Multi-step review state machine
│   ├── reviewConfig.ts         # Review mode configuration
│   ├── calendarExport.ts       # Calendar integration
│   ├── dateUtils.ts            # Date formatting and parsing
│   ├── formatUtils.ts          # General formatting utilities
│   ├── supabase.ts             # Supabase function calls
│   └── usageTracking.ts        # Usage and quota tracking
├── db/                          # Database layer
│   ├── schema.ts               # Drizzle ORM schema definitions
│   └── client.ts               # SQLite client initialization
└── constants/                   # App constants
    └── categories.ts           # Item categories and mappings

```

## Database Schema

### Tables
- **transactions**: Receipt/invoice documents with merchant details, totals, payment status
- **line_items**: Individual items from receipts with category, price, quantity
- **gear_details**: Extracted gear metadata (manufacturer, model, serial, condition, URLs)
- **service_details**: Service metadata (technician, warranty, next service date)
- **education_details**: Education metadata (teacher, student, schedule, frequency)
- **event_details**: Event metadata (venue, duration, performers)

### Key Features
- Type-safe queries with Drizzle ORM
- JSON columns for complex nested data
- Automatic timestamp tracking
- Foreign key relationships between items and details

## AI Processing Pipeline

1. **Image Capture**: User takes photo of receipt
2. **Vision Analysis**: OpenAI GPT-4 Vision extracts structured data
3. **Smart Categorization**: AI categorizes items as gear/service/education/event
4. **Metadata Extraction**: Type-specific details extracted per category
5. **Local Storage**: Data saved to SQLite with full type safety
6. **Review Workflow**: User validates and corrects AI extractions
7. **Calendar Sync**: Education and service events exported to calendar

## Development

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator (macOS) or Android Emulator

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Create a `.env` file with:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Initialize database:
   ```bash
   npx drizzle-kit generate
   ```

### Running the App

Development mode with Expo Go:
```bash
npm start
```

Run on iOS simulator:
```bash
npm run ios
```

Run on Android emulator:
```bash
npm run android
```

### Testing

Run test suite:
```bash
npm test
```

Run Android-specific tests:
```bash
npm run test:android
```

## Key Design Patterns

### Local-First Architecture
- All data stored in local SQLite database
- No cloud sync (privacy-focused)
- Instant read/write with no network dependency
- AI processing via serverless edge functions

### Type-Safe Database Access
- Drizzle ORM provides full TypeScript types
- Repository pattern for data access
- Strongly-typed query results

### Responsive Card Grid
- Adaptive 2-column layout on mobile
- Expandable to 3+ columns on tablets
- Consistent card heights with flex layout
- Smooth animations with Reanimated

### Smart Event Aggregation
- Education items grouped into series
- Recurring events shown as single card with count badge
- Individual event drill-down available
- Calendar export creates all instances

### Progressive Review Workflows
- Simple receipts → Simplified review (single screen)
- Complex receipts → Multi-step workflow (guided)
- Missing data detection prompts user input
- Granular item-by-item verification

## Performance Optimizations

- **Lazy Loading**: Components load on-demand
- **Memoization**: `useMemo` and `useCallback` for expensive computations
- **FlatList**: Virtualized scrolling for large result sets
- **Worklets**: Reanimated worklets for 60fps animations
- **AsyncStorage**: Persistent settings without database overhead

## Privacy & Security

- **No User Accounts**: Anonymous usage by default
- **Local-Only Storage**: All data stored on device
- **No Cloud Sync**: Receipts never leave your device
- **Secure Processing**: AI processing via secure edge functions
- **ATT Compliance**: iOS App Tracking Transparency support

## Monetization Model

- **10 Free Scans**: Base quota for all users
- **Ad-Supported Scans**: Watch ads to earn additional scans
- **Privacy-First**: No personal data collection
- **Transparent Limits**: Clear usage tracking UI

## Future Roadmap

### Phase 1: Cloud Integration
- **Cloud Save** - Optional encrypted cloud backup of receipts and data
  - Sync mechanism with conflict resolution
  - Schema alignment with main Crescender database
  - RESTful API or GraphQL endpoints for data exchange
  - ETL pipeline for legacy data migration
- **Crescender Account Integration** - Link mobile app to main Crescender platform
  - OAuth/JWT authentication flow
  - Unified user identity across platforms
  - Shared data models and schema versioning
  - Real-time sync via WebSockets or polling

### Phase 2: Entity Pages
- **Merchant Page** - Dedicated merchant profile and transaction history
  - Aggregate spending per merchant
  - Merchant contact details and notes
  - Link to main app's merchant database
  - API sync for merchant metadata updates
- **Student Page** - Student-centric view of education activities
  - Progress tracking and lesson history
  - Payment history and outstanding balances
  - Schedule and calendar view
  - Schema alignment with main app's student/education models
- **Gear Status** - Lifecycle tracking for musical gear
  - Current condition and location
  - Service history and warranty status
  - Depreciation and insurance value
  - API endpoints for gear state updates
  - Sync with main app's gear inventory system

### Phase 3: Advanced Features
- Receipt sharing and export (PDF, CSV, Excel)
- Tax deduction reports with ATO compliance
- Gear depreciation tracking and forecasting
- Insurance documentation generation
- Multi-currency support with historical rates
- Web dashboard for desktop access

### Technical Considerations
- **Schema Versioning**: Maintain compatibility between mobile SQLite and main app database
- **API Design**: RESTful or GraphQL APIs for bidirectional sync
- **Conflict Resolution**: Last-write-wins or operational transformation for concurrent edits
- **Data Migration**: ETL pipelines for transitioning local-only data to cloud
- **Offline-First**: Queue mutations when offline, sync when online
- **Type Safety**: Shared TypeScript types between mobile and backend
- **Change Data Capture**: Track changes for efficient syncing (delta updates)

## License

Proprietary - All rights reserved
