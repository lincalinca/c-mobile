# Plan: Manual Entry Wizard & Data Portability

## Part 1: Manual Entry Flows ("Receipt-less")

### A. User Experience & Navigation

1.  **Entry Point**:
    - Update `CameraBar.tsx` modal.
    - Add a distinct link/button at the bottom: "Don't have a receipt? Click here".
2.  **Navigation (`app/manual-entry/`)**:
    - `index.tsx`: Landing page. Options: "Quick Wizard" (Form) or "Crescender Assistant" (Chat).
    - `_layout.tsx`: Modal presentation on mobile, centered overlay on tablet.

### B. Methodology: "Social Engineering" & Cost Efficiency

To limit AI costs, we will use a **Client-Side "Pre-flight" Strategy**. The app will not call the AI API for every single message. Instead, it will use local logic to gather the "Raw Materials" before sending a single, high-value prompt to the backend.

#### **Flow 1: The Wizard (Pre-governed)**

- **Concept**: A fast, deterministic form for power users.
- **UI**:
  1.  **Category Grid**: Big buttons for Gear, Event, Service, Education, or Transaction.
  2.  **Adaptive Form**: Fields change based on category (e.g., "Education" asks for Student Name, "Gear" asks for Serial Number).
  3.  **Review**: Display the generated JSON card for validaton.
- **Cost**: **$0** (Purely client-side until final save/enrichment).

#### **Flow 2: The Assistant (Interactive)**

- **Concept**: A chat interface that feels like an AI but uses heuristic "guardrails" for the initial collection phase.
- **Logic (The "Guardrail" State Machine)**:
  1.  **State 1: Identification**:
      - _Bot_: "What would you like to add? (Gear, Event, Lesson...)"
      - _Local Logic_: Regex match user input to categorize.
  2.  **State 2: Collection**:
      - Based on Category, ask 2-3 specific questions. (e.g., Gear -> "What brand and model?", "How much was it?").
      - _User_: "It's a Fender Strat, paid $1200".
  3.  **State 3: Handoff**:
      - Once core fields (What, When, How Much) are detected locally, trigger the **"Deep Thinking"** API.
- **The "Deep Thinking" Prompt (Server-Side)**:
  - **Goal**: Take the rough user inputs and "Perfect" the data.
  - **Capabilities**:
    - **Enrichment**: Search internal knowledge for brand specifics (e.g., "Fender Stratocaster" full name).
    - **Context**: Infer missing metadata (e.g., if "Lesson", assume standard 30/60m duration if unspecified).
    - **Formatting**: Map strictly to the `LineItem` schema properties (`gearDetails`, `educationDetails`, etc.).
  - **Avatar**: Use the Crescender Logo for AI messages.

### C. Technical Implementation

1.  **New Supabase Edge Function**: `enrich-entry`
    - **Input**: `{ userBuffer: string[], detectedCategory: string }`
    - **System Prompt**:
      > "You are the Crescender Archivist. Your goal is to take informal user descriptions and structured rough drafts, and convert them into a pristine, detailed JSON record matching the [Schema]. You should use your knowledge of music gear, educational providers, and service types to infill missing details (e.g. valid websites, brand spellings) where highly confident."
2.  **Components**:
    - `ChatInterface`: FlatList with `UserBubble` (Right) and `AIBubble` (Left + Logo).
    - `WizardStepper`: Progress indicator.
    - `CategorySelector`: Reusable grid component.

---

## Part 2: Data Portability (Backup & Restore)

### A. Strategy

We will use a standard ZIP archive format (`.crs` or `.zip`) to bundle the SQLite database file alongside the local image assets. This ensures a complete restore is possible even offline.

### B. Implementation

#### **1. Export (Backup)**

- **Location**: `Settings` -> `Data Management`.
- **Logic**:
  1.  **Lock DB**: Ensure no active writes.
  2.  **Query Images**: Select distinct `image_url` where path starts with `file://`.
  3.  **JSZip Bundle**:
      - `database.sqlite` (The actual SQLite db file).
      - `assets/` (Folder containing all local receipt images).
      - `metadata.json` (Version timestamp, User ID, Device info).
  4.  **Share**: Trigger system share sheet to save to Files/iCloud/Drive.

#### **2. Import (Restore)**

- **Logic**:
  1.  **Pick**: Use `expo-document-picker` to select file.
  2.  **Validate**: Unzip metadata.json + database.sqlite to a temp dir. Check valid schema.
  3.  **Swap**:
      - **Danger Zone**: Delete current DB and local Assets.
      - Replace with unzipped contents.
  4.  **Reload**: `Updates.reloadAsync()` to refresh app state.

### C. Dependencies

- `jszip`: For compression.
- `expo-file-system`: Directory management.
- `expo-sharing`: Export interface.
- `expo-document-picker`: Import interface.
