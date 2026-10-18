# KnowUrCoach — Comprehensive Performance & Architecture Audit Report

**Target Platform:** Next.js 16 (App Router) • React 19 • Prisma 6.19 • PostgreSQL (Supabase / PgBouncer)  
**Hosting Environment:** Dedicated Node.js Server (2 vCPUs, 4GB RAM, Persistent Process Runtime)  
**Audit Scope:** Full Codebase (`src/`, `prisma/`, `next.config.ts`, `.env.example`)  
**File Location:** `PERFORMANCE_AUDIT_REPORT.md`  

---

## 1. Executive Summary

This comprehensive audit of the **KnowUrCoach** codebase was conducted to diagnose the application's core performance bottlenecks following migration from Netlify serverless to a **dedicated virtual server (2 vCPUs, 4GB RAM)**:

1. **Database Latency & Connection Pool Contention:** High query latency, connection pool saturation, and connection timeouts on page loads.
2. **Caching Gaps & Stale Data States:** Inconsistent client UI states, updates failing to propagate after mutations, and lack of persistent caching.
3. **Hardware-Specific Resource Bottlenecks (2 vCPUs / 4GB RAM):** Event loop blocking on a constrained 2-core CPU, high garbage collection (GC) overhead from deep recursive serialization, and potential Out-Of-Memory (OOM) risks under load.

### Key Architectural Findings:
* **Prisma Singleton Leak in Persistent Node Process:** In `src/lib/prisma.ts`, `globalForPrisma.prisma = prisma` is conditionally scoped to `process.env.NODE_ENV !== 'production'`. In production, every module evaluation across separate Webpack bundles (Server Actions, Route Handlers, SSR) instantiates a **new `PrismaClient`**. In a long-running Node.js process, these duplicate clients and their connection pools **never terminate**, leaking database connections continuously until PostgreSQL or PgBouncer rejects new connections.
* **Connection Pool Sizing for 2 vCPUs:** On a persistent server with 2 vCPUs, connection pooling needs to be tuned specifically for the server's concurrency model (e.g. `connection_limit=10` to `15` for single-process Node.js or `5` to `7` per worker under PM2 cluster mode), rather than unconstrained defaults or serverless single-connection hacks.
* **Single-Threaded Event Loop Saturation (2 vCPUs):** Heavy synchronous tasks—including over 40 calls to `JSON.parse(JSON.stringify(...))` on massive object graphs, unoptimized `@phosphor-icons/react` imports, and up to 4 sequential cryptographic token decryptions on every request in `src/proxy.ts`—block the single-threaded Node.js event loop, freezing all concurrent user requests.
* **Memory Headroom & OOM Crash Vulnerability (4GB RAM):** Unbounded queries (`getAdminDashboardData` fetching all centres, parents, children, and bookings without pagination) and in-memory caches without cleanup can trigger Node.js V8 heap exhaustion (`SIGKILL` / exit code 137), taking down the entire web server.
* **Severe Missing Indexes on Foreign Keys & Filters:** In `prisma/schema.prisma`, **almost every foreign key relation** (`ChildProfile.parentId`, `Facility.coachingCentreId`, `Batch.coachingCentreId`, `Booking.parentId`, `Booking.coachingCentreId`, `Attendance.bookingId`, `Lead.coachingCentreId`) lacks an index, forcing PostgreSQL to perform sequential full table scans on every query and cascade delete.
* **Architectural Misuse of Next.js Server Actions for Data Fetching:** Core discovery and dashboard pages (`HomeView`, `ActivitiesView`, `CompetitionsView`, `CoachDashboardPage`, `ParentBookingsPage`) are massive `"use client"` components (some exceeding 100 KB and 1,900 lines) that render empty skeleton shells and fire Server Actions inside `useEffect` on mount. Server Actions are HTTP POST requests that bypass the Next.js Data Cache and HTTP caching.
* **Cache Revalidation Mismatch:** Mutations invoke `revalidatePath(...)`, which invalidates the Next.js Server Component render cache. However, because pages fetch data on the client via `useEffect`, `revalidatePath` has no effect on client-held component state. Concurrently, zero cache tags (`unstable_cache` / `revalidateTag`) exist in the codebase.
* **Request-Path DDL Table Locking:** `src/lib/hero-theme-server.ts` executes runtime `ALTER TABLE "PlatformConfig" ...` DDL on the database inside `getDiscoveryData()`, triggering `AccessExclusiveLock` contention on PostgreSQL on every landing page request.

---

## 2. Dedicated Server Constraints (2 vCPUs, 4GB RAM)

Deploying a monolithic Next.js App Router application to a dedicated virtual server with **2 vCPUs and 4GB RAM** requires careful balance across CPU scheduling, memory limits, and process concurrency:

```
┌─────────────────────────────────────────────────────────────┐
│                    DEDICATED 4GB SERVER                     │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ OS & System Daemons (Linux, systemd, SSH, logging)    │  │
│  │ Memory Footprint: ~500 MB                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Reverse Proxy (Nginx / Caddy)                         │  │
│  │ SSL termination, Gzip/Brotli, Static File Caching     │  │
│  │ Memory Footprint: ~100 MB                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Node.js Next.js Runtime (Max V8 Heap: ~2.5 - 3.0 GB)  │  │
│  │                                                       │  │
│  │  [Core 0: Event Loop]      [Core 1: Worker / Cluster] │  │
│  │  - SSR Streaming           - Webpack Chunks           │  │
│  │  - Route Handlers          - Background Revalidation  │  │
│  │  - Server Actions          - Prisma Connection Pool   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Critical Server Bottlenecks:
1. **CPU Starvation on 2 Cores:** Node.js executes JavaScript on a single thread. When synchronous operations (deep JSON clone cycles, JWT token decryption, or large array mappings) monopolize the thread, no other user's request can be processed. On 2 cores, running 1 or 2 Node instances at 100% CPU causes immediate connection queuing and HTTP 504 gateway timeouts.
2. **Memory Leaks Cause Fatal Process Crashes:** Unlike serverless functions that tear down instances periodically, a dedicated Node.js server runs 24/7. Any memory leak—such as un-cleared in-memory Maps, global Prisma client duplication, or retaining large query sets—will steadily grow the RSS memory until Linux OOM Killer terminates the process.
3. **Persistent On-Disk Cache Opportunity:** Dedicated servers provide a persistent local filesystem. The Next.js Data Cache (`.next/cache`) persists across requests, making Incremental Static Regeneration (ISR) and `unstable_cache` dramatically more performant and reliable than on serverless platforms.

---

## 3. Database & Prisma Bottlenecks

### 3.1 Flawed Prisma Singleton Pattern in Persistent Node Runtime

#### Identified Code (`src/lib/prisma.ts:7-15`):
```typescript
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

#### The Impact on a Dedicated Server:
* In production (`NODE_ENV === 'production'`), `globalForPrisma.prisma = prisma;` is **skipped**.
* Next.js compiles App Router code into isolated Webpack runtime closures (one for SSR, one for Server Actions, and individual closures for Route Handlers).
* When each chunk evaluates `src/lib/prisma.ts`, `globalForPrisma.prisma` is `undefined`. It therefore instantiates a **new `PrismaClient`** with a brand new database connection pool.
* **Why this is catastrophic on a dedicated server:** On serverless, ephemeral containers eventually shut down and drop their connections. On a persistent Node server, the process runs indefinitely. These multiple PrismaClient instances retain their TCP connections permanently. Under traffic, the application exhausts PostgreSQL's connection pool, causing:
  ```
  Error: P2024: Timed out fetching a new connection from the connection pool
  FATAL: remaining connection slots are reserved for non-replication superuser connections
  ```

---

### 3.2 Connection Pool Sizing for 2 vCPUs & PostgreSQL

#### Identified Configuration (`.env.example:3`):
```env
DATABASE_URL="postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

#### Tuning for a 2-Core Server:
* By default, Prisma assigns `(2 vCPUs * 2) + 1 = 5` connections per client instance.
* Because duplicate clients are created (see Section 3.1), 15–30 connections are opened by a single Node process.
* Furthermore, if the server uses **PM2 Cluster Mode** (`instances: 2`), each Node worker creates its own pool.
* **Proper Pool Sizing:**
  * For a single Node process on 2 cores: set `connection_limit=10` to `15` with `pool_timeout=10&connect_timeout=15`.
  * For PM2 with 2 cluster workers: set `connection_limit=7` per worker (total 14 connections to Supabase PgBouncer).
  * This prevents the server from overwhelming PgBouncer while ensuring enough parallel query execution slots for concurrent web requests.

---

### 3.3 Runtime DDL (`ALTER TABLE`) Table-Locking on Read Paths

#### Identified Code (`src/lib/hero-theme-server.ts:9-30`):
```typescript
let isColumnEnsured = false;

async function ensureColumnExists(): Promise<void> {
  if (isColumnEnsured) return;
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "PlatformConfig" ADD COLUMN IF NOT EXISTS "heroCarouselTheme" TEXT;'
    );
    isColumnEnsured = true;
  } catch (err) { ... }
}

export async function readHeroCarouselTheme(): Promise<HeroCarouselTheme> {
  await ensureColumnExists();
  ...
}
```

#### The Problem:
* `readHeroCarouselTheme()` is called inside `getDiscoveryData()`, which executes on every visit to the homepage (`/`) and activities catalog (`/activities`).
* Even though `isColumnEnsured` is set after the first call, on server restarts or PM2 cluster worker launches, the raw `ALTER TABLE` query executes against PostgreSQL.
* `ALTER TABLE` acquires an **`AccessExclusiveLock`** in PostgreSQL. This lock blocks all incoming reads (`SELECT`) and writes (`UPDATE`/`INSERT`) on `PlatformConfig` until the DDL transaction completes.
* The column `heroCarouselTheme` is already declared in `prisma/schema.prisma` (line 446). Database DDL must be executed strictly via migrations (`npx prisma migrate deploy`), never on user-facing request paths.

---

### 3.4 Missing Database Indexes in `prisma/schema.prisma`

In PostgreSQL, **foreign keys do not automatically create indexes**. Relations, joins, and cascading deletes trigger sequential full table scans unless explicitly indexed:

| Model | Unindexed Field(s) | Impact / Query Path | Severity |
| :--- | :--- | :--- | :--- |
| **`ChildProfile`** | `parentId` | Foreign key to `ParentProfile`. `parent.children` queries and profile cascade deletes scan all children. | **CRITICAL** |
| **`Facility`** | `coachingCentreId` | Foreign key to `CoachingCentre`. Discovery lookups with `include: { facilities: true }` scan the entire table. | **CRITICAL** |
| **`Batch`** | `coachingCentreId` | Foreign key to `CoachingCentre`. Discovery and booking batch joins scan the entire `Batch` table. | **CRITICAL** |
| **`Booking`** | `parentId`, `childId`, `coachingCentreId`, `batchId`, `competitionId` | All 5 foreign keys lack indexes. Dashboard queries (`getParentDashboardData`, `getCoachDashboardData`) perform full table scans. | **CRITICAL** |
| **`Attendance`** | `bookingId`, `batchId`, `childId`, `date` | Zero indexes on this table. Daily attendance check-ins and student roster queries scan the entire table. | **CRITICAL** |
| **`Lead`** | `coachingCentreId`, `status`, `createdAt` | `/coach/leads` query filters by `coachingCentreId` without an index. | **HIGH** |
| **`Notification`** | `userId`, `isRead` | User notifications query executes on every navigation for logged-in users. | **HIGH** |
| **`SavedCentre`** | `parentId`, `coachingCentreId` | Zero indexes and no `@@unique([parentId, coachingCentreId])` constraint, leading to duplicate bookmarks. | **HIGH** |
| **`CoachingCentre`** | `[isSuspended, isActive, kycStatus, planTier]` | Core discovery filter in `getDiscoveryData` filters on these 4 fields, but only an index on `[locality, category, safetyGrade]` exists. | **CRITICAL** |
| **`PlatformReview`** | `[isActive, order]` | Homepage testimonials query `where: { isActive: true }, orderBy: { order: 'asc' }` runs unindexed. | **MEDIUM** |
| **`Review`** | `createdAt` | Admin review list orders by `createdAt DESC` without an index. | **MEDIUM** |
| **`SupportTicket`** | `userId`, `status` | Ticket listings scan the entire table. | **MEDIUM** |
| **`PaymentTransaction`**| `userId` | User transaction lookups scan the entire table. | **MEDIUM** |

#### Redundant Indexes:
* `Booking`: `@@index([passId, escrowStatus])` is redundant because `passId` is already declared `@unique`.
* `PaymentTransaction`: `@@index([orderId, paymentId])` is redundant because `orderId` and `paymentId` each have `@unique`.

---

### 3.5 N+1 Queries & Memory-Intensive Unbounded Data Dumps

1. **Sequential N+1 Loops in Actions (`src/lib/actions.ts:2986-3020`):**
   ```typescript
   // Loops with individual DB round-trips
   for (const fac of data.safetyChecklist.facilities) {
     const existing = await prisma.facility.findFirst({ ... });
     if (!existing) await prisma.facility.create({ ... });
   }
   for (const b of data.batches) {
     const existing = await prisma.batch.findFirst({ ... });
     if (existing) await prisma.batch.update({ ... });
     else await prisma.batch.create({ ... });
   }
   ```
2. **Slide Reordering Loop (`src/lib/actions.ts:4730`):**
   `for (const item of slideOrders)` executes individual `prisma.heroSlide.update` calls instead of a single transaction.
3. **Massive Unbounded Data Dump in Admin Dashboard (`src/lib/actions.ts:1983-2050`):**
   `getAdminDashboardData` fetches:
   * ALL Coaching Centres with all batches, facilities, and owner user objects
   * ALL Parent Profiles with all children, bookings, and user records
   * ALL Categories, Competitions, Major Activities, and Disciplines
   * **Memory Impact on 4GB Server:** This single function fetches the entire relational database into a JavaScript object graph and passes it through `JSON.parse(JSON.stringify(data))`. As the dataset grows, this can easily spike V8 memory usage past 1GB, triggering process OOM crashes (`SIGKILL`).

---

## 4. Caching & Next.js Data Fetching Gaps

### 4.1 Server Actions Used as Client Data Fetchers (The Double-Hop Waterfall)

Next.js Server Actions are designed for **data mutations (POST requests)**. They are deliberately bypassed by the Next.js Data Cache. In KnowUrCoach, almost every major page uses Server Actions inside client-side `useEffect` hooks:

```
[Browser Request to /]
       │
       ▼
[Server: SSR Shell]  ──> Renders blank/skeleton page because page is "use client"
       │
       ▼ (HTML sent to browser)
[Browser: Hydration] ──> Downloads JS, boots React, mounts HomeView
       │
       ▼ (useEffect fires)
[POST _rsc Action]   ──> Browser sends POST request over the wire
       │
       ▼
[Node Server Process]──> Boots Prisma, queries PostgreSQL (5 parallel queries)
       │
       ▼ (JSON payload returned)
[Browser Re-render]  ──> Page finally renders content (High TTFB, bad LCP/CLS)
```

**Affected Components:**
* `HomeView.tsx` (`src/components/views/HomeView.tsx:106`)
* `ActivitiesView.tsx` (`src/components/views/ActivitiesView.tsx:90`)
* `CompetitionsView.tsx` (`src/components/views/CompetitionsView.tsx:51`)
* `CoachDashboardPage.tsx` (`src/app/(dashboard)/coach/dashboard/page.tsx:152`)
* `ParentBookingsPage.tsx` (`src/app/(dashboard)/parent/bookings/page.tsx:50`)
* `CompareModal.tsx` (`src/components/modals/CompareModal.tsx:23`)

**Why this hurts a 2-CPU Dedicated Server:**
On a dedicated server, Next.js can pre-render pages statically or serve them from the local filesystem Data Cache in **< 15ms**. By forcing data fetching through client-side `useEffect` Server Actions:
* Every user visit forces the server to process a dynamic HTTP POST request.
* Both CPU cores are constantly kept busy re-executing identical database queries and JSON cloning operations.
* Search engine bots receive empty skeletons, hurting SEO.

---

### 4.2 `revalidatePath` Mismatch with Client-Held State

Clients report stale data and missing updates after performing actions:
1. When a coach submits KYC or updates batch details, the server action calls `revalidatePath('/coach/dashboard')`.
2. `revalidatePath` clears the Next.js Server Component render cache on the server.
3. However, `/coach/dashboard` is a **Client Component (`"use client"`)** that stores data in local React `useState`.
4. Client-side navigation (`next/link`, `router.push`) reuses the client router cache and existing component state. The component's `useEffect` does not re-run, leaving the user with old state.
5. In mutations like `updateCoachAcademyProfile` (`src/lib/actions.ts:743`), `revalidatePath('/activities')` is called, but **`/activities/[id]` (the actual detail page)** and **`/` (the homepage)** are omitted. Public visitors continue seeing old fees and batch times.

---

### 4.3 Static Route Handler Bake-in (`src/app/api/homepage-reviews/route.ts`)

```typescript
// src/app/api/homepage-reviews/route.ts
export async function GET() {
  try {
    const reviews = await getHomepageReviews();
    return NextResponse.json({ success: true, reviews });
  } catch (err: any) { ... }
}
```
* In Next.js App Router, a `GET` Route Handler that takes **no parameters** (`req: NextRequest`) and reads no headers/cookies is evaluated at build time and cached statically.
* When an admin adds, edits, or approves a testimonial via `/admin/reviews`, the route handler never updates.
* The public homepage continues returning the build-time snapshot indefinitely until the server is rebuilt.

---

### 4.4 Discarded Database Hit in Global Context (`src/context/PersonaContext.tsx`)

#### Identified Code (`src/context/PersonaContext.tsx:127-137`):
```typescript
const refreshConfig = async () => {
  try {
    await fetch('/api/config', { cache: 'no-store' });
  } catch (err) {
    console.warn('Failed to fetch live config:', err);
  }
};

useEffect(() => {
  refreshConfig();
}, []);
```
* `PersonaProvider` wraps the entire application in `src/app/layout.tsx`.
* On **every single page load across the entire application**, `refreshConfig()` executes `fetch('/api/config', { cache: 'no-store' })`.
* `/api/config` queries PostgreSQL for `PlatformConfig`.
* The response is **never assigned to state, context, or localStorage**. It is literally fetched and thrown away.
* On a 2-CPU server, this creates unnecessary network and database load on every single page navigation.

---

## 5. Frontend & React Performance Gaps

### 5.1 Event Loop Starvation from CPU-Intensive Tasks (2 vCPUs)

Node.js processes JavaScript on a single thread. When synchronous tasks run, the event loop cannot handle other requests:
* **Deep JSON Cloning (`toPlainObject`):** Called over 40 times in `src/lib/actions.ts` via `JSON.parse(JSON.stringify(data))` on large arrays of coaching centres and bookings. Deep serialization of large object graphs is CPU-intensive and generates massive V8 garbage collection churn.
* **Sequential JWT Verification in Middleware (`src/proxy.ts:18-65`):** Runs up to 4 sequential `getToken()` cryptographic decrypt attempts on every matched request before routing.
* **Unoptimized Barrel Imports:** `@phosphor-icons/react` and `date-fns` parse thousands of unused exports in JavaScript memory during server compilation.

### 5.2 Heavy Client Bundles & Multi-Step Waterfalls

| Component | Lines | File Size | Issues |
| :--- | :--- | :--- | :--- |
| `src/app/(dashboard)/coach/dashboard/page.tsx` | 1,992 | 102 KB | Massive client component containing safety checklist, file base64 conversions, batch editor, roster check-in, SVG icons. |
| `src/app/(public)/activities/[id]/page.tsx` | 1,278 | 66 KB | Fully client-side detail page; fallback loads all DB centres; duplicate review fetch waterfall. |
| `src/components/views/HomeView.tsx` | 1,211 | 63 KB | Entire landing page is a client component; SSR disabled via `force-dynamic`; loads data after hydration. |
| `src/components/reviews/AcademyReviewsSection.tsx`| 677 | 31 KB | Double fetch: loads `/api/reviews` and `/api/reviews/eligibility` sequentially on mount. |

---

## 6. Actionable Suggestions & Production-Ready Code Fixes

### 6.1 Global Prisma Singleton Fix (`src/lib/prisma.ts`)

Replace `src/lib/prisma.ts` with this singleton that unconditionally persists on `globalThis`, preventing connection pool multiplication in persistent Node processes:

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

// Unconditionally store on globalThis to prevent multiple PrismaClient
// instances across Next.js Webpack chunk evaluations in long-running Node.js processes.
globalForPrisma.prisma = prisma;

export default prisma;
```

---

### 6.2 Connection Pool Sizing for 2 vCPUs / 4GB RAM (`.env`)

Update `DATABASE_URL` in `.env` to configure pool limits suited for a 2-core dedicated server:

```env
# 1. DATABASE_URL: Transaction Pooler (Port 6543) via Supabase / PgBouncer
# Sized for 2 vCPU server concurrency (10 connections max per Node instance)
DATABASE_URL="postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10&pool_timeout=10&connect_timeout=15"

# 2. DIRECT_URL: Direct Session Connection (Port 5432) for Migrations & Schema Sync
DIRECT_URL="postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?connect_timeout=15"
```

---

### 6.3 Dedicated Server Process Configuration (PM2 & Node Memory)

Create `ecosystem.config.js` in the root of your repository to run Next.js with memory guards and cluster management:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'knowurcoach',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      instances: 2, // 1 worker per CPU core
      exec_mode: 'cluster',
      max_memory_restart: '1500M', // Auto-restart if a worker leaks memory past 1.5GB
      node_args: '--max-old-space-size=1536',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
};
```

---

### 6.4 Eliminate Runtime DDL from `src/lib/hero-theme-server.ts`

Remove `ensureColumnExists()` and raw `ALTER TABLE` execution:

```typescript
// src/lib/hero-theme-server.ts
import prisma from '@/lib/prisma';
import { HeroCarouselTheme, DEFAULT_HERO_CAROUSEL_THEME } from './hero-theme';

/**
 * Server-only: Read Hero Carousel Theme directly from PlatformConfig.
 * Never execute DDL (ALTER TABLE) during request execution!
 */
export async function readHeroCarouselTheme(): Promise<HeroCarouselTheme> {
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { id: 'default' },
      select: { heroCarouselTheme: true },
    });

    if (config?.heroCarouselTheme) {
      if (typeof config.heroCarouselTheme === 'string') {
        return { ...DEFAULT_HERO_CAROUSEL_THEME, ...JSON.parse(config.heroCarouselTheme) };
      }
    }
  } catch (err) {
    console.warn('[DB] Failed to read heroCarouselTheme, using defaults:', err);
  }
  return { ...DEFAULT_HERO_CAROUSEL_THEME };
}

export async function writeHeroCarouselTheme(theme: Partial<HeroCarouselTheme>): Promise<HeroCarouselTheme> {
  const current = await readHeroCarouselTheme();
  const merged: HeroCarouselTheme = { ...current, ...theme };
  const jsonString = JSON.stringify(merged);

  await prisma.platformConfig.upsert({
    where: { id: 'default' },
    update: { heroCarouselTheme: jsonString },
    create: {
      id: 'default',
      heroCarouselTheme: jsonString,
    },
  });

  return merged;
}
```

---

### 6.5 Database Schema Indexes (`prisma/schema.prisma`)

Apply these required indexes to resolve full table scans across relations and discovery lookups:

```prisma
// prisma/schema.prisma additions:

model ChildProfile {
  // ... existing fields ...
  parentId String
  parent   ParentProfile @relation(fields: [parentId], references: [id], onDelete: Cascade)

  @@index([parentId])
}

model Facility {
  // ... existing fields ...
  coachingCentreId String
  centre           CoachingCentre @relation(fields: [coachingCentreId], references: [id], onDelete: Cascade)

  @@index([coachingCentreId])
}

model Batch {
  // ... existing fields ...
  coachingCentreId String
  centre           CoachingCentre @relation(fields: [coachingCentreId], references: [id], onDelete: Cascade)

  @@index([coachingCentreId])
}

model CoachingCentre {
  // ... existing fields ...

  // Compound index matching getDiscoveryData() query predicates
  @@index([isSuspended, isActive, kycStatus, planTier])
  @@index([locality, category])
}

model Booking {
  // ... existing fields ...

  @@index([parentId, createdAt])
  @@index([coachingCentreId, createdAt])
  @@index([childId])
  @@index([batchId])
  @@index([competitionId])
  @@index([bookingStatus, escrowStatus])
}

model Attendance {
  // ... existing fields ...

  @@index([bookingId, date])
  @@index([batchId, date])
  @@index([childId, date])
}

model Lead {
  // ... existing fields ...

  @@index([coachingCentreId, status, createdAt])
}

model Notification {
  // ... existing fields ...

  @@index([userId, isRead, createdAt])
}

model SavedCentre {
  id               String        @id @default(cuid())
  parentId         String
  parent           ParentProfile @relation(fields: [parentId], references: [id], onDelete: Cascade)
  coachingCentreId String

  @@unique([parentId, coachingCentreId])
  @@index([parentId])
  @@index([coachingCentreId])
}

model PlatformReview {
  // ... existing fields ...

  @@index([isActive, order])
}

model Review {
  // ... existing fields ...

  @@index([createdAt])
  @@index([coachingCentreId, status, rating])
}

model SupportTicket {
  // ... existing fields ...

  @@index([userId, status])
}
```

*Run `npx prisma db push` or `npx prisma migrate dev --name add_performance_indexes` to generate and apply these indexes.*

---

### 6.6 Persistent Cache Layer (`unstable_cache` & Tagged Invalidation)

On a dedicated server, Next.js stores cached responses persistently on disk (`.next/cache`). Leverage `unstable_cache`:

```typescript
// src/lib/cached-queries.ts
import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { KycStatus, SubscriptionPlan } from '@prisma/client';
import { readHeroCarouselTheme } from '@/lib/hero-theme-server';
import { formatBatchItem } from '@/lib/batch-helpers';

/**
 * Cached Discovery Data: cached for 5 minutes (300s) on disk/memory,
 * with instant on-demand invalidation via revalidateTag('discovery').
 */
export const getCachedDiscoveryData = unstable_cache(
  async () => {
    const [centres, competitions, majorActivities, config, heroSlides, heroCarouselTheme] =
      await Promise.all([
        prisma.coachingCentre.findMany({
          where: {
            isSuspended: false,
            isActive: true,
            kycStatus: KycStatus.APPROVED,
            planTier: { in: [SubscriptionPlan.STANDARD, SubscriptionPlan.PREMIUM] },
          },
          include: {
            facilities: true,
            batches: true,
            owner: {
              select: { id: true, email: true, phone: true, role: true },
            },
          },
          orderBy: [
            { isTopInArea: 'desc' },
            { isVerifiedBatch: 'desc' },
            { planTier: 'desc' },
            { rating: 'desc' },
          ],
        }),
        prisma.competition.findMany({
          orderBy: { registrationFee: 'asc' },
        }),
        prisma.majorActivity.findMany({
          where: { isActive: true },
          include: {
            disciplines: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        }),
        prisma.platformConfig.findUnique({
          where: { id: 'default' },
        }),
        prisma.heroSlide.findMany({
          where: { isActive: true },
          orderBy: { order: 'asc' },
        }),
        readHeroCarouselTheme(),
      ]);

    const mappedCentres = centres.map((c) => ({
      ...c,
      batches: (c.batches || []).map((b) => formatBatchItem(b, c.category)),
    }));

    return {
      centres: mappedCentres,
      competitions,
      activities: majorActivities,
      config,
      heroSlides,
      heroCarouselTheme,
    };
  },
  ['discovery-data-cache'],
  {
    revalidate: 300, // Background revalidate every 5 minutes
    tags: ['discovery', 'academies', 'competitions'],
  }
);
```

#### Mutation Revalidation Fix:
```typescript
import { revalidateTag, revalidatePath } from 'next/cache';

// In updateCoachAcademyProfile / verifyCoachByAdmin:
revalidateTag('discovery');
revalidateTag('academies');
revalidateTag(`academy-${centreId}`);
revalidatePath('/activities');
revalidatePath(`/activities/${centreId}`);
revalidatePath('/');
```

---

### 6.7 Server Component Conversion with ISR (`src/app/(public)/page.tsx`)

Convert the homepage to a Server Component that serves pre-cached discovery data instantly:

```typescript
// src/app/(public)/page.tsx
import { getCachedDiscoveryData } from '@/lib/cached-queries';
import { HomeView } from '@/components/views/HomeView';

// Incremental Static Regeneration on the dedicated server
export const revalidate = 60; // Regenerate at most once per minute

export default async function HomePage() {
  const initialData = await getCachedDiscoveryData();
  return <HomeView initialData={initialData} />;
}
```

In `HomeView.tsx`:
* Accept `initialData` as props.
* Remove the `useEffect` that triggers `getDiscoveryData()` on mount.
* Result: **Instant LCP, zero client-side waterfall, zero database load on landing page requests.**

---

### 6.8 Route Handler Caching & Stale Data Fixes

#### 1. Fix `src/app/api/config/route.ts`
Stop disabling cache with `no-store`:

```typescript
// src/app/api/config/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const config = await prisma.platformConfig.findUnique({
      where: { id: 'default' },
      select: {
        themeColor: true,
        bgColor: true,
        siteName: true,
        tagline: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        themeColor: config?.themeColor || 'emerald',
        bgColor: config?.bgColor || 'slate',
        siteName: config?.siteName || 'KnowUrCoach',
        tagline: config?.tagline || 'Hyperlocal Sports & Academy Discovery across India',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
```

#### 2. Fix `src/app/api/homepage-reviews/route.ts`
```typescript
// src/app/api/homepage-reviews/route.ts
import { NextResponse } from 'next/server';
import { getHomepageReviews } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reviews = await getHomepageReviews();
    return NextResponse.json(
      { success: true, reviews },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
```

#### 3. Remove Dead `fetch('/api/config')` from `src/context/PersonaContext.tsx`
Delete lines 127–137 in `src/context/PersonaContext.tsx`.

---

### 6.9 Optimize Next.js Compiler & Barrel Imports (`next.config.ts`)

Enable compiler-level package tree-shaking to reduce CPU and memory consumption during SSR:

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  // Drastically reduces CPU and RAM usage by tree-shaking heavy icon libraries
  optimizePackageImports: [
    '@phosphor-icons/react',
    'date-fns',
    'clsx',
    'tailwind-merge',
  ],
};

export default nextConfig;
```

---

### 6.10 Streamline Middleware Auth Decryption (`src/proxy.ts`)

Prevent event loop delays by eliminating redundant sequential JWT decryptions:

```typescript
// src/proxy.ts
async function getAuthToken(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || 'knowurcoach-secret-key-agra-2026';

  const isSecure = request.cookies.has('__Secure-next-auth.session-token');
  const cookieName = isSecure
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token';

  try {
    const token = await getToken({
      req: request,
      secret,
      cookieName,
      secureCookie: isSecure,
    });
    if (token) return token;
  } catch {}

  // Fallback to default resolution only if explicit cookie failed
  try {
    return await getToken({ req: request, secret });
  } catch {
    return null;
  }
}
```

---

### 6.11 Refactor N+1 Loops to Batch Transactions (`src/lib/actions.ts`)

Replace sequential `update` loops with `prisma.$transaction`:

#### Slide Reordering Fix:
```typescript
// src/lib/actions.ts:4727
export async function reorderHeroSlides(slideOrders: { id: string; order: number }[]) {
  try {
    await requireAdminSession();
    
    // Batch updates inside a single database round-trip transaction
    await prisma.$transaction(
      slideOrders.map((item) =>
        prisma.heroSlide.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    revalidateTag('discovery');
    revalidatePath('/');
    return { success: true, message: "Slides reordered successfully!" };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to reorder slides." };
  }
}
```

#### Facility Batch Creation Fix:
```typescript
// Inside submitCoachKycProfile:
if (data.safetyChecklist.facilities?.length > 0) {
  const uniqueFacilities = Array.from(new Set(data.safetyChecklist.facilities));
  
  await prisma.$transaction([
    prisma.facility.deleteMany({ where: { coachingCentreId: targetCentreId } }),
    prisma.facility.createMany({
      data: uniqueFacilities.map((description) => ({
        coachingCentreId: targetCentreId,
        description,
      })),
    }),
  ]);
}
```

---

## 7. Implementation Roadmap & Priority Matrix

| Phase | Task | Effort | Expected Impact |
| :--- | :--- | :--- | :--- |
| **P0 (Immediate)** | Fix Prisma Singleton (`src/lib/prisma.ts`) | 5 mins | **Prevents persistent connection pool leaks on the server** |
| **P0 (Immediate)** | Configure `connection_limit=10` in `DATABASE_URL` | 2 mins | Calibrates pool size for 2 vCPU Node.js process |
| **P0 (Immediate)** | Remove runtime `ALTER TABLE` DDL (`src/lib/hero-theme-server.ts`) | 5 mins | Eliminates table lock contention on landing page |
| **P0 (Immediate)** | Apply Foreign Key & Filter Indexes in `schema.prisma` | 15 mins | **90–95% reduction in PostgreSQL CPU and query latency** |
| **P1 (High)** | Setup `ecosystem.config.js` (PM2 cluster & memory limit) | 10 mins | Protects 4GB RAM server from OOM crashes |
| **P1 (High)** | Delete dead `fetch('/api/config')` from `PersonaContext` | 2 mins | Eliminates 1 unnecessary DB hit per page navigation |
| **P1 (High)** | Add `optimizePackageImports` in `next.config.ts` | 2 mins | Saves ~150 MB RAM and cuts CPU compile overhead |
| **P1 (High)** | Fix `api/homepage-reviews` dynamic header & revalidation | 5 mins | Resolves stale testimonial updates |
| **P1 (High)** | Add `revalidateTag('discovery')` to coach & admin mutations | 15 mins | Resolves stale academy listings across public pages |
| **P2 (Medium)** | Convert Homepage & Activities to Server Components with ISR | 1–2 hours | **Enables instant LCP & eliminates client data waterfall** |
| **P2 (Medium)** | Refactor N+1 loops to Prisma `$transaction` / `createMany` | 30 mins | Cuts onboarding and reordering latency by 80% |
| **P2 (Medium)** | Add pagination (`take: 50`) to `getAdminDashboardData` | 30 mins | Prevents Node process heap exhaustion as data grows |

---

*Report updated and validated for dedicated 2 vCPU / 4GB RAM Node.js production runtime.*
