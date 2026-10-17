# MySpace — Your Personal Internet

A personal operating system and command center for the modern internet. MySpace empowers developers, students, researchers, and creators to save, categorize, discover, and launch resources—websites, GitHub repositories, AI tools, documentation, tutorials, APIs, and media—with real-time Cloud Firestore persistence, instant universal search, Android Web Share Target PWA capabilities, and browser bookmark migration.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed during Phase 1 clarification:
> - **Workspace Starter Templates**: Pre-configured with **Personal Study**, **Bookmarks**, and **Media** command centers.
> - **Authentication Gateway**: Enforce user registration/sign-in immediately with Firebase Authentication (Email/Password & Google Sign-In) to ensure strict data ownership and cross-device sync.
> - **Bookmark Migration Strategy**: Automatically translate browser HTML bookmark folder trees into visual Collections and tags with duplicate URL detection.
> - **Firebase Provisioning**: AI Studio Fax RPC `ProvisionFirebase` will provision the backend upon plan approval, followed by hardened Firestore security rules.

---

## 1. Overview & Core Concept

- **What It Does**: MySpace replaces fragmented browser tabs and lost bookmarks with a high-performance personal internet dashboard. Users can capture links with automatic metadata enrichment (favicons, OpenGraph titles, GitHub repository stats), organize them into visual Collections and project-tailored Workspaces, trigger keyboard-driven universal search (Cmd+K / Ctrl+K), and share links directly from Android via Web Share Target.
- **Target Audience / Persona**: Engineers, researchers, students, and digital power users managing hundreds of active references, tools, documentation hubs, and learning materials across desktop and mobile.
- **Key Value**: Instant link capture, zero-friction retrieval, project-focused workspaces, and permanent cross-device sync powered by Firebase.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Authentication & Onboarding**: Clean, focused auth gateway (Email/Password registration, sign-in, password reset, and Google popup). Upon initial sign-up, the user's account is bootstrapped with the 3 confirmed workspace environments: *Personal Study*, *Bookmarks*, and *Media*.
2. **Dashboard Command Center**:
   - Left sidebar with logo, quick navigation (Home, All Resources, Collections, Workspaces, Favorites, Recently Opened, Archive, Settings), and PWA install trigger.
   - Top action bar featuring universal search trigger (`Cmd+K`), quick stats (Total Resources, Active Workspaces, Starred Links), and prominent "+ Add Resource" button.
   - Pinned quick-access links strip for one-click launching.
   - Visual Collections grid with custom icons and accent palettes.
   - Dual-view resource stream (Grid and Table view) with live type filter (AI Tools, GitHub Repos, Docs, APIs, Videos, Articles, Courses).
3. **Frictionless Link Capture & GitHub Enrichment**:
   - Paste URL in the Add Resource modal or quick-bar.
   - Automatic metadata scraper fetches title, OpenGraph description, and favicon.
   - When a `github.com/owner/repo` URL is detected, the app automatically queries the public GitHub API to fetch stars, primary language, repo description, and open issues.
   - Real-time duplicate check detects existing URLs and offers to navigate to the saved resource or update its tags.
4. **Android Share Target Experience**:
   - PWA configured with `share_target` in `manifest.json`.
   - When receiving shared text or URLs from mobile apps, opens a dedicated `/share-target` quick-save dialog prefilled with the shared link and auto-fetched metadata.
5. **Universal Command Palette (`Cmd+K` / `Ctrl+K`)**:
   - High-speed fuzzy search across resource titles, domains, tags, notes, and collections.
   - Quick action shortcuts: "New Resource", "Create Collection", "Switch to Workspace", "Export JSON/CSV", "Import Bookmarks".
6. **Data Portability**:
   - Browser HTML bookmark file import (Netscape bookmark format) with folder hierarchy preservation.
   - Export full personal internet library to JSON or CSV.

### Visual Identity & Theme
- **Aesthetic Direction**: Editorial, productivity-focused dark operating system with refined surfaces, electric violet (`#8B5CF6`) and indigo (`#6366F1`) energetic accents, paired with deep charcoal canvases.
- **Color Palette & Distribution**:
  - `60% Neutral Canvas`: `#0B0D13` (deep void charcoal) and `#12151E` (structural card surface).
  - `30% Secondary Structure`: `#1E2230` (hairline borders, subtle divider lines, secondary surfaces) and `#94A3B8` (crisp body typography).
  - `10% Accent Intent`: Electric violet (`#8B5CF6`), bright indigo (`#6366F1`), and cyan (`#06B6D4`) reserved strictly for primary actions, active tabs, and focus rings.
- **Typography & Scale**:
  - Display & Wordmark: `Plus Jakarta Sans` (weights 600, 700, 800) for sharp editorial presence and commanding headers.
  - Body & UI: `Plus Jakarta Sans` / system-ui (weights 400, 500) for high legibility.
  - Data & Metrics: Monospace tabular numerals (`font-mono tabular-nums`) for counters, star counts, and timestamps.
  - **Zero-Pill Discipline**: Metadata (domains, types, dates) displayed as clean unboxed text separated by `·` or `/`. No pill-badge sandwiches on cards.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct Server-Side & Client Hybrid URL Scraper**
  - *Chosen Approach*: Express backend endpoint (`/api/scrape-metadata`) that safely requests public HTML and extracts OpenGraph/Twitter meta tags, complemented by a client-side URL parser for GitHub API extraction and favicon fallback generators (`https://www.google.com/s2/favicons`).
  - *Why*: Eliminates CORS restrictions while providing instant fallbacks if an external website blocks scraping or times out.
- **Decision 2: Strict Normalized Firestore Architecture with Client Caching**
  - *Chosen Approach*: Separate top-level collections for `resources`, `collections`, `workspaces`, and `users`, each strictly bounded by `ownerId == request.auth.uid`.
  - *Why*: Prevents unbounded array limitations, guarantees sub-100ms query performance, and allows fine-grained real-time subscriptions via `onSnapshot`.
- **Decision 3: Android PWA Web Share Target with Session Recovery**
  - *Chosen Approach*: Manifest `share_target` configured for GET/POST capture. If an unauthenticated user opens a shared link, the pending payload is preserved in `sessionStorage` and restored immediately after sign-in.
  - *Why*: Guarantees zero link loss during mobile capture.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MySpace Frontend (React 19)                    │
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────┐  │
│  │     Navigation        │  │     Command Palette (Cmd+K)           │  │
│  │  - Brand & Workspaces │  │  - Universal Fuzzy Search             │  │
│  │  - Collections Tree   │  │  - Rapid Action Triggers              │  │
│  └───────────┬───────────┘  └───────────────────┬───────────────────┘  │
│              │                                  │                      │
│  ┌───────────▼──────────────────────────────────▼───────────────────┐  │
│  │                     Dashboard View Router                        │  │
│  │   Home  │  All Resources  │  Collections  │  Workspaces  │ PWA   │  │
│  └───────────┬──────────────────────────────────┬───────────────────┘  │
│              │                                  │                      │
│  ┌───────────▼───────────┐         ┌────────────▼──────────────────┐   │
│  │   Resource Card Grid  │         │   Add Resource / Share Modal  │   │
│  │   & Dense Table View  │         │   - URL Auto-Enrichment       │   │
│  │   - Favicons & Tags   │         │   - GitHub API Repository     │   │
│  │   - Pinned Actions    │         │   - Duplicate URL Detector    │   │
│  └───────────┬───────────┘         └────────────┬──────────────────┘   │
└──────────────┼──────────────────────────────────┼──────────────────────┘
               │                                  │
               ▼                                  ▼
┌──────────────────────────────┐    ┌──────────────────────────────────┐
│ Firebase Authentication &    │    │ Node/Express Backend Proxy       │
│ Cloud Firestore SDK          │    │ - /api/scrape-metadata           │
│ - rules: owner-locked (ABAC) │    │ - PWA Web Share Target Handler   │
│ - realtime sync onSnapshot   │    │ - GitHub Repo Stats Proxy        │
└──────────────────────────────┘    └──────────────────────────────────┘
```

### Firestore Schema Entities

1. **`users/{userId}`**:
   - `uid`: string (matches auth.uid)
   - `email`: string
   - `displayName`: string
   - `createdAt`: serverTimestamp
   - `preferences`: { theme: 'dark' | 'light', defaultView: 'grid' | 'table' }

2. **`resources/{resourceId}`**:
   - `id`: string
   - `ownerId`: string (indexed)
   - `url`: string (max 2048 chars)
   - `title`: string (max 200 chars)
   - `description`: string (max 1000 chars)
   - `domain`: string
   - `faviconUrl`: string
   - `resourceType`: 'website' | 'github' | 'ai_tool' | 'docs' | 'tutorial' | 'api' | 'video' | 'article' | 'course'
   - `collectionId`: string | null
   - `workspaceIds`: string[] (max 10 workspaces)
   - `tags`: string[] (max 20 tags)
   - `notes`: string (max 5000 chars)
   - `isFavorite`: boolean
   - `isPinned`: boolean
   - `isArchived`: boolean
   - `githubData`: { stars: number, language: string, forks: number, lastUpdate: string } | null
   - `clickCount`: number
   - `lastOpenedAt`: serverTimestamp | null
   - `createdAt`: serverTimestamp
   - `updatedAt`: serverTimestamp

3. **`collections/{collectionId}`**:
   - `id`: string
   - `ownerId`: string (indexed)
   - `name`: string (max 100 chars)
   - `description`: string (max 500 chars)
   - `icon`: string (Lucide icon identifier)
   - `color`: string (Hex or preset theme name)
   - `createdAt`: serverTimestamp
   - `updatedAt`: serverTimestamp

4. **`workspaces/{workspaceId}`**:
   - `id`: string
   - `ownerId`: string (indexed)
   - `name`: string ('Personal Study', 'Bookmarks', 'Media', etc.)
   - `description`: string
   - `icon`: string
   - `color`: string
   - `pinnedResourceIds`: string[]
   - `projectNotes`: string
   - `createdAt`: serverTimestamp
   - `updatedAt`: serverTimestamp

### Interactive Component & State Mapping

- **Auth State (`useAuth`)**: Tracks Firebase `User`, handles login, registration, password reset, and Google OAuth popup. Unauthenticated visitors are routed to the branded Auth Portal.
- **Resource Management (`useResources`)**: Subscribes to user's Firestore resources via `onSnapshot` with `where('ownerId', '==', user.uid)`. Exposes CRUD operations, batch tagging, archive/favorite toggles, and duplicate URL checks.
- **Universal Command Palette (`useCommandPalette`)**: Intercepts `Ctrl+K`/`Cmd+K` keypresses, filters resources and actions across all entities in-memory for instant $<50\text{ms}$ search responses.
- **Bookmark Importer (`BookmarkImporter`)**: Parses standard Netscape format HTML, recursively traverses `DL`/`H3` folders into Collections, strips duplicates, and imports resources in Firestore batches.
- **PWA Share Target (`ShareTargetView`)**: Listens to query parameters (`?url=...&title=...&text=...`) supplied by Android share intents, pre-fills the resource form, and guides the user through saving.
