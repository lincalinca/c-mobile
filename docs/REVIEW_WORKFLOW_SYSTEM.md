# Review Workflow System

## Overview

The review screen has been refactored into a flexible system with three approaches:

1. **Monolithic** (default/legacy): Single-page full-detail review
2. **Workflow**: Multi-page step-by-step approach
3. **Simplified**: Minimal display, trust AI, prompt only for critical missing data

All approaches are available as user preferences and can be switched anytime in Settings.

## Architecture

### User Preference System

**Location**: `lib/reviewConfig.ts`

- Stores user preference in AsyncStorage
- Default: `monolithic` (preserves existing behavior)
- Accessible via Settings screen under "Receipt Review" section
- User can change preference at any time

### Router

**Location**: `app/review/index.tsx`

Routes to the appropriate component based on the user's preference:
- `workflow` → `app/review/workflow/WorkflowRouter.tsx`
- `simplified` → `app/review/simplified/SimplifiedReview.tsx`
- `monolithic` → `app/review.tsx` (existing)

### Workflow Approach

**Structure**: `app/review/workflow/`

Multi-page workflow with the following steps:

1. **Title Page** (`WorkflowTitlePage.tsx`)
   - Shows AI summary and detected items count
   - "Next" button to proceed

2. **Missing Data Page** (`WorkflowMissingDataPage.tsx`)
   - Only shown if critical data is missing (e.g., lesson start dates)
   - Prompts user to enter required information
   - "Next" button to continue

3. **Transaction Page** (`WorkflowTransactionPage.tsx`)
   - Review/edit transaction details (merchant, date, total)
   - Buttons: "Cancel", "Save & Exit", "Save & Next"

4. **Category Pages** (one per category with items):
   - **Gear Page** (`WorkflowGearPage.tsx`): Gear items + gear-related services
   - **Services Page** (`WorkflowServicesPage.tsx`): Non-gear services
   - **Education Page** (`WorkflowEducationPage.tsx`): Education items + education-related events
   - **Events Page** (`WorkflowEventsPage.tsx`): Standalone events
   - Each has: "Cancel", "Save & Exit", "Save & Next"

5. **Complete**: Auto-saves and redirects to home

**State Management**: `lib/reviewWorkflow.ts`
- `ReviewWorkflowState`: Centralized state for all workflow data
- `analyzeMissingData()`: Identifies critical missing fields
- `getNextStep()`: Determines next step in workflow
- `countItemsByCategory()`: Helper for routing logic

### Simplified Approach

**Location**: `app/review/simplified/SimplifiedReview.tsx`

- Single-page display
- Shows minimal information: merchant, summary, total, date
- Only prompts for critical missing data (required fields)
- Trust message: "AI has captured all details"
- Save buttons: "SAVE TRANSACTION" or "SAVE + VIEW" / "+ CALENDAR" (for education/events)

## Usage

### Changing Review Style Preference

1. Open Settings screen
2. Find "Receipt Review" section
3. Tap "Review Style"
4. Select your preferred option:
   - **Full Details**: See all captured information on a single page. Best for detailed review and editing.
   - **Workflow**: Step-by-step multi-page review. Guided process through each category.
   - **Simplified**: Minimal display, trust AI. Only prompts for critical missing information.

Your preference is saved immediately and will be used for all future receipt reviews.

### Workflow Navigation

- **Next**: Proceeds to next step in sequence
- **Back**: Returns to previous step (or title page)
- **Save & Exit**: Saves transaction and returns to home
- **Save & Next**: Saves progress and continues to next step

### Missing Data Detection

The system automatically detects critical missing information:

- **Education items**: Lesson start date (required)
- **Education items**: Student name, frequency (optional)
- **Service items**: Service start date (optional)
- **Event items**: Event date (required)

Missing data page only appears if required fields are missing.

## Implementation Details

### Save Logic

All approaches use the same underlying save mechanism:
- `TransactionRepository.create()` for transaction and line items
- Interstitial ad shown after successful save
- Navigation to home screen

### State Persistence

- Workflow state is maintained in memory during the session
- No persistence between app restarts (by design - user should complete in one session)
- User preference persists via AsyncStorage and applies to all future receipts

### Category Grouping

- **Gear-related services**: Shown on Gear page
- **Education-related events**: Shown on Education page
- **Standalone services/events**: Shown on respective category pages

## Future Enhancements

Potential improvements:

1. **Edit Functionality**: Add edit screens for individual items in workflow pages
2. **Progress Indicator**: Show progress bar/step counter in workflow
3. **History Navigation**: Better back navigation with step history
4. **Partial Save**: Save progress mid-workflow (currently only "Save & Exit")
5. **Validation**: Form validation before proceeding to next step
6. **Custom Fields**: Allow users to add custom fields per category

## Testing

To test different review styles:

1. Set your preference in Settings → Receipt Review → Review Style
2. Scan a receipt
3. Review the experience
4. Switch preferences and compare different approaches

Recommended test scenarios:
- Simple receipt (gear only)
- Complex receipt (multiple categories)
- Education receipt (with missing lesson dates)
- Service receipt (with missing dates)

You can switch preferences anytime to find what works best for your workflow.
