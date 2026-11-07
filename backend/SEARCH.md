# Ticket search

## API

`GET /api/search/tickets?q=NASA&cursor=...`

Requires an authenticated session belonging to an AGENT or ADMIN. Missing or
deleted sessions return 401; other roles return 403. Invalid input returns 400.

The query is trimmed, required, and limited to 200 characters. Each distinct
PostgreSQL `simple` text-search token must match somewhere in the ticket's
subject, description, or message bodyText. Words may span different messages.
Matching is case insensitive, without stemming or prefix/substring matching.
Russian, Estonian, and English use the same tokenizer. PostgreSQL determines
punctuation, compound-word and number tokenization; this is not a literal phrase
search. Punctuation-only queries return no results. A numeric query also matches
the exact ticket ID. User relationships and bodyHtml are not searched.

All statuses, including CLOSED and SOLVED, are eligible. Results contain only
table summaries, ordered by createdAt descending and then ID descending.

```json
{
  "tickets": [],
  "pageSize": 30,
  "nextCursor": null
}
```

Use nextCursor unchanged with the same q to fetch another page. A non-null
cursor indicates another page; null means the end. The server fetches at most
31 ID/timestamp pairs to detect another page, then at most 30 ticket summaries.
The client should retain earlier cursors for Previous navigation. Cursors are
query-bound pagination markers, not authorization tokens or snapshots. Live
ticket content changes can change matching results between requests.

User search, sidebar counts, profiles, and classification filters are separate
follow-up features; this endpoint does not implement them.

## Ownership

- routers/searchRoutes.ts: HTTP handling and error responses.
- middleware/requireAgent.ts: current database role check after requireAuth.
- services/search/searchInput.ts: input validation and cursor encoding.
- services/search/ticketSearchService.ts: parameterized SQL matching and bounded summaries.
- prisma/migrations/20261107180000_ticket_search_indexes/migration.sql: GIN expression indexes and ordering index.

The expression indexes are maintained automatically by PostgreSQL when text
changes. No search table, background job, or triggers are needed. Prisma cannot
represent these GIN expressions in the schema, so retain the custom SQL migration
and inspect future generated migrations for unintended index changes. The
indexed expressions must stay identical to the query expressions.

## Apply and verify

Run from backend (commands are not run by the assistant):

```powershell
npx prisma migrate dev
npx prisma generate
npx tsc --noEmit
npx tsx --test src/services/search/searchInput.test.ts
$env:RUN_SEARCH_DB_TESTS = '1'
npx tsx --test src/services/search/ticketSearchService.test.ts
Remove-Item Env:RUN_SEARCH_DB_TESTS
```

Run the database test against a local development/test database after migration.
It inserts fixtures inside a rolled-back transaction. Autoincrement sequences
still advance, even when the transaction rolls back. Tests cover multilingual
matching, words across messages, closed tickets, duplicate suppression, live
message insertion, numeric IDs, and 30-result cursor pagination with tied dates.

With the backend running, sign in as an agent and open
`http://localhost:3000/api/search/tickets?q=NASA` in the same browser. Confirm
JSON results and follow nextCursor. Also verify 401 signed out, 403 as VIEWER or
CUSTOMER, and 400 for missing q or an invalid cursor. HTTP role checks are not
covered by the database tests.

On representative data, inspect EXPLAIN (ANALYZE, BUFFERS) for the search SQL
before judging performance. Very common words can still produce many database
matches even though API responses are bounded. GIN index creation can lock writes;
plan deployment separately for a busy production database.