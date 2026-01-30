# TypeScript Error Fix Plan

**Generated:** 30/Jan/2026  
**Scope:** `npx tsc --noEmit` errors (54 errors in 23 files)  
**Grouped by error kind** with recommended fixes.

---

## 1. Missing type declarations / module declarations

**Kind:** TS7016 – Could not find a declaration file for module 'X'

| File | Module | Fix |
|------|--------|-----|
| `app/__tests__/index.test.tsx` | `react-test-renderer` | `npm i --save-dev @types/react-test-renderer` (if exists) or add `declare module 'react-test-renderer';` in a `.d.ts` (e.g. `types/react-test-renderer.d.ts`). |
| `lib/fuzzyMatcher.ts` | `fast-levenshtein` | `npm i --save-dev @types/fast-levenshtein` or add `declare module 'fast-levenshtein';` in `types/fast-levenshtein.d.ts`. |

**Action:** Prefer installing `@types/*`; if a package has no types, add a minimal `declare module '...'` in a project `.d.ts` and ensure it’s included in `tsconfig.json`.

---

## 2. Test runner globals (describe, it, expect)

**Kind:** TS2582 / TS2304 – Cannot find name 'describe' | 'it' | 'expect'

| File | Fix |
|------|-----|
| `app/__tests__/index.test.tsx` | Install Jest types: `npm i --save-dev @types/jest`. Ensure `tsconfig.json` (or a `tsconfig.test.json` that extends it) includes the Jest globals, e.g. via `"types": ["jest"]` in the test config, or reference `@types/jest` so `describe`, `it`, `expect` are in scope. |

**Action:** Add `@types/jest` and ensure test files are compiled with Jest types (or equivalent for your test runner).

---

## 3. Implicit `any` parameters

**Kind:** TS7006 – Parameter 'X' implicitly has an 'any' type

| File | Location | Fix |
|------|----------|-----|
| `app/education/[id].tsx` | Line 91, `p` | Type the callback param, e.g. `(p: { name: string }) => ...`. Infer from the array element type if available. |
| `app/people/[id].tsx` | Line 179, `instrument` | Add type for `instrument` (e.g. from your domain type for instruments). |
| `app/scan.tsx` | Line 443, `s` | Type `s` (e.g. `(s: Student)` or whatever the array element type is). |
| `components/ads/BannerAd.tsx` | Line 86, `error` | Type as `(error: { message?: string; code?: number } \| unknown)` or use a type from the ads SDK if available. |
| `components/ads/InterstitialAd.tsx` | Line 79, `error` | Same as BannerAd – type the error param. |
| `lib/notifications/NotificationRepository.ts` | Lines 207, 251, 282, `row` | Type `row` from the query/table row type (e.g. DB schema type). |
| `lib/notifications/NotificationRepository.ts` | Line 294, `event` | Type `event` from your notification/event type. |
| `lib/peopleDetection.ts` | Line 79, `person` | Type `person` (e.g. `{ name: string }` or your Person type). |
| `lib/processingQueue.ts` | Lines 136, 160, `row`; 208, `item` | Type `row` / `item` from schema or repository return type. |
| `lib/stores/uploadStore.ts` | Line 204, `s` | Type `s` (e.g. same as the element type of `existingPeople`). |

**Action:** Add explicit parameter types (or type the callback from the array/source type). Rely on existing domain/schema types where possible.

---

## 4. Possibly undefined / null safety

**Kind:** TS18048 – 'X' is possibly 'undefined'

| File | Location | Fix |
|------|----------|-----|
| `app/education/[id].tsx` | Line 91, `eduDetails.studentName` | Guard: `eduDetails.studentName != null && ...` or optional chaining: `eduDetails.studentName?.toLowerCase()`. Align with the type of `eduDetails`. |

**Action:** Add a null/undefined check or optional chaining before calling methods on `eduDetails.studentName`.

---

## 5. Type / index errors (property doesn’t exist, wrong type used as type)

**Kind:** TS2339 / TS7053 / TS2367 / TS2322 – Property 'X' does not exist on type 'Y' | Element implicitly has 'any' type | Comparison has no overlap | Type not assignable

| File | Issue | Fix |
|------|--------|-----|
| `components/ads/BannerAd.tsx` | Line 51: `BannerAdSize` used as type | Use `typeof BannerAdSize` or the SDK’s size type (e.g. a union of size constants). |
| `app/gear/item/GearItemResourcesView.tsx` | Lines 96, 97, 113, 115, 127: `warrantyPhone` etc. not on `GearDetails`; `warrantyData` vs `GearDetails` | Extend `GearDetails` (or the prop type) to include `warrantyPhone`, `warrantyEmail`, `warrantyWebsite`, or introduce a dedicated `WarrantyData` type and type `gearDetails` / `warrantyData` and the link/contact keys so they align. Use type guards or narrowed types where you index with `link.key` / `contact.key`. |
| `app/gear/item/GearItemSpecsView.tsx` | Line 33: comparison `format === 'mono'` – types have no overlap | Ensure `format`’s type includes `'mono'` (e.g. `'default' \| 'mono'`) or cast only if you’re sure at runtime. |
| `app/review/components/ReviewLineItemCard.tsx` | Line 153: `EducationDetails` not assignable to `string` | The prop expects `educationDetails: string` but is passed an object. Either stringify before passing (e.g. `JSON.stringify(educationDetails)`) or change the prop type to accept `EducationDetails \| string` and handle both in the component. |
| `app/review/index.tsx` | Lines 22, 31: `params.forceMonolithic` | Extend `useLocalSearchParams` type to include `forceMonolithic?: string`, e.g. `useLocalSearchParams<{ data: string; uri: string; queueItemId?: string; forceMonolithic?: string }>()`. |
| `app/review/workflow/WorkflowEventsPage.tsx` | Lines 64, 66: `item.date` | Event/row type has `createdAt` (or similar), not `date`. Use `item.createdAt` (or the correct field) and optionally map to a `date` for display, or add a `date` field to the type if it exists at runtime. |
| `lib/educationChain.ts` | Line 102: `receipt.items` | Receipt type from DB/schema doesn’t include `items`. Use the correct relation/query that returns receipt with line items (e.g. `getAllWithItems()`) and type that return, or extend the receipt type to include `items` where it’s actually loaded. |
| `lib/notifications/Policy.ts` | Lines 117, 130, 131: `categoryPolicy.maxPerItem` | Some union members don’t have `maxPerItem`. Use a type guard: `'maxPerItem' in categoryPolicy && categoryPolicy.maxPerItem` (and then use `categoryPolicy.maxPerItem`), or narrow the union so that the branch only runs when the policy has `maxPerItem`. |

**Action:** Align types with runtime data (add missing props to types, use correct field names, narrow unions, fix prop types).

---

## 6. Missing or wrong exports / imports

**Kind:** TS2305 – Module has no exported member 'X'

| File | Issue | Fix |
|------|--------|-----|
| `hooks/useNotificationSettings.ts` | `PermissionManager` not exported from `@lib/notifications/PermissionManager` | That module exports `getPermissionStatus`, `ensurePermissionGranted`, etc. Change to `import { ensurePermissionGranted } from '@lib/notifications/PermissionManager'` and replace `PermissionManager.ensurePermissionGranted()` with `ensurePermissionGranted()`. |
| `lib/cloudLogger.ts` | `supabase` not exported from `./supabase` | `lib/supabase.ts` only exports `callSupabaseFunction`. Either: (a) add a Supabase client (e.g. `createClient` from `@supabase/supabase-js`) in `lib/supabase.ts` and export it for cloudLogger to use, or (b) refactor cloudLogger to send logs via `callSupabaseFunction` (or another existing API) instead of direct `supabase.from('app_logs').insert()`. |

**Action:** Fix imports to use actual exports; add Supabase client or refactor cloudLogger as above.

---

## 7. Wrong types (assignability)

**Kind:** TS2322 – Type 'number' is not assignable to type 'Timeout'

| File | Issue | Fix |
|------|--------|-----|
| `lib/cloudLogger.ts` | Line 69: `setInterval` return type | In RN/browser, `setInterval` returns a number. Change `private flushInterval: NodeJS.Timeout \| null` to `private flushInterval: ReturnType<typeof setInterval> \| null` or `number \| null`. |

**Action:** Use a type that matches the environment (number for RN/browser).

---

## 8. Missing variable / undefined reference

**Kind:** TS2304 – Cannot find name 'X'

| File | Issue | Fix |
|------|--------|-----|
| `app/people/[id].tsx` | Line 54: `setCurrentChainIndex` | Only `setCurrentChainIndices` and `setCurrentChain` exist. When setting the first chain, use e.g. `setCurrentChainIndices(prev => ({ ...prev, [id]: 0 }))` (if keyed by person id) or add a dedicated `currentChainIndex` state and `setCurrentChainIndex` if you prefer a single index. |
| `app/review/components/ReviewContent.tsx` | Lines 261–307: `queueItemId` | `queueItemId` is used but not in scope. Pass it as a prop (e.g. from route params or parent) or read from `useLocalSearchParams()` / context and use it in `handleSave`. Remove duplicate blocks (same “Clean up queue item” logic repeated 3 times) and keep a single block that uses the resolved `queueItemId`. |
| `app/settings.tsx` | Line 219: `router` | `useRouter` is imported but not called. Add `const router = useRouter();` at the top of `SettingsScreen`. |

**Action:** Define or pass the missing variable; fix duplicate logic in ReviewContent.

---

## 9. API / module method doesn’t exist

**Kind:** TS2339 – Property 'getInitialURL' does not exist on type 'typeof import(...)'

| File | Issue | Fix |
|------|--------|-----|
| `app/share.tsx` | Line 31: `IntentLauncher.getInitialURL()` | `expo-intent-launcher` doesn’t provide `getInitialURL`. For “share intent” content on Android, use the appropriate API (e.g. `expo-linking.getInitialURL()` for cold start URL, or the intent/sharable file API that matches your setup). Replace the call with the correct API and type the return value. |

**Action:** Use the correct Expo/React Native API for the share/intent flow and update types if needed.

---

## Suggested order of work

1. **Quick wins (no behaviour change)**  
   - Add `@types/jest`, `@types/react-test-renderer` (or declarations).  
   - Add `declare module 'fast-levenshtein'` (or `@types/fast-levenshtein`).  
   - Fix `lib/cloudLogger.ts`: `flushInterval` type and `supabase` import (add client or refactor).  
   - Fix `hooks/useNotificationSettings.ts`: use `ensurePermissionGranted` instead of `PermissionManager`.  
   - Fix `app/settings.tsx`: add `const router = useRouter();`.

2. **Route/params and missing refs**  
   - `app/review/index.tsx`: add `forceMonolithic` to params type.  
   - `app/review/components/ReviewContent.tsx`: introduce/pass `queueItemId`, deduplicate cleanup logic.  
   - `app/people/[id].tsx`: replace `setCurrentChainIndex(0)` with correct state update (or add the setter).

3. **Typing and narrowing**  
   - Add explicit parameter types (implicit `any`) in the files listed in §3.  
   - Fix gear/review/education types and Policy/WorkflowEventsPage/educationChain as in §5.  
   - Fix `app/share.tsx` API usage and types (§9).

4. **Tests and stricter checks**  
   - Ensure test files are included in a config that has Jest types (§2).  
   - Run `npx tsc --noEmit` again and fix any remaining errors in the same way (declarations, types, guards, correct APIs).

---

## File count by category

| Category | Files |
|----------|--------|
| Missing type declarations | 2 |
| Test runner globals | 1 |
| Implicit any parameters | 10 |
| Possibly undefined | 1 |
| Type/index errors | 8 |
| Missing/wrong exports | 2 |
| Wrong assignability | 1 |
| Missing variable / ref | 3 |
| API/method doesn’t exist | 1 |

Total: 23 files, 54 errors.
