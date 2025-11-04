# Watchlist Feature Specification

## 1. Overview

### Purpose
Add a watchlist feature that allows users to save their favorite movies and TV shows locally for easy access. Users can add/remove items from their watchlist and view all saved items in a dedicated page.

### Goals
- Provide a simple, intuitive way to bookmark movies and TV shows
- Persist watchlist data locally (no backend required)
- Integrate seamlessly with existing UI/UX patterns
- Support incremental, testable implementation
- Maintain performance and accessibility standards

---

## 2. Requirements

### 2.1 Functional Requirements

#### Core Features (MVP)
1. **Add to Watchlist**
   - Users can add movies/TV shows from MovieCard (catalog/home)
   - Users can add movies/TV shows from Detail page
   - Visual feedback when item is in watchlist (filled heart icon)
   - Prevent duplicates

2. **Remove from Watchlist**
   - Users can remove items from anywhere they appear
   - Toggle behavior: clicking again removes from watchlist
   - Confirmation via visual feedback

3. **View Watchlist**
   - Dedicated `/watchlist` page accessible from navigation
   - Display all saved movies and TV shows
   - Grid layout matching catalog page style
   - Show empty state when watchlist is empty

4. **Persist Data**
   - Save watchlist to browser localStorage
   - Load watchlist on app initialization
   - Survive page refreshes and browser restarts

#### Enhanced Features (Phase 4)
5. **Organization**
   - Tabs to filter by Movies vs TV Shows
   - Sort options: Date Added (default), Title (A-Z), Rating
   - Item count display ("12 items")

6. **User Feedback**
   - Toast notifications for add/remove actions
   - Smooth animations (respecting reduced motion preferences)
   - Hover states and tooltips

### 2.2 Non-Functional Requirements

1. **Performance**
   - Watchlist operations should be instant (< 50ms)
   - No impact on existing page load times
   - Efficient re-renders (use React.memo where appropriate)

2. **Accessibility**
   - Keyboard navigation support
   - Screen reader announcements for add/remove actions
   - ARIA labels for icon buttons
   - Respect `prefers-reduced-motion`

3. **Responsive Design**
   - Work seamlessly on mobile, tablet, and desktop
   - Touch-friendly button sizes (min 44x44px)
   - Consistent with existing breakpoints

4. **Data Integrity**
   - Handle localStorage quota limits gracefully
   - Validate data on load (handle corrupted data)
   - Provide fallback if localStorage unavailable

---

## 3. Design Approach

### 3.1 Architecture

**State Management: React Context API**

Follow the existing pattern used by `ThemeContext` and `GlobalContext`:

```
WatchlistProvider (Context API)
├── State: watchlistItems (IWatchlistItem[])
├── Actions: addToWatchlist(), removeFromWatchlist(), isInWatchlist()
└── Persistence: localStorage helpers
```

**Why Context API?**
- Consistent with existing codebase (no Redux store exists)
- Simple, lightweight solution for client-side state
- Easy to integrate into existing provider hierarchy
- No additional dependencies needed

### 3.2 Data Model

**Watchlist Item Structure:**
```typescript
interface IWatchlistItem {
  id: string;                    // TMDB ID
  category: "movie" | "tv";      // Type of content
  poster_path: string;           // For display
  title: string;                 // Normalized from original_title or name
  overview: string;              // Short description
  backdrop_path: string;         // Optional background
  addedAt: string;               // ISO timestamp (for sorting)
}
```

**Storage Format:**
```typescript
localStorage.setItem("watchlist", JSON.stringify(IWatchlistItem[]))
```

**Storage Key:** `"tmovies_watchlist"` (prefixed to avoid conflicts)

### 3.3 Data Flow

```
User Action (Click heart icon)
    ↓
Component calls context method
    ↓
Context updates state (add/remove)
    ↓
Context persists to localStorage
    ↓
All subscribers re-render with new state
    ↓
UI updates (icon state, watchlist page)
```

### 3.4 Integration Points

1. **Provider Hierarchy** (in `src/main.tsx`):
```tsx
<BrowserRouter>
  <ApiProvider api={tmdbApi}>
    <ThemeProvider>
      <WatchlistProvider>  {/* NEW */}
        <GlobalContextProvider>
          <LazyMotion>
            <App />
```

2. **MovieCard Component** (`src/common/MovieCard/index.tsx`):
   - Add watchlist button overlay (top-right corner)
   - Use context to check if item is in watchlist
   - Toggle on click

3. **Detail Page** (`src/pages/Detail/index.tsx`):
   - Add watchlist button in hero section (near title)
   - Larger, more prominent button
   - Include text label on desktop ("Add to Watchlist")

4. **Navigation** (`src/constants/index.ts`):
   - Add watchlist link to `navLinks` array
   - Icon: `BsBookmark` or `AiFillHeart`

5. **New Watchlist Page** (`src/pages/Watchlist/index.tsx`):
   - New route in `App.tsx`
   - Reuse catalog grid layout
   - Use existing MovieCard component

---

## 4. Recommended Tech Stack

### Existing Libraries (No New Dependencies)

1. **State Management:** React Context API
2. **Storage:** Browser localStorage
3. **Icons:** `react-icons`
   - Outline heart: `AiOutlineHeart`
   - Filled heart: `AiFillHeart`
   - Alternative: `BsBookmark` / `BsBookmarkFill`
4. **Styling:** Tailwind CSS (existing setup)
5. **Animations:** Framer Motion (existing)
6. **Routing:** React Router v6 (existing)
7. **TypeScript:** For type safety

### Optional Enhancements (Future)
- `react-hot-toast` - For toast notifications (lightweight, 3.8KB)
- Consider upgrading to `zustand` later if state becomes complex

---

## 5. Implementation Phases

### Phase 1: Core State Management ✅
**Goal:** Set up watchlist context and localStorage persistence

**Tasks:**
1. Create utility functions in `src/utils/watchlist.ts`:
   - `saveWatchlist(items: IWatchlistItem[]): void`
   - `getWatchlist(): IWatchlistItem[]`
   - `validateWatchlistData(data: any): boolean`

2. Create `src/context/watchlistContext.tsx`:
   - Define `IWatchlistItem` interface
   - Create WatchlistContext with state and methods
   - Implement provider with localStorage integration
   - Export `useWatchlist()` hook

3. Integrate provider in `src/main.tsx`

**Testing:**
- Test in browser console:
  ```javascript
  // In component with useWatchlist access
  const { addToWatchlist, watchlistItems } = useWatchlist();
  addToWatchlist({ id: "123", category: "movie", ... });
  console.log(watchlistItems); // Should show added item
  // Refresh page
  console.log(watchlistItems); // Should persist
  ```

**Deliverable:** Working context with localStorage persistence

---

### Phase 2: UI Components (Watchlist Buttons) ✅
**Goal:** Add watchlist buttons to MovieCard and Detail page

**Tasks:**
1. Create `src/common/WatchlistButton/index.tsx`:
   - Accept `movie` and `category` props
   - Use `useWatchlist()` hook
   - Render heart icon (outline/filled based on state)
   - Handle click to toggle
   - Apply hover/active animations

2. Integrate into `src/common/MovieCard/index.tsx`:
   - Position button in top-right corner (absolute positioning)
   - Glass morphism background
   - Small size (32x32px)

3. Integrate into `src/pages/Detail/index.tsx`:
   - Position in hero section near title
   - Larger button with text label on desktop
   - Icon-only on mobile

**Testing:**
- Click heart icon on any movie card → should fill
- Refresh page → heart should stay filled
- Click again → heart should empty
- Check localStorage in DevTools → should see updated data
- Test on mobile and desktop views

**Deliverable:** Functional watchlist toggle on all movie/show displays

---

### Phase 3: Watchlist Page ✅
**Goal:** Create dedicated page to view all watchlist items

**Tasks:**
1. Create `src/pages/Watchlist/index.tsx`:
   - Use `useWatchlist()` hook to get items
   - Render grid layout (reuse catalog styles)
   - Map items to `MovieCard` components
   - Show empty state when no items
   - Add page title and item count

2. Create empty state component `src/pages/Watchlist/components/EmptyState.tsx`:
   - Illustration or large heart icon
   - Message: "Your watchlist is empty"
   - CTA button: "Browse Movies"

3. Add route in `src/App.tsx`:
   ```tsx
   <Route path="/watchlist" element={<Watchlist />} />
   ```

4. Add navigation link in `src/constants/index.ts`:
   ```tsx
   { title: "watchlist", path: "/watchlist", icon: AiFillHeart }
   ```

**Testing:**
- Navigate to `/watchlist` → should show all saved items
- If empty → should show empty state
- Click on any movie card → should navigate to detail page
- Remove items from watchlist → should update page immediately
- Test responsive layout (mobile, tablet, desktop)

**Deliverable:** Fully functional watchlist page

---

### Phase 4: Polish & Enhancements ✅
**Goal:** Add filtering, sorting, and improved UX

**Tasks:**
1. Add tabs in Watchlist page:
   - "All", "Movies", "TV Shows"
   - Filter items based on selected tab
   - Style similar to existing UI patterns

2. Add sort dropdown:
   - "Date Added (Newest)", "Date Added (Oldest)", "Title (A-Z)", "Title (Z-A)"
   - Store preference in localStorage
   - Update grid when sorting changes

3. Add animations:
   - Fade in watchlist items on page load
   - Smooth removal animation
   - Use existing `useMotion` hook patterns

4. Add accessibility improvements:
   - ARIA labels: "Add to watchlist", "Remove from watchlist"
   - Keyboard shortcuts (optional): "w" to toggle watchlist
   - Screen reader announcements

5. Error handling:
   - Handle localStorage quota exceeded
   - Handle corrupted data gracefully
   - Show user-friendly error messages

**Testing:**
- Test all tab filters → should show correct items
- Test all sort options → should reorder correctly
- Test with 50+ items → should handle gracefully
- Test with localStorage disabled → should show error message
- Test with screen reader
- Test keyboard navigation

**Deliverable:** Production-ready watchlist feature

---

## 6. Testing Strategy

### Unit Testing (Optional but Recommended)
- Test watchlist utility functions (add, remove, validate)
- Test context methods
- Mock localStorage

### Manual Testing Checklist

**Phase 1:**
- [ ] Context initializes with empty array
- [ ] Can add item to watchlist
- [ ] Can remove item from watchlist
- [ ] Data persists after refresh
- [ ] Handles corrupted localStorage data

**Phase 2:**
- [ ] Button appears on MovieCard
- [ ] Button appears on Detail page
- [ ] Icon changes when toggled
- [ ] Hover state works correctly
- [ ] Works on mobile (touch)

**Phase 3:**
- [ ] Watchlist page accessible via navigation
- [ ] Shows all watchlist items
- [ ] Empty state displays when no items
- [ ] MovieCards link to detail pages
- [ ] Page updates when items removed

**Phase 4:**
- [ ] Tabs filter correctly
- [ ] Sort options work
- [ ] Animations smooth (60fps)
- [ ] Reduced motion respected
- [ ] Keyboard navigation works
- [ ] Screen reader accessible

### Browser Testing
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

### Edge Cases
- localStorage full (quota exceeded)
- localStorage disabled
- Corrupted data in localStorage
- Network offline (should still work)
- Very long movie titles
- Missing poster images
- 100+ items in watchlist

---

## 7. File Structure

### New Files to Create

```
src/
├── context/
│   └── watchlistContext.tsx           # Watchlist state management
├── utils/
│   └── watchlist.ts                   # localStorage helpers
├── common/
│   └── WatchlistButton/
│       ├── index.tsx                  # Reusable watchlist toggle button
│       └── README.md                  # Component documentation (optional)
├── pages/
│   └── Watchlist/
│       ├── index.tsx                  # Main watchlist page
│       ├── components/
│       │   ├── EmptyState.tsx        # Empty state component
│       │   ├── WatchlistTabs.tsx     # Filter tabs (Phase 4)
│       │   └── SortDropdown.tsx      # Sort options (Phase 4)
│       └── README.md                  # Page documentation (optional)
└── types.d.ts                         # Add IWatchlistItem interface
```

### Files to Modify

```
src/
├── main.tsx                           # Add WatchlistProvider
├── App.tsx                            # Add /watchlist route
├── constants/index.ts                 # Add watchlist nav link
├── common/
│   ├── MovieCard/index.tsx           # Add WatchlistButton
│   └── Header/index.tsx              # (Optional) Add watchlist icon badge
└── pages/
    └── Detail/index.tsx               # Add WatchlistButton to hero
```

---

## 8. Component Specifications

### 8.1 WatchlistButton Component

**Location:** `src/common/WatchlistButton/index.tsx`

**Props:**
```typescript
interface WatchlistButtonProps {
  movie: {
    id: string;
    category: "movie" | "tv";
    poster_path: string;
    original_title?: string;
    name?: string;
    overview: string;
    backdrop_path?: string;
  };
  size?: "sm" | "md" | "lg";           // Default: "md"
  showLabel?: boolean;                  // Show text label, default: false
  className?: string;                   // Additional Tailwind classes
}
```

**Behavior:**
- Check if movie is in watchlist using `isInWatchlist(id)`
- Render `AiOutlineHeart` if not in watchlist
- Render `AiFillHeart` if in watchlist
- On click: toggle watchlist state
- Apply scale animation on click (0.9 → 1)
- Use red color (`#ff0000`) for filled state

**Styling:**
- Small: 32x32px (for MovieCard overlay)
- Medium: 40x40px (default)
- Large: 48x48px with text label (for Detail page)
- Glass morphism background: `bg-black/40 backdrop-blur-sm`
- Rounded: `rounded-full`
- Hover: `-translate-y-[2px]`
- Active: `translate-y-[1px]`

---

### 8.2 Watchlist Page Component

**Location:** `src/pages/Watchlist/index.tsx`

**Structure:**
```tsx
<div className={maxWidth}>
  <header>
    <h1>My Watchlist</h1>
    <p>{count} items</p>
  </header>

  {/* Phase 4 */}
  <WatchlistTabs />
  <SortDropdown />

  {watchlistItems.length === 0 ? (
    <EmptyState />
  ) : (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))]">
      {watchlistItems.map(item => (
        <MovieCard key={item.id} movie={item} category={item.category} />
      ))}
    </div>
  )}
</div>
```

**Features:**
- Use existing `maxWidth` style from `src/styles/index.ts`
- Grid matches catalog page layout
- Show skeleton loaders during initial load (optional)
- Responsive: 2 cols mobile, 3-4 cols tablet, 5-6 cols desktop

---

### 8.3 EmptyState Component

**Location:** `src/pages/Watchlist/components/EmptyState.tsx`

**Structure:**
```tsx
<div className="flex flex-col items-center justify-center py-20">
  <AiFillHeart className="text-8xl text-gray-400 mb-4" />
  <h2 className="text-2xl font-bold mb-2">Your watchlist is empty</h2>
  <p className="text-gray-400 mb-6">
    Start adding movies and TV shows to your watchlist
  </p>
  <Link to="/movie" className={watchBtn}>
    Browse Movies
  </Link>
</div>
```

---

### 8.4 WatchlistContext

**Location:** `src/context/watchlistContext.tsx`

**Context Value:**
```typescript
interface IWatchlistContext {
  watchlistItems: IWatchlistItem[];
  addToWatchlist: (movie: Partial<IWatchlistItem>) => void;
  removeFromWatchlist: (id: string) => void;
  isInWatchlist: (id: string) => boolean;
  clearWatchlist: () => void;          // Optional: clear all
  getWatchlistCount: () => number;     // Optional: get count
}
```

**Implementation Notes:**
- Initialize state from localStorage on mount
- Save to localStorage on every state change
- Use `useMemo` for `isInWatchlist` lookups (performance)
- Normalize `title` field (prefer `original_title` over `name`)

---

## 9. User Flows

### 9.1 Adding to Watchlist

**From Catalog/Home Page:**
1. User hovers over MovieCard
2. Heart icon appears in top-right corner
3. User clicks heart icon
4. Icon fills with red color (animation: scale 0.9 → 1.2 → 1)
5. Item added to localStorage
6. (Optional) Toast notification: "Added to watchlist"

**From Detail Page:**
1. User views movie/show details
2. User sees "Add to Watchlist" button in hero section
3. User clicks button
4. Button text changes to "Remove from Watchlist"
5. Icon fills with red color
6. Item added to localStorage

### 9.2 Viewing Watchlist

1. User clicks "Watchlist" in navigation
2. App navigates to `/watchlist`
3. Page loads with all saved items in grid
4. User sees item count: "12 items"
5. User can browse, hover, click items
6. Clicking item navigates to detail page

### 9.3 Removing from Watchlist

**From Watchlist Page:**
1. User hovers over MovieCard
2. Heart icon shows (filled, red)
3. User clicks heart icon
4. (Optional) Animation: fade out and slide up
5. Item removed from grid
6. Item removed from localStorage
7. Count updates: "11 items"

**From Detail Page:**
1. User clicks "Remove from Watchlist" button
2. Button text changes to "Add to Watchlist"
3. Icon becomes outline (not filled)
4. Item removed from localStorage

### 9.4 Empty Watchlist

1. User clicks "Watchlist" in navigation
2. Page loads with empty state
3. User sees heart icon, message, and CTA button
4. User clicks "Browse Movies"
5. App navigates to `/movie`

---

## 10. Accessibility Considerations

### ARIA Labels
```tsx
<button
  aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
  aria-pressed={isInWatchlist}
>
  <AiFillHeart />
</button>
```

### Keyboard Navigation
- All buttons focusable with Tab
- Enter/Space to toggle
- Escape to close any modals (if added later)

### Screen Reader Announcements
```tsx
<div role="status" aria-live="polite" className="sr-only">
  {message} {/* "Added to watchlist" or "Removed from watchlist" */}
</div>
```

### Reduced Motion
```tsx
const { zoomIn, fadeUp } = useMotion(); // Automatically disabled if needed
```

### Color Contrast
- Ensure heart icon has sufficient contrast (WCAG AA)
- Use `text-red-500` or `text-[#ff0000]` with proper backgrounds

---

## 11. Performance Considerations

### Optimization Strategies

1. **Memoization:**
```tsx
const isInWatchlist = useMemo(
  () => (id: string) => watchlistItems.some(item => item.id === id),
  [watchlistItems]
);
```

2. **Debounced localStorage writes:**
```tsx
const debouncedSave = useMemo(
  () => debounce((items) => saveWatchlist(items), 300),
  []
);
```

3. **Lazy loading watchlist page:**
```tsx
const Watchlist = lazy(() => import("./pages/Watchlist"));
```

4. **React.memo on WatchlistButton:**
```tsx
export default memo(WatchlistButton, (prev, next) =>
  prev.movie.id === next.movie.id && prev.isInWatchlist === next.isInWatchlist
);
```

### localStorage Quota Management

```typescript
try {
  localStorage.setItem(key, value);
} catch (e) {
  if (e.name === "QuotaExceededError") {
    // Show user-friendly error
    console.error("Watchlist storage full. Please remove some items.");
  }
}
```

---

## 12. Future Enhancements (Out of Scope)

1. **Export/Import Watchlist**
   - Export as JSON file
   - Import from file
   - Share via URL (encoded in query params)

2. **Advanced Filtering**
   - Filter by genre
   - Filter by release year
   - Filter by rating

3. **Watchlist Statistics**
   - Total watch time
   - Most common genres
   - Completion percentage (if tracking watched status)

4. **Sync Across Devices**
   - Backend API integration
   - User authentication
   - Cloud storage

5. **Watchlist Notes**
   - Add personal notes to items
   - Rate movies (separate from TMDB rating)
   - Track watch status (want to watch, watching, watched)

6. **Collections**
   - Create custom lists ("Date Night Movies", "Sci-Fi Favorites")
   - Multiple watchlists

---

## 13. Success Metrics

### Definition of Done
- [x] Users can add/remove movies and TV shows to watchlist
- [x] Watchlist persists across browser sessions
- [x] Watchlist page displays all saved items
- [x] Empty state shown when watchlist is empty
- [x] Responsive design works on all devices
- [x] No console errors or warnings
- [x] Respects accessibility guidelines (WCAG AA)
- [x] Works offline (no network required)

### Quality Checklist
- [x] TypeScript types defined for all data structures
- [x] Components follow existing code style
- [x] No prop drilling (use Context)
- [x] Tailwind classes follow existing patterns
- [x] Animations respect reduced motion preferences
- [x] Error handling for edge cases
- [x] Code is self-documenting with clear naming

---

## 14. Getting Started (Implementation Order)

### Recommended Implementation Sequence:

1. **Start with Phase 1** (Foundation)
   - Creates the data layer and persistence
   - Can be tested independently in console
   - No UI changes yet (safe to test)

2. **Move to Phase 2** (UI Integration)
   - Add buttons incrementally (MovieCard first, then Detail)
   - Test each integration point before moving forward
   - Visual feedback helps verify Phase 1 works

3. **Build Phase 3** (Watchlist Page)
   - Brings everything together
   - Proves the feature works end-to-end
   - Core feature is complete

4. **Polish with Phase 4** (Enhancements)
   - Optional but recommended
   - Can be done incrementally (tabs first, then sorting, etc.)
   - Improves UX significantly

### Estimated Time per Phase:
- Phase 1: 1-2 hours
- Phase 2: 2-3 hours
- Phase 3: 2-3 hours
- Phase 4: 3-4 hours

**Total: 8-12 hours** for full implementation

---

## 15. Questions & Decisions

### Open Questions (To be decided during implementation):

1. **Icon Choice:**
   - Option A: Heart icons (`AiOutlineHeart` / `AiFillHeart`) - More emotional
   - Option B: Bookmark icons (`BsBookmark` / `BsBookmarkFill`) - More functional
   - **Recommendation:** Heart icons (aligns with common watchlist UX)

2. **Watchlist Location in Navigation:**
   - Option A: Main navigation (alongside Movies, TV Series)
   - Option B: User menu in header (if adding later)
   - **Recommendation:** Main navigation (Phase 3), no user accounts needed

3. **Empty State CTA:**
   - Option A: Link to "/movie" (Movies catalog)
   - Option B: Link to "/" (Home page)
   - **Recommendation:** Link to home page (more discoverable)

4. **Separate Movies/TV or Combined?**
   - Option A: Single watchlist with all items
   - Option B: Separate watchlists (localStorage keys: "watchlist_movies", "watchlist_tv")
   - **Recommendation:** Single combined watchlist with filter tabs (Phase 4)

5. **Button Placement on Detail Page:**
   - Option A: Near title in hero section
   - Option B: Floating action button (bottom-right)
   - Option C: Both locations
   - **Recommendation:** Near title (hero section) - more discoverable

---

## Appendix A: Code Snippets

### A.1 WatchlistContext Skeleton

```typescript
// src/context/watchlistContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getWatchlist, saveWatchlist } from "@/utils/watchlist";

interface IWatchlistItem {
  id: string;
  category: "movie" | "tv";
  poster_path: string;
  title: string;
  overview: string;
  backdrop_path: string;
  addedAt: string;
}

interface IWatchlistContext {
  watchlistItems: IWatchlistItem[];
  addToWatchlist: (movie: any) => void;
  removeFromWatchlist: (id: string) => void;
  isInWatchlist: (id: string) => boolean;
}

const WatchlistContext = createContext<IWatchlistContext | undefined>(undefined);

export const WatchlistProvider = ({ children }: { children: ReactNode }) => {
  const [watchlistItems, setWatchlistItems] = useState<IWatchlistItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = getWatchlist();
    setWatchlistItems(saved);
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    saveWatchlist(watchlistItems);
  }, [watchlistItems]);

  const addToWatchlist = (movie: any) => {
    // Implementation
  };

  const removeFromWatchlist = (id: string) => {
    // Implementation
  };

  const isInWatchlist = (id: string) => {
    // Implementation
  };

  return (
    <WatchlistContext.Provider value={{ watchlistItems, addToWatchlist, removeFromWatchlist, isInWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) throw new Error("useWatchlist must be used within WatchlistProvider");
  return context;
};
```

### A.2 localStorage Helpers Skeleton

```typescript
// src/utils/watchlist.ts
import { IWatchlistItem } from "@/context/watchlistContext";

const STORAGE_KEY = "tmovies_watchlist";

export const saveWatchlist = (items: IWatchlistItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save watchlist:", error);
  }
};

export const getWatchlist = (): IWatchlistItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return validateWatchlistData(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load watchlist:", error);
    return [];
  }
};

export const validateWatchlistData = (data: any): boolean => {
  // Basic validation
  if (!Array.isArray(data)) return false;
  return data.every(item =>
    item.id &&
    item.category &&
    (item.category === "movie" || item.category === "tv")
  );
};
```

---

## Appendix B: Style Reference

### B.1 Existing Style Constants (from `src/styles/index.ts`)

```typescript
// Use these in watchlist components for consistency
export const maxWidth = "max-w-[1140px] mx-auto md:px-8 sm:px-6 px-4 xl:px-0";
export const watchBtn = "sm:text-base xs:text-[14.75px] text-[13.75px] xs:py-2 py-[6px] px-6 sm:font-semibold font-medium rounded-full bg-[#ff0000] hover:-translate-y-[2px] active:translate-y-[1px] hover:shadow-md active:shadow-none transition duration-300";
export const mainHeading = "sm:text-4xl xs:text-3xl text-[28.75px] font-extrabold";
```

### B.2 Color Palette

```css
Primary Red: #ff0000
Background Dark: #191624
Secondary: #ff8c00 (if needed)
Text Primary: #ffffff
Text Secondary: #9ca3af (gray-400)
```

---

## Appendix C: TypeScript Type Additions

Add to `src/types.d.ts`:

```typescript
export interface IWatchlistItem {
  id: string;
  category: "movie" | "tv";
  poster_path: string;
  title: string;
  overview: string;
  backdrop_path: string;
  addedAt: string;
}

export type WatchlistButtonSize = "sm" | "md" | "lg";

export type SortOption = "date_added_desc" | "date_added_asc" | "title_asc" | "title_desc";

export type WatchlistFilter = "all" | "movies" | "tv";
```

---

## End of Specification

**Version:** 1.0
**Last Updated:** 2025-11-03
**Status:** Ready for Implementation

For questions or clarifications during implementation, refer back to this spec or update it as decisions are made.
