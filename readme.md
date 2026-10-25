# Ticketer

Internal ticketing system prototype for an architecture office, built with React, Node.js, and TypeScript.

> **Project status:** In active development (school final project candidate).  
> This repository currently focuses on core ticket workflows, authentication, and email-linked ticket communication.

## Why this project

This project started as a school final project idea: building a practical internal system for handling project-related tasks in an architecture office.

The main problem it addresses is fragmented task tracking (notes, chat fragments, memory-based follow-up).  
Ticketer aims to centralize that workflow through structured tickets, assignment, status tracking, and communication history.

## Current direction

The original concept has evolved during development.  
In particular, email handling is now being integrated using **Microsoft Graph** so ticket communication can be synchronized with mailbox workflows.

## Current implementation (work in progress)

- Session-based authentication
- Ticket CRUD foundations
- Ticket status and priority handling
- Requester/assignee relationships
- Ticket message model and message history
- PostgreSQL + Prisma schema/migrations
- Microsoft Graph integration groundwork for inbound/outbound email processing

## Planned / remaining major features

- [ ] Complete end-to-end email workflow reliability (delivery/reconciliation edge cases)
- [ ] Finalize attachment/file handling flow and storage strategy
- [ ] Implement global Ticket search engine

## Tech stack

- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Email integration:** Microsoft Graph
- **Local infrastructure:** Docker Compose
- **Version control:** Git (Conventional Commits style in use)

## Repository structure

- `frontend/` — React client
- `backend/` — Express API, Prisma schema/migrations, mail services

## Local development

### 1) Start PostgreSQL (Docker)

```bash
cd backend
docker compose up -d
```

### 2) Run backend

```bash
cd backend
npm install
npm run dev
```

### 3) Run frontend

```bash
cd frontend
npm install
npm run dev
```

## Database workflow (Prisma)

From `backend/`:

```bash
npx prisma migrate dev --name <migration_name>
npx prisma generate
npx prisma studio --config ./prisma.config.ts
```

If you need a full reset in development:

```bash
npx prisma migrate reset
```

## Notes

- This is not production-ready yet.
- Some architecture and naming decisions are still being refined as features evolve.