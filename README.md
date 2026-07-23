# Ever After

**"The Wedding Operations Platform"**

**[Live demo](#) — TODO: add the Vercel URL here once deployed (see `docs/deploying-the-demo.md`)**

> The demo is read-only and runs entirely on fictional sample data (a made-up
> couple, made-up vendors, made-up everything) — not anything real. It also
> skips login entirely, since there's nothing real to protect there either.
> The screen says as much when you open it.

## Overview

A modern Wedding Operations Platform designed to centralize every aspect of planning a wedding into one beautiful application.

Ever After is also a public product engineering portfolio project: it is built the way a real early-stage product would be, with deliberate architecture decisions, ruthless scope prioritization, and documentation written for people who will read the code.

## Problem

Wedding planning today is fragmented across spreadsheets, emails, calendars, budgeting apps, vendor portals, and planning websites. Couples spend more time managing information than actually enjoying the planning experience.

A wedding is one of the largest projects most people will ever manage — dozens of vendors, hundreds of guests, a five-figure budget, and an immovable deadline — coordinated with tools that were never designed to work together.

## Solution

Ever After provides one unified platform that combines budgeting, vendor management, guest management, seating arrangements, timeline planning, document storage, payments, analytics, and planning tools into a seamless experience.

Instead of another checklist app, think of it as an operating system for the wedding: one source of truth, designed to reduce stress and create confidence at every step.

## Product Vision

Build the most elegant and intuitive wedding planning platform available.

Every design decision prioritizes reducing stress, improving organization, and creating confidence throughout the planning process. The product should feel like software people would gladly pay for: minimal, warm, premium — no hearts, no lace, no clutter.

## Planned Features

- Wedding Dashboard
- Budget Center
- Vendor CRM
- Guest Management
- RSVP Tracking
- Seating Chart Builder
- Wedding Timeline
- Task Management
- Document Vault
- Wedding Weekend Planner
- Payment Tracking
- Analytics Dashboard
- Wedding Health Score
- Scenario Planning
- AI Wedding Assistant

## Tech Stack

| Layer | Technology | Why |
| --- | --- | --- |
| UI | React 19 + TypeScript | Component model fits a dashboard-heavy product; TypeScript catches whole classes of bugs at compile time and documents intent. |
| Build | Vite | Sub-second dev feedback and fast production builds without webpack-era configuration. |
| Styling | Tailwind CSS 4 | Design tokens live in CSS; utility classes keep styles co-located with components and dead-style-free. |
| Components | shadcn/ui | Accessible Radix primitives, but the code is copied into the repo — full ownership and customization, no black-box component library. |
| API | Node.js + Express 5 | Minimal, unopinionated HTTP layer; the layered structure (routes → controllers → services) is ours and stays framework-portable. |
| Database | PostgreSQL (planned) | Wedding data is deeply relational — guests belong to parties, RSVPs to events, payments to vendors. Relational integrity is a feature. |
| Quality | ESLint + Prettier + strict TS | Enforced consistency; formatting and lint debates are settled by tooling, not review comments. |

## Architecture

npm-workspaces monorepo: one repository, one install, three packages.

```
ever-after/
├── client/                  # React SPA
│   └── src/
│       ├── components/
│       │   ├── ui/          # shadcn/ui primitives (owned, customizable)
│       │   └── layout/      # App shell, navigation
│       ├── features/        # Feature modules: budget/, guests/, vendors/…
│       ├── hooks/           # Cross-feature hooks
│       ├── lib/             # Utilities
│       ├── config/          # Typed environment access
│       ├── styles/          # Design tokens + Tailwind theme
│       └── types/           # Shared client types
├── server/                  # Express API
│   └── src/
│       ├── routes/          # URL structure — thin, declarative
│       ├── controllers/     # HTTP request/response handling
│       ├── services/        # Business logic (framework-agnostic)
│       ├── middleware/      # Cross-cutting concerns (errors, auth…)
│       └── config/          # Zod-validated environment
├── eslint.config.js         # One lint config for the whole workspace
└── package.json             # Workspace root: shared tooling + scripts
```

Key decisions:

- **Feature-based client structure.** Code that changes together lives together. Each product domain (`features/budget/`, `features/guests/`) owns its components, hooks, and API calls, so features can be built, refactored, or removed as units.
- **Layered server structure.** Routes declare URLs, controllers translate HTTP, services hold business logic. Services never import Express — business rules stay testable and portable.
- **Fail-fast configuration.** The server validates its environment with Zod at boot and refuses to start misconfigured. Config bugs surface in seconds, not in production.
- **Design tokens over hardcoded styles.** Colors are semantic CSS variables (`primary`, `muted`) consumed by Tailwind — the entire visual identity can evolve, and dark mode ship, without touching components.
- **API under `/api` with a dev proxy.** The client calls relative URLs; Vite proxies to Express in development. No CORS gymnastics, no hardcoded hosts.

## Getting Started

```bash
# Requires Node 20.19+ and Docker Desktop
npm install

# Environment
cp server/.env.example server/.env
cp client/.env.example client/.env

# Database: Postgres 16 in Docker, then apply migrations
npm run db:up
npm run migrate

# Run client (5173) + server (3000) together
npm run dev
```

Other commands: `npm run build`, `npm run lint`, `npm run format`, `npm run db:down`.

Deploying the public read-only demo (a separate concern from local dev — different database, no real data) is covered in [`docs/deploying-the-demo.md`](docs/deploying-the-demo.md).

## Roadmap

**Phase 0 — Foundation** ✅
Monorepo, design system, API skeleton, tooling, CI-ready quality gates.

**Phase 1 — MVP: the core loop**
Wedding Dashboard, Budget Center, Guest Management + RSVP tracking, Task Management, PostgreSQL + data model, authentication. *Rationale: budget, guests, and tasks are the three anxieties every couple has; a product that nails those is already useful.*

**Phase 2 — Operations**
Vendor CRM, Payment Tracking, Wedding Timeline, Document Vault.

**Phase 3 — Intelligence**
Analytics Dashboard, Wedding Health Score, Scenario Planning ("what does 20 more guests do to the budget?").

**Phase 4 — Delight**
Seating Chart Builder, Wedding Weekend Planner, AI Wedding Assistant.

Each phase ships something usable end-to-end before the next begins — breadth follows depth.

---

*Built with an AI-assisted engineering workflow as a demonstration of product thinking, software craftsmanship, and modern development practice.*
