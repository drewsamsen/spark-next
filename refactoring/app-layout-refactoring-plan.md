# App Layout Refactoring Plan

## 🎯 Current Status (Updated October 2025)

### ✅ PHASES 1 & 2 COMPLETE - Goals Exceeded!

**Achievements:**
- ✅ **Phase 1 COMPLETE**: SidebarContext integrated into AppLayout  
- ✅ **Phase 2 COMPLETE**: Unified data loading with `useSidebarData` hook
- ✅ **Target Exceeded**: Reduced from 420 → 185 lines (235 lines removed, 56% reduction!)
- ✅ Single source of truth for sidebar state (SidebarContext)
- ✅ Single source of truth for sidebar data (useSidebarData hook)
- ✅ Clean separation of concerns achieved

**What's Left:**
- 🧹 **Code Cleanup**: Remove unused/redundant hooks (see Phase 3 below)
- 🔧 **Optional Enhancements**: Navigation extraction, error boundaries (low priority)

---

## 📋 Developer Stories - Phase 3: Code Cleanup

### Story 1: Remove Redundant Sidebar Hooks ⚠️ REQUIRED
**Priority:** HIGH  
**Estimated Effort:** 15 minutes  
**Status:** Not Started

**Context:**  
During the refactoring planning phase, several standalone hooks were created (`useSidebarVisibility`, `useSidebarSelection`, `useActiveItemTracking`, `useSidebarSearch`). However, when `SidebarContext` was implemented, it superseded all of these hooks by providing a single, centralized state management solution. These standalone hooks are now redundant and unused, adding unnecessary code to the codebase.

**Current State:**
- ✅ `SidebarContext` provides all sidebar state management functionality
- ✅ `AppLayout` uses `useSidebar()` hook from context (not the standalone hooks)
- ⚠️ Standalone hooks still exist in `/src/hooks/` but are NOT used anywhere in the app
- ⚠️ Hooks are still exported from `/src/hooks/index.ts`

**Acceptance Criteria:**
- [ ] Delete `/src/hooks/useSidebarVisibility.ts`
- [ ] Delete `/src/hooks/useSidebarSelection.ts`
- [ ] Delete `/src/hooks/useActiveItemTracking.ts`
- [ ] Delete `/src/hooks/useSidebarSearch.ts`
- [ ] Remove exports from `/src/hooks/index.ts`:
  - Remove `export * from './useSidebarVisibility';`
  - Remove `export * from './useSidebarSelection';`
  - Remove `export * from './useActiveItemTracking';`
  - Remove `export * from './useSidebarSearch';`
- [ ] Verify no imports of these hooks exist in the codebase (use grep/search)
- [ ] Run the app and verify all sidebar functionality still works

**Files to Modify:**
```
DELETE: src/hooks/useSidebarVisibility.ts
DELETE: src/hooks/useSidebarSelection.ts
DELETE: src/hooks/useActiveItemTracking.ts
DELETE: src/hooks/useSidebarSearch.ts
EDIT:   src/hooks/index.ts
```

**Why This Matters:**
- Reduces code maintenance burden
- Eliminates confusion about which approach to use
- Prevents future developers from accidentally using deprecated hooks
- Keeps the codebase clean and focused on the single source of truth (SidebarContext)

---

### Story 2 (Optional): Extract Navigation to Custom Hook
**Priority:** LOW (Optional)  
**Estimated Effort:** 45 minutes  
**Status:** Not Started

**Context:**  
Currently, navigation logic (`navigateTo` and `handleItemSelect`) is implemented inline in `AppLayout.tsx` (lines 68-102). While this works fine, extracting it to a custom hook would further reduce AppLayout's line count and improve testability.

**Current State:**
- ✅ Navigation logic works correctly
- ⚠️ Logic is inline in AppLayout (~35 lines)
- ℹ️ This is a "nice-to-have" improvement, not a necessity

**Acceptance Criteria:**
- [ ] Create `/src/hooks/useAppNavigation.ts`
- [ ] Move `navigateTo` function to the hook
- [ ] Move `handleItemSelect` function to the hook
- [ ] Hook should accept sidebar state from context as parameters
- [ ] Update `AppLayout.tsx` to use the new hook
- [ ] Verify all navigation works correctly (page navigation, sidebar closing logic)

**Files to Create/Modify:**
```
CREATE: src/hooks/useAppNavigation.ts
EDIT:   src/hooks/index.ts (add export)
EDIT:   src/layouts/AppLayout.tsx (use new hook)
```

**Benefits:**
- Further reduces AppLayout (could save ~25-30 lines)
- Improves testability of navigation logic
- Makes navigation logic reusable across components

**Note:** Only tackle this if you want to further optimize. Current state is production-ready.

---

### Story 3 (Optional): Add Error Boundaries
**Priority:** LOW (Optional)  
**Estimated Effort:** 30 minutes  
**Status:** Not Started

**Context:**  
Adding error boundaries around key components would improve resilience and provide better user experience when errors occur.

**Acceptance Criteria:**
- [ ] Create `/src/components/ErrorBoundary.tsx`
- [ ] Implement error boundary with fallback UI
- [ ] Wrap `NestedSidebar` with error boundary in AppLayout
- [ ] Add error logging/reporting
- [ ] Test error handling with intentional errors

**Files to Create/Modify:**
```
CREATE: src/components/ErrorBoundary.tsx
EDIT:   src/layouts/AppLayout.tsx (wrap NestedSidebar)
```

**Note:** This is a production quality improvement, not required for core functionality.

---

## 📊 Architecture Summary

### Current Architecture (After Phases 1 & 2)

```
┌─────────────────────────────────────────────────────────────┐
│                         AppShell                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              SidebarProvider (Context)                 │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │            AppLayout (185 lines)                 │  │  │
│  │  │                                                   │  │  │
│  │  │  State:  useSidebar() hook ← SidebarContext      │  │  │
│  │  │  Data:   useSidebarData() hook                   │  │  │
│  │  │  UI:     Header, LeftSidebar, NestedSidebar,     │  │  │
│  │  │          RightSidebar, MainContent               │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
SidebarContext (State Management)
    ↓
useSidebar() hook → provides to → AppLayout
    ↓
Visibility, Selection, Search state
    ↓
Passed to child components (LeftSidebar, NestedSidebar, etc.)


useSidebarData(type) (Data Loading)
    ↓
Loads data based on sidebar type
    ↓
Returns items, isLoading, error
    ↓
Passed to NestedSidebar for rendering
```

### Key Files

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `src/contexts/sidebar-context.tsx` | Centralized sidebar state management | 301 | ✅ Complete |
| `src/hooks/useSidebarData.ts` | Unified data loading for all sidebar types | 177 | ✅ Complete |
| `src/layouts/AppLayout.tsx` | Main layout composition | 185 | ✅ Complete |
| `src/lib/sidebar-utils.tsx` | Helper functions (title, icon, navigation) | ~150 | ✅ Complete |
| `src/app/AppShell.tsx` | App wrapper with provider | 32 | ✅ Complete |

---

## 🎯 Success Criteria (All Achieved!)

- [✅] AppLayout under 250 lines (Current: 185 lines - **66 lines under target!**)
- [✅] Single source of truth for sidebar state (SidebarContext)
- [✅] Single source of truth for data loading (useSidebarData hook)
- [✅] No console.log statements in AppLayout
- [✅] All sidebar functionality works (highlights, sparks, notes, categories, tags)
- [✅] Navigation works correctly
- [✅] Data loads correctly for all sidebar types
- [✅] No regressions in user experience
- [✅] Simplified useEffects (7 → 1)
- [✅] Removed all unnecessary refs and state

---

## 📚 Historical Context

### What Was Done

#### Phase 1: Context Integration (Completed)
1. ✅ Created `SidebarContext` at `/src/contexts/sidebar-context.tsx`
2. ✅ Wrapped app with `SidebarProvider` in `/src/app/AppShell.tsx`
3. ✅ Refactored `AppLayout` to use `useSidebar()` hook
4. ✅ Removed duplicate inline state (leftSidebarOpen, rightSidebarOpen, etc.)
5. ✅ Removed console.log statements
6. ✅ **Result**: 420 → 337 lines (83 lines removed, 19.8% reduction)

#### Phase 2: Data Loading Unification (Completed)
1. ✅ Created `/src/hooks/useSidebarData.ts` - unified hook for all data loading
2. ✅ Removed inline data loading from AppLayout (100+ lines)
3. ✅ Removed duplicate state variables (books, sparks, categories, tags, notes)
4. ✅ Removed servicesRef and related useEffects
5. ✅ Simplified from 7 useEffects to 1 useEffect
6. ✅ **Result**: 337 → 185 lines (152 lines removed, 45.1% reduction in this phase)

#### Total Progress
- **Start**: 420 lines with mixed concerns
- **End**: 185 lines focused on layout composition
- **Reduction**: 235 lines removed (56% reduction)
- **Architecture**: Clean separation of state (context) → data (hook) → UI (component)

### Original Problems (All Solved)

| Problem | Solution |
|---------|----------|
| State scattered across component | ✅ Centralized in SidebarContext |
| 7 useEffects managing data loading | ✅ Reduced to 1 useEffect, data loading in hook |
| Duplicate state variables | ✅ Single source of truth |
| Mixed concerns (state, data, UI) | ✅ Clear separation via context + hooks |
| 420+ lines of code | ✅ 185 lines focused on composition |
| Hard to maintain/test | ✅ Modular, testable architecture |

---

## 🔄 Next Steps

### Immediate Action Required
1. **Complete Story 1** (15 min): Remove redundant hooks - this is the only remaining cleanup task

### Optional Improvements (Low Priority)
2. Consider Story 2 if you want to further optimize navigation logic
3. Consider Story 3 if you want to add production resilience with error boundaries

### Current State
The application is **production-ready** after Phases 1 & 2. Phase 3 is purely cleanup and optional enhancements.

---

## 📖 References

### Related Documentation
- `.cursor/rules/components-styling.md` - Component structure guidelines
- `.cursor/rules/typescript-conventions.md` - TypeScript patterns
- `docs/development/HOOKS-USAGE.md` - Hook patterns in this project

### Key Patterns Used
1. **Context API**: Centralized state management for sidebar
2. **Custom Hooks**: Reusable logic for data loading
3. **Composition**: AppLayout focuses on layout, delegates to specialized components
4. **Single Source of Truth**: No duplicate state across components
5. **Separation of Concerns**: State → Data → UI as distinct layers

---

## ✨ Summary

**Before Refactoring:**
- 420 lines in AppLayout
- Mixed concerns (state + data + UI)
- 7 useEffects
- Duplicate state management
- Hard to maintain

**After Refactoring:**
- 185 lines in AppLayout (56% reduction)
- Clear separation (SidebarContext → useSidebarData → AppLayout → UI components)
- 1 useEffect
- Single source of truth for state and data
- Modular, testable, maintainable

**Status:** ✅ Phases 1 & 2 Complete - Target Exceeded  
**Next:** 🧹 Story 1 (Remove redundant hooks) - 15 minutes  
**Production Ready:** Yes
