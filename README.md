# MeetAI

MeetAI is a full-stack meeting intelligence workspace for capturing meeting source material, generating transcripts and AI analysis, and exporting executive-ready PDF reports.

The app is built as a practical SaaS-style product surface: users create an account, work inside a private meeting library, upload or paste meeting content, generate structured outputs, and review each record from a dedicated detail page.

## Features

- User registration, login, logout, and private meeting records
- Manual meeting notes
- `.txt` and `.md` meeting imports
- Audio uploads with transcript generation
- OpenAI-powered meeting summaries, key points, and action items
- Meeting metrics, decisions, risks, and blockers surfaced in the detail view
- PDF export for analyzed meetings
- Vercel-ready persistence with Postgres and Vercel Blob
- Dark mode support

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Prisma 7
- PostgreSQL
- Vercel Blob
- OpenAI API
- Tailwind CSS 4
- pdf-lib / pdfkit

## Product Flow

1. Create an account or sign in.
2. Open the workspace.
3. Create a meeting from manual text, a text file, or an audio file.
4. For audio records, generate a transcript.
5. Run AI analysis when usable meeting text is available.
6. Review summary, key points, action items, metrics, decisions, and risks.
7. Export the final analysis as a PDF report.

## Project Structure

```text
app/
  api/auth/                    Register, login, logout API routes
  api/meetings/                Meeting create/list API routes
  api/meetings/[id]/analysis   AI analysis route
  api/meetings/[id]/export     PDF export route
  api/meetings/[id]/transcript Transcript generation route
  login/                       Login page
  register/                    Registration page
  workspace/                   Authenticated meeting workspace
  meetings/[id]/               Meeting detail page
components/
  auth/                        Auth form and logout button
  meetings/                    Meeting workflow controls
lib/
  auth.ts                      Session and password helpers
  openai.ts                    OpenAI client helper
  prisma.ts                    Prisma client
  uploads.ts                   Local/Vercel Blob upload helpers
  validations/                 API validation
prisma/
  schema.prisma                Database schema
  migrations/                  Prisma migrations
scripts/
  vercel-migrate.cjs           Safe migration helper for Vercel builds
```

## Environment Variables

Create `.env` locally from `.env.example`.

```env
DATABASE_URL="postgres://user:password@host:5432/database"

# Supported alternatives for Vercel/Prisma integrations:
# PRISMA_DATABASE_URL="postgres://user:password@host:5432/database"
# POSTGRES_PRISMA_URL="postgres://user:password@host:5432/database"
# POSTGRES_URL="postgres://user:password@host:5432/database"

BLOB_READ_WRITE_TOKEN="vercel_blob_read_write_token"
TRANSCRIPTION_PROVIDER="mock"
OPENAI_API_KEY="your_openai_api_key"
OPENAI_ANALYSIS_MODEL="gpt-4.1-mini"
AUTH_COOKIE_SECURE="true"
```

For local HTTP testing, set:

```env
AUTH_COOKIE_SECURE="false"
```

For production on Vercel, keep:

```env
AUTH_COOKIE_SECURE="true"
```

## Local Setup

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Apply database migrations to your Postgres database:

```bash
npm run prisma:migrate:deploy
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run prisma:generate
npm run prisma:migrate:deploy
```

`npm run build` runs Prisma Client generation, safely applies migrations only in Vercel when a Postgres URL exists, and then builds the Next.js app.

## Vercel Deployment

This project is designed for Vercel with:

- GitHub deployment
- Postgres database
- Vercel Blob storage
- OpenAI API key

Required production environment variables:

```env
DATABASE_URL="postgres://..."
BLOB_READ_WRITE_TOKEN="..."
OPENAI_API_KEY="..."
OPENAI_ANALYSIS_MODEL="gpt-4.1-mini"
TRANSCRIPTION_PROVIDER="openai"
AUTH_COOKIE_SECURE="true"
```

If your database integration exposes `PRISMA_DATABASE_URL`, `POSTGRES_PRISMA_URL`, or `POSTGRES_URL` instead of `DATABASE_URL`, the app supports those names too.

On Vercel, the build script runs a guarded migration helper:

```bash
node scripts/vercel-migrate.cjs
```

It runs `prisma migrate deploy` only when the build is running on Vercel and a valid Postgres URL is available.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Meetings

- `GET /api/meetings`
- `POST /api/meetings`
- `POST /api/meetings/[id]/transcript`
- `POST /api/meetings/[id]/analysis`
- `GET /api/meetings/[id]/export`

Meeting APIs require an authenticated session.

## Notes

- Uploaded files are stored in Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured.
- Without Blob credentials, uploads fall back to local `uploads/meetings`, which is suitable only for local development.
- `TRANSCRIPTION_PROVIDER="mock"` returns a local mock transcript for development.
- `TRANSCRIPTION_PROVIDER="openai"` uses OpenAI audio transcription for uploaded audio.
- The app stores session tokens as hashes in the database and sends the browser an httpOnly cookie.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
