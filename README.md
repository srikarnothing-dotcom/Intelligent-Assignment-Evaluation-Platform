# Intelligent Assignment Evaluation & Feedback Platform

A full-stack web platform where students submit assignments and instructors receive automated evaluation, feedback, and plagiarism risk analysis.

## Features

- **Student Dashboard**: Submit assignment text, view submission status, view feedback
- **Instructor Dashboard**: Create assignments, view submissions, review AI-generated feedback
- **AI/ML Components**:
  - **Plagiarism Detection**: TF-IDF + Cosine Similarity to compare submissions
  - **Automated Feedback**: Rule-based analysis (structure, length, depth)
- **REST APIs**: Full CRUD for assignments and submissions
- **Database**: Users, Assignments, Submissions, Feedback (Prisma + SQLite)

## Quick Start

```bash
npm install
npx prisma db push
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| GET | `/api/assignments` | List assignments (optional `?instructorId=`) |
| POST | `/api/assignments` | Create assignment |
| GET | `/api/assignments/[id]` | Get assignment with submissions |
| GET | `/api/submissions` | List submissions (`?assignmentId=` or `?studentId=`) |
| POST | `/api/submissions` | Create submission (auto-evaluates) |
| GET | `/api/submissions/[id]` | Get submission with feedback |
| POST | `/api/submissions/[id]/evaluate` | Re-evaluate submission |
| POST | `/api/upload` | Upload .txt file (returns content) |

## Expected Output Format

```json
{
  "submission_id": "S103",
  "plagiarism_risk": "22%",
  "feedback_summary": "The explanation lacks depth in section 2.",
  "score": 68
}
```

## Deployment on Vercel

1. **Database**: Vercel serverless does not support SQLite. Use a hosted database:
   - [Neon](https://neon.tech) (PostgreSQL)
   - [PlanetScale](https://planetscale.com) (MySQL)
   - [Supabase](https://supabase.com) (PostgreSQL)

2. **Schema**: Update `prisma/schema.prisma` to use `postgresql` or `mysql` instead of `sqlite`.

3. **Deploy**:
   ```bash
   vercel
   ```

4. Set `DATABASE_URL` in Vercel environment variables.

5. Run migrations: `npx prisma db push` (or `prisma migrate deploy`) with your production DB URL.

## Project Structure

```
src/
├── app/
│   ├── api/           # REST API routes
│   ├── student/[id]/  # Student dashboard
│   ├── instructor/[id]/ # Instructor dashboard
│   └── page.tsx       # Landing page
├── lib/
│   ├── ai/            # Plagiarism (TF-IDF) + Feedback (rule-based)
│   ├── db.ts          # Prisma client
│   └── utils.ts
prisma/
└── schema.prisma      # Database schema
```

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS
- **Backend**: Next.js API Routes (Node.js)
- **Database**: Prisma ORM, SQLite (dev) / PostgreSQL (prod)
- **AI/ML**: TF-IDF, Cosine Similarity, rule-based feedback
