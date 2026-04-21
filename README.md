# AI Meeting Summary & Action Tracker

A portfolio-grade MVP for turning meeting notes into structured outputs that are easy to review, manage, and export.

This product is being built step by step as a real full-stack dashboard app, not a toy demo. The current version focuses on the core meeting flow: creating meetings, storing them in SQLite, listing them in a dashboard, and opening a dedicated detail page for each meeting.

## Product Vision

Users will be able to:

- add meeting content manually
- generate AI summaries
- extract key discussion points
- extract action items
- assign tasks to people mentioned in the meeting
- review everything in a clean dashboard
- export results as PDF

## Current Status

Phase 1 is in progress and the backend foundation is already working.

Implemented so far:

- reusable Prisma client setup
- SQLite database connection
- `GET /api/meetings`
- `POST /api/meetings`
- request validation for `title` and `sourceType`
- dashboard page with meeting list
- client-side meeting creation form
- meeting detail page

Not implemented yet:

- AI summary generation
- structured key points and action items
- PDF export
- authentication
- file upload
- email sending

## Tech Stack

- Next.js 16 App Router
- TypeScript
- React 19
- Prisma 7
- SQLite
- Tailwind CSS 4

## Features

### Current MVP features

- Create a meeting with manual text input
- Save meetings to the database
- View all meetings in a dashboard-style list
- Open a dedicated detail page for each meeting
- Use a typed API layer with Prisma-backed persistence

### Planned V1 features

- AI-generated summary
- structured key points
- structured action items
- task grouping by owner
- PDF export

## Project Structure

```text
app/
  api/meetings/route.ts       Meetings API
  meetings/[id]/page.tsx      Meeting detail page
  page.tsx                    Dashboard page
components/
  meetings/create-meeting-form.tsx
lib/
  prisma.ts                   Reusable Prisma client
  validations/meeting.ts      API request validation
prisma/
  schema.prisma               Database schema
  migrations/                 Prisma migrations
```

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Copy `.env.example` to `.env`.

```bash
DATABASE_URL="file:./dev.db"
```

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## API

### `GET /api/meetings`

Returns all meetings ordered by newest first.

### `POST /api/meetings`

Creates a meeting.

Example request body:

```json
{
  "title": "Weekly Product Sync",
  "sourceType": "manual",
  "rawText": "Ali will update the landing page. Zeynep will prepare the metrics report."
}
```

## Why This Project Matters

This repository is designed to demonstrate:

- full-stack product thinking
- dashboard-style UI construction
- CRUD foundations in a SaaS-like app
- structured AI-ready architecture
- practical TypeScript and Prisma usage

The goal is to show a realistic product build process that can be presented on GitHub, LinkedIn, a CV, or a personal portfolio site.

## Roadmap

### Phase 1

- core meeting flow
- dashboard
- detail page

### Phase 2

- AI-ready schema for structured outputs

### Phase 3

- AI integration for summary and action items

### Phase 4

- PDF export

### Phase 5

- polish, empty states, loading states, and portfolio cleanup

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
