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
- Ticket messages and message history
- Global ticket search
- PostgreSQL with Prisma schema and migrations
- Microsoft Graph integration for inbound and outbound email

## Known limitations

- **Inbound processing:** A message-processing failure can stop the current batch and prevent the poller from advancing. Permanent failures need a durable retry or quarantine strategy.
- **Email authorization:** Message-ID matches currently help correlate messages to tickets but should not, by themselves, authorize a sender to participate in or modify a ticket. The policy for forwarded threads and new participants still needs to be defined.
- **Attachments:** Duplicate-file handling can lose the association between an attachment and later messages. Generated attachment URLs also need an authorized serving endpoint.
- **Microsoft Graph reliability:** Requests need bounded timeouts and operation-aware retry/throttling handling. Attachment-list pagination also needs to be handled.
- **Ticket reopening:** The intended rule for reopening tickets needs to be clarified and tested, particularly for replies from agents versus customers.

## Planned / remaining work

### Email and ticket reliability

- [ ] Make inbound email processing resilient to malformed or permanently failing messages
- [ ] Define and enforce who may participate in a ticket email thread
- [ ] Add ticket-message attachments, including reliable message associations and authorized downloads
- [ ] Link emails from other workers in the same organization or email domain, with clear participation rules
- [ ] Add Microsoft Graph timeouts, appropriate retry handling, and attachment pagination
- [ ] Complete end-to-end email workflow testing, including failure and recovery cases

### Ticket workflow and history

- [ ] Add ticket follower notifications
- [ ] Add a ticket-closing and archiving workflow
- [ ] Define and test when replies reopen a ticket, including the behavior for customer and agent replies
- [ ] Add a history view showing who made changes to a ticket
- [ ] Improve message display: show each message in a card and show who each email was sent to
- [ ] Add a way to view the original email, with the intended light background and colored text

### Users, organizations, and navigation

- [ ] Build a dedicated user page
- [ ] Build an admin page
- [ ] Add organizations as a separate entity with unique IDs and an organization page
- [ ] Add navigable tabs for open tickets, search, and users
- [ ] Add keyboard shortcuts for navigating the website and managing tickets

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