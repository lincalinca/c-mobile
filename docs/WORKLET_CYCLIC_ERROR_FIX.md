# Worklet Cyclic Object Serialization Error Fix

**Component:** `MusicFlowBackground.tsx`  
**Error:** `[Worklets] Trying to convert a cyclic object to a serializable. This is not supported.`  
**Created:** 2026-01-22  
**Status:** 🔴 In Progress

---

## Problem Summary

The animated music stave background throws a cyclic object error when Reanimated's worklet runtime attempts to serialize JavaScript objects for the UI thread. The animation must remain fully functional (15 staves × 2 layers = 30 animated SVG paths).

---

## Attempts Tracker

### Attempt 1: Remove Conflicting Worklet Packages
**Effort:** Low (2 minutes)
**Status:** [x] Complete - INVALID APPROACH

**Hypothesis:** Reanimated 4.x includes its own worklets runtime. Having separate `react-native-worklets` and `react-native-worklets-core` packages causes runtime conflicts.

**Action:**
```bash
npm uninstall react-native-worklets react-native-worklets-core
npx expo start --clear
```

**Result:**
- [ ] Fixed
- [ ] Partially fixed
- [ ] No change
- [x] Made worse

**Notes:**
Hypothesis was incorrect. `react-native-reanimated@4.1.1` **depends on** these packages - they are peer dependencies, not conflicting packages. Removing them caused:
```
ERROR: Cannot find module 'react-native-worklets-core/plugin'
```
Packages reinstalled. Moving to Attempt 2.

---

### Attempt 2: Fix useAnimatedProps Dependency Array
**Effort:** Low (1 line change)
**Status:** [x] Complete - FIXED ✅

**Hypothesis:** SharedValue objects in the dependency array trigger serialisation. SharedValues are auto-tracked in worklets and don't need to be in deps.

**File:** `components/common/MusicFlowBackground.tsx`  
**Line:** ~74

**Current Code:**
```tsx
const animatedProps = useAnimatedProps(() => {
  'worklet';
  // ... worklet code
}, [baseYPercent, phase, amplitude, frequency, time, widthSV, heightSV]);
```

**Fixed Code:**
```tsx
const animatedProps = useAnimatedProps(() => {
  'worklet';
  // ... worklet code
}, [baseYPercent, phase, amplitude, frequency]);
```

**Result:**  
- [ ] Fixed  
- [ ] Partially fixed  
- [ ] No change  
- [ ] Made worse  

**Notes:**  
_To be completed after attempt_

---

### Attempt 3: Version Alignment
**Effort:** Medium (may require testing combinations)  
**Status:** [ ] Not Started

**Hypothesis:** Incompatibility between `react-native-reanimated@4.1.1` and `react-native-svg@15.15.1`.

**Action:**
```bash
npm install react-native-reanimated@3.16.1 react-native-svg@15.8.0
npx expo start --clear
```

**Alternative versions to try if above fails:**
- `react-native-reanimated@3.10.0` + `react-native-svg@15.3.0`
- `react-native-reanimated@3.8.0` + `react-native-svg@14.1.0`

**Result:**  
- [ ] Fixed  
- [ ] Partially fixed  
- [ ] No change  
- [ ] Made worse  

**Notes:**  
_To be completed after attempt_

---

### Attempt 4: Refactor Worklet to Module Scope
**Effort:** Medium  
**Status:** [ ] Not Started

**Hypothesis:** React.memo wrapper captures component fibre context in closures that get serialised, creating cycles.

**Action:** Extract worklet creation outside React component tree.

**See implementation in:** `docs/WORKLET_FIX_ATTEMPT_4.md` (to be created if needed)

**Result:**  
- [ ] Fixed  
- [ ] Partially fixed  
- [ ] No change  
- [ ] Made worse  

**Notes:**  
_To be completed after attempt_

---

### Attempt 5: Isolate AnimatedPath Closure Chains  
**Effort:** Medium-High  
**Status:** [ ] Not Started

**Hypothesis:** Cross-contamination of closures between 30 AnimatedPath instances causes cycles.

**Action:** Create local refs within each Stave to break closure chains to parent scope.

**See implementation in:** `docs/WORKLET_FIX_ATTEMPT_5.md` (to be created if needed)

**Result:**  
- [ ] Fixed  
- [ ] Partially fixed  
- [ ] No change  
- [ ] Made worse  

**Notes:**  
_To be completed after attempt_

---

## Resolution Log

| Date | Attempt | Outcome | Notes |
|------|---------|---------|-------|
| | | | |

---

## Final Resolution

**Successful Approach:** _TBD_  
**Final Status:** 🔴 Unresolved

---

## References

- [Reanimated Worklets Documentation](https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/glossary#worklet)
- [react-native-svg with Reanimated](https://github.com/software-mansion/react-native-svg#animations)
- Error stack trace: `WorkletsErrorConstructor → detectCyclicObject → createSerializableNative → cloneObjectProperties (recursive)`

