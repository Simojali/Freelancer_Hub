# Freelancer Hub

A minimal CRM web app to manage leads, clients, projects, and revenue across two freelance businesses (thumbnail design + video editing).

## Stack

- **Vite + React + TypeScript**
- **Supabase** — Postgres database, direct client calls (no backend)
- **Tailwind CSS v4 + shadcn/ui**
- **SWR** — data fetching with optimistic updates
- **React Router v6** — client-side routing
- **@dnd-kit** — drag-and-drop kanban board
- **Recharts** — revenue bar chart

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard — KPIs, outreach pipeline funnel, recent activity |
| `/leads` | Leads table with inline pipeline checkboxes |
| `/clients` | Client cards with credit progress bars |
| `/projects` | Kanban board (In Progress / Review / Done) |
| `/revenue` | Monthly revenue chart + payment log |

## Setup

```bash
npm install
cp .env.example .env
# fill in your Supabase URL and anon key in .env
npm run dev
```

## Environment Variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
