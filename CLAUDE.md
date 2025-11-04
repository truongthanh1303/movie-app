# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start Vite dev server (default: http://localhost:5173)
npm run build        # TypeScript type-check + production build
npm run preview      # Preview production build locally
```

## Environment Setup

Required environment variables in `.env`:
```bash
VITE_API_KEY=<your-tmdb-api-key>                      # TMDB API key (required)
VITE_TMDB_API_BASE_URL=https://api.themoviedb.org/3  # TMDB API base URL
VITE_GA_MEASUREMENT_ID=<your-ga-id>                   # Google Analytics (optional)
VITE_GOOGLE_AD_CLIENT=<your-ad-client>                # Google AdSense (optional)
VITE_GOOGLE_AD_SLOT=<your-ad-slot>                    # Google AdSense (optional)
```

Get TMDB API key at: https://www.themoviedb.org/settings/api

## Architecture Overview

### Tech Stack
- **Build**: Vite + TypeScript
- **Framework**: React 18 with React Router v6
- **Styling**: Tailwind CSS with dark mode support
- **State Management**: RTK Query (API data) + React Context (UI state)
- **Animations**: Framer Motion with accessibility support

### State Management Philosophy

**No Redux store exists** - only RTK Query's ApiProvider. Use the following pattern:

1. **RTK Query** for server/API state:
   - Located in `src/services/TMDB.ts`
   - Two endpoints: `getShows` (lists) and `getShow` (details)
   - Exported hooks: `useGetShowsQuery`, `useGetShowQuery`

2. **React Context** for global UI state:
   - `GlobalContext` (`src/context/globalContext.tsx`): Video modal, sidebar visibility
   - `ThemeContext` (`src/context/themeContext.tsx`): Dark/light mode, persisted to localStorage
   - Hook pattern: `useGlobalContext()`, `useTheme()`

3. **Local State** for component-specific state

### Provider Hierarchy

The provider nesting order in `src/main.tsx` is critical:

```tsx
<BrowserRouter>
  <ApiProvider api={tmdbApi}>           {/* RTK Query API provider */}
    <ThemeProvider>                     {/* Theme state */}
      <GlobalContextProvider>           {/* Modal/sidebar state */}
        <LazyMotion features={domAnimation}>  {/* Framer Motion optimization */}
          <App />
```

When adding new context providers, insert them between `ThemeProvider` and `GlobalContextProvider`.

### Routing Structure

Routes defined in `src/App.tsx`:
```
/                   → Home page (hero + content sections)
/:category          → Catalog page (movie or tv)
/:category/:id      → Detail page (movie/123 or tv/456)
*                   → 404 NotFound page
```

All pages are lazy-loaded with `React.lazy()` and wrapped in `<Suspense>`.

### TMDB API Integration

**API Service** (`src/services/TMDB.ts`):

```typescript
// Fetching lists (browse, search, similar)
useGetShowsQuery({
  category: "movie" | "tv",
  type: "popular" | "top_rated",
  page: number,
  searchQuery: string,        // optional, triggers search
  showSimilarShows: boolean,  // optional, fetches similar content
  id: number                  // required if showSimilarShows=true
})

// Fetching single movie/show with videos and credits
useGetShowQuery({
  category: "movie" | "tv",
  id: number
})
```

**Response includes**: `videos.results[]` (trailers) and `credits.cast[]` (actors)

### Animation System

**Custom Hook**: `useMotion()` (`src/hooks/useMotion.ts`)

Animations are **automatically disabled** when:
- Screen width < 768px (mobile devices)
- User has `prefers-reduced-motion` enabled

Always use this hook instead of hardcoding Framer Motion variants:

```typescript
const { fadeDown, fadeUp, zoomIn, staggerContainer, slideIn } = useMotion();

// Returns undefined when motion is disabled
<motion.div variants={fadeDown} initial="hidden" animate="show">
```

### Styling Patterns

**Path Alias**: `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`)

**Tailwind Configuration** (`tailwind.config.cjs`):
- Dark mode: `class` strategy (toggle via `<html class="dark">`)
- Custom breakpoint: `xs: 380px`
- Brand color: Red (`#ff0000`) for primary actions
- Background: `black: #191624` for dark theme
- Custom shadows: `shadow-glow`, `shadow-glowLight` (red glow effects)

**Style Constants** (`src/styles/index.ts`):
```typescript
import { maxWidth, watchBtn, mainHeading } from "@/styles";
```

Reuse these constants for consistency across components.

**Utility Function** (`src/utils/helper.ts`):
```typescript
import { cn } from "@/utils/helper";

// Merges Tailwind classes correctly (uses clsx + tailwind-merge)
<div className={cn("base-class", conditionalClass && "added-class")} />
```

### Component Organization

```
src/
├── pages/              # Route-based page components (lazy-loaded)
│   ├── Home/
│   ├── Catalog/
│   ├── Detail/
│   └── NotFound/
├── common/             # Reusable components (Header, Footer, MovieCard, etc.)
├── services/           # RTK Query API definitions
├── context/            # React Context providers
├── hooks/              # Custom React hooks (useMotion, etc.)
├── utils/              # Helper functions and config
├── constants/          # Static data (nav links, etc.)
└── types.d.ts          # Global TypeScript interfaces
```

**Component Index Pattern**: Each folder exports via `index.ts` for clean imports:
```typescript
// In src/common/index.ts
export { default as Header } from "./Header";
export { default as MovieCard } from "./MovieCard";

// Usage
import { Header, MovieCard } from "@/common";
```

### TypeScript Types

**Global Interfaces** (`src/types.d.ts`):
```typescript
interface IMovie {
  id: string;
  poster_path: string;
  original_title: string;  // For movies
  name: string;            // For TV shows
  overview: string;
  backdrop_path: string;
}
```

**Normalized Title**: Use `movie.original_title || movie.name` since TMDB uses different fields for movies vs TV shows.

### Performance Patterns

1. **Lazy Loading Sections**: Use Intersection Observer to defer API calls:
```typescript
const ref = useRef(null);
const inView = useInView(ref, { margin: "420px", once: true });

const { data } = useGetShowsQuery({ ... }, { skip: !inView });
```

2. **Code Splitting**: All routes use `React.lazy()`

3. **Image Optimization**:
   - Custom `<Image>` component wraps `react-lazy-load-image-component`
   - Blur effect during load
   - TMDB image base URL: `https://image.tmdb.org/t/p/[size]/[path]`
   - Common sizes: `w500` (posters), `original` (backdrops)

4. **Throttling**: Scroll/resize events use 150ms throttle (`THROTTLE_DELAY` in `src/utils/config.ts`)

### localStorage Usage

**Pattern** (see `src/utils/helper.ts`):
```typescript
// Getter/setter functions, not direct localStorage access
export const saveTheme = (theme: string) => localStorage.setItem("theme", theme);
export const getTheme = () => localStorage.getItem("theme") || "";
```

When adding new localStorage features:
1. Create helper functions in `src/utils/` (avoid direct access)
2. Validate data on load (handle corrupted data gracefully)
3. Use prefixed keys to avoid conflicts (e.g., `"tmovies_watchlist"`)

### Context Creation Pattern

When creating new context providers, follow this structure:

```typescript
// 1. Create context with default values
const MyContext = createContext<IMyContext | undefined>(undefined);

// 2. Provider component with state
export const MyProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState(initialState);

  // Load from localStorage on mount (if needed)
  useEffect(() => {
    const saved = localStorage.getItem("key");
    if (saved) setState(JSON.parse(saved));
  }, []);

  // Save to localStorage on change (if needed)
  useEffect(() => {
    localStorage.setItem("key", JSON.stringify(state));
  }, [state]);

  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
};

// 3. Custom hook for consuming context
export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error("useMyContext must be used within MyProvider");
  }
  return context;
};
```

### Navigation Links

Managed in `src/constants/index.ts`:
```typescript
export const navLinks: INavLink[] = [
  { title: "home", path: "/", icon: AiOutlineHome },
  { title: "movies", path: "/movie", icon: TbMovie },
  { title: "tv series", path: "/tv", icon: MdOutlineLiveTv }
];
```

When adding new routes:
1. Add to `navLinks` array
2. Add route in `src/App.tsx`
3. Create page component in `src/pages/`

### Error Handling

**API Errors**: RTK Query provides `error` and `isError` in query hooks:
```typescript
const { data, error, isError, isLoading } = useGetShowsQuery({ ... });

if (isError) return <Error error={error} />;
```

**Video Modal**: GlobalContext provides `getTrailerId()` which fetches YouTube video ID. Has try/catch with console.error fallback.

### Accessibility Requirements

1. **Reduced Motion**: Always use `useMotion()` hook - never hardcode animations
2. **Keyboard Navigation**: Ensure all interactive elements are focusable
3. **ARIA Labels**: Add to icon-only buttons
4. **Semantic HTML**: Use proper heading hierarchy and landmark elements

### Common Pitfalls

1. **Don't create a Redux store** - only RTK Query's ApiProvider exists. Use Context API for global state.

2. **Category parameter**: Always `"movie"` or `"tv"`, never pluralized. TMDB API expects singular form.

3. **Title field**: Movies use `original_title`, TV shows use `name`. Always handle both:
   ```typescript
   const title = movie.original_title || movie.name;
   ```

4. **Modal autoplay conflict**: When VideoModal opens, the hero carousel must pause. This is managed via GlobalContext's `isModalOpen` state.

5. **Image paths**: TMDB returns relative paths. Construct full URL:
   ```typescript
   `https://image.tmdb.org/t/p/w500${movie.poster_path}`
   ```

6. **Theme toggle**: Theme is applied by adding/removing `dark` class on `<html>` element, not on individual components.

## File Naming Conventions

- **Components**: PascalCase folders with `index.tsx` (e.g., `MovieCard/index.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useMotion.ts`)
- **Utils**: camelCase (e.g., `helper.ts`, `config.ts`)
- **Context**: camelCase with `Context` suffix (e.g., `globalContext.tsx`)
- **Types**: `types.d.ts` (no need to import, globally available)

## Code Style

- **Imports**: Absolute imports using `@/` alias
- **Export pattern**: Named exports for utilities, default exports for components
- **TypeScript**: Strict mode enabled - always type props and state
- **Formatting**: No ESLint autofix on save (vite-plugin-eslint shows warnings only)

## Development Best Practices

### Testing Strategy

**Manual Testing Approach**:
This project uses manual testing. When implementing new features:

1. **Test incrementally** - Test each phase before moving to the next:
   ```bash
   # After implementing state management
   # Test in browser console before building UI

   # After adding UI components
   # Verify visual changes and interactions

   # After integrating features
   # Test full user flows across devices
   ```

2. **Browser testing matrix**:
   - Chrome/Edge (latest)
   - Firefox (latest)
   - Safari (latest)
   - Mobile Safari (iOS)
   - Chrome Mobile (Android)

3. **Test responsive behavior** at breakpoints:
   - Mobile: < 380px and 380px - 640px
   - Tablet: 640px - 1024px
   - Desktop: > 1024px

4. **Test accessibility**:
   - Keyboard navigation (Tab, Enter, Escape)
   - Screen reader compatibility (VoiceOver, NVDA)
   - Reduced motion preference (System Settings)
   - Color contrast (use browser DevTools)

5. **Test edge cases**:
   - Empty states (no data, no results)
   - Loading states (slow network)
   - Error states (API failures, network offline)
   - Large datasets (100+ items)
   - Long text content (overflow handling)
   - Missing/broken images

6. **localStorage testing**:
   - Data persistence after refresh
   - Behavior when localStorage is disabled
   - Behavior when localStorage is full (quota exceeded)
   - Corrupted data handling

### Commit Message Guidelines

Follow conventional commit format for clarity:

```bash
# Format: <type>: <description>

# Types:
feat: Add new feature
fix: Bug fix
refactor: Code refactoring (no behavior change)
style: Code style changes (formatting, semicolons)
perf: Performance improvements
chore: Maintenance tasks (dependencies, configs)
docs: Documentation updates

# Examples:
feat: add watchlist feature with localStorage persistence
fix: prevent duplicate items in watchlist
refactor: extract watchlist button into reusable component
perf: optimize watchlist state updates with useMemo
chore: update dependencies to latest versions
docs: add watchlist feature documentation

# For features with multiple steps:
feat(watchlist): create context and localStorage helpers
feat(watchlist): add toggle buttons to MovieCard and Detail page
feat(watchlist): implement watchlist page with grid layout
feat(watchlist): add filtering and sorting options
```

**Commit best practices**:
- Keep commits focused on a single logical change
- Include the "why" in commit body for complex changes
- Reference issue numbers when applicable: `fix: resolve carousel autoplay issue (#123)`
- Use present tense: "add feature" not "added feature"
- Keep first line under 72 characters

### Following Existing Patterns

Before implementing new features, review similar existing code:

**For new components**:
1. Check existing components in `src/common/` for patterns
2. Follow the index export pattern
3. Use existing style constants from `src/styles/`
4. Match naming conventions (PascalCase folders)

**For new context**:
1. Review `src/context/themeContext.tsx` as template
2. Follow the context creation pattern (see "Context Creation Pattern" section)
3. Export custom hook (`useMyContext`)
4. Add to provider hierarchy in correct order

**For new API endpoints**:
1. Extend `tmdbApi` in `src/services/TMDB.ts`
2. Follow existing query parameter patterns
3. Export hooks using RTK Query convention: `useGetXQuery`

**For new pages**:
1. Create in `src/pages/` with PascalCase folder
2. Use lazy loading in `src/App.tsx`
3. Add to routing structure
4. Follow layout patterns from existing pages

**For new utilities**:
1. Add to appropriate file in `src/utils/`
2. Export as named export
3. Add TypeScript types
4. Follow existing function naming (camelCase)

### Maintaining Code Quality

**Before committing**:

1. **Type check**:
   ```bash
   npm run build  # Runs tsc + builds
   ```
   Fix all TypeScript errors. Do not use `@ts-ignore` or `any` types without strong justification.

2. **Check for console errors**:
   - Open browser DevTools console
   - Navigate through the app
   - Ensure no errors or warnings
   - Remove debug `console.log()` statements

3. **Verify no regressions**:
   - Test existing features still work
   - Check that changes don't break other pages
   - Verify responsive design isn't broken
   - Test dark/light theme compatibility

4. **Review code for**:
   - Unused imports (remove them)
   - Hardcoded values that should be constants
   - Duplicated code that should be extracted
   - Missing error handling
   - Accessibility concerns (ARIA labels, keyboard nav)

5. **Performance checks**:
   - No unnecessary re-renders (use React DevTools Profiler)
   - Proper use of `useMemo`, `useCallback` for expensive operations
   - Images are lazy-loaded
   - API calls are not in render loops

**Code review checklist**:

- [ ] TypeScript compiles without errors
- [ ] No console errors or warnings
- [ ] Follows existing file structure and naming conventions
- [ ] Uses absolute imports with `@/` alias
- [ ] Reuses existing style constants and utilities
- [ ] Handles loading and error states
- [ ] Responsive on mobile, tablet, desktop
- [ ] Works in dark and light themes
- [ ] Respects reduced motion preferences
- [ ] Keyboard accessible
- [ ] Meaningful commit message(s)
- [ ] No sensitive data (API keys, tokens) in code

### Incremental Development

**Build features in phases**:

1. **Phase 1 - Foundation**: State management and data layer
   - Test in browser console
   - Verify localStorage persistence
   - No UI changes yet

2. **Phase 2 - UI Components**: Visual elements
   - Test component in isolation
   - Verify responsive behavior
   - Check accessibility

3. **Phase 3 - Integration**: Connect components to data
   - Test full user flows
   - Verify cross-component interactions
   - Test edge cases

4. **Phase 4 - Polish**: Animations, optimizations
   - Add Framer Motion animations
   - Optimize performance
   - Final accessibility audit

**Benefits**:
- Easier debugging (smaller changes)
- Can test incrementally
- Can stop at any phase if needed
- Reduces risk of breaking changes

### When to Refactor

Refactor when you notice:

1. **Code duplication** - Extract to shared utility or component
2. **Large components** - Split into smaller, focused components
3. **Complex state logic** - Consider custom hook or context
4. **Hardcoded values** - Move to constants file
5. **Unclear naming** - Rename for clarity
6. **Missing types** - Add proper TypeScript interfaces

**Refactoring guidelines**:
- Refactor in separate commit from feature work
- Test thoroughly after refactoring
- Don't change behavior, only structure
- Update related documentation

### Performance Monitoring

**During development**:

1. **React DevTools Profiler**:
   - Identify unnecessary re-renders
   - Find expensive components
   - Optimize rendering performance

2. **Network tab**:
   - Check API call frequency
   - Verify image lazy-loading works
   - Monitor bundle sizes

3. **Lighthouse audit**:
   ```bash
   npm run build
   npm run preview
   # Run Lighthouse in Chrome DevTools
   ```
   - Aim for 90+ Performance score
   - Address accessibility issues
   - Check best practices

### Git Workflow

**Branch naming** (if using branches):
```bash
feature/watchlist-implementation
fix/carousel-autoplay-bug
refactor/extract-watchlist-helpers
chore/update-dependencies
```

**Typical workflow**:
```bash
# 1. Create feature branch (optional)
git checkout -b feature/new-feature

# 2. Make changes incrementally
git add src/context/newContext.tsx
git commit -m "feat: create new context with localStorage"

git add src/common/NewComponent/
git commit -m "feat: add new component with tests"

# 3. Before final commit
npm run build  # Type check
# Test manually in browser

# 4. Push changes
git push origin feature/new-feature
```

**When to commit**:
- After completing each logical unit of work
- After each phase of incremental development
- Before switching tasks or taking breaks
- When tests pass and code compiles

### Documentation

**When to update documentation**:

1. **New features**: Update README.md with usage instructions
2. **New patterns**: Add to CLAUDE.md if it's architectural
3. **Complex components**: Consider adding inline JSDoc comments
4. **API changes**: Update relevant documentation
5. **Breaking changes**: Clearly document migration steps

**Documentation style**:
```typescript
/**
 * Custom hook for managing watchlist state
 *
 * @returns {Object} Watchlist state and methods
 * @example
 * const { watchlistItems, addToWatchlist } = useWatchlist();
 * addToWatchlist({ id: "123", category: "movie", ... });
 */
export const useWatchlist = () => {
  // Implementation
};
```
