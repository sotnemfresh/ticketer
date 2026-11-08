# User profile API

## Access and routes

Both endpoints require an authenticated AGENT or ADMIN, checked against the
current database role. Signed-out/deleted users receive 401; other roles receive
403. Existing user list and create routes are unchanged.

`GET /api/users/:id` returns id, name, email, role, jobTitle, phone, and avatarUrl.
Optional fields may be null. passwordHash is never selected.
User IDs must be positive integers within the database Int range; malformed IDs
return 400 and missing users return 404.

`GET /api/users/:id/tickets?cursor=...` returns:

```json
{
  "userId": 123,
  "relationship": "assigned",
  "tickets": [],
  "pageSize": 30,
  "nextCursor": null
}
```

The profile owner's role determines the relationship, not the caller's role:

- AGENT/ADMIN: assigneeId matches the profile user (assigned).
- CUSTOMER/VIEWER: requesterId matches the profile user (requested).

All statuses, including CLOSED and SOLVED, are included. Tickets are ordered by
createdAt descending and ID descending. Only table summaries and safe
requester/assignee summaries are selected, not descriptions or conversations.
The database fetches at most 31 summaries to detect another page; at most 30
are returned. Send nextCursor unchanged for the next page and retain earlier
cursors in the client for Previous. Cursors are bound to the profile user and
relationship; changing roles between assigned/requested invalidates old cursors
with a 400 response. Restart pagination after that change.

Status grouping is a frontend responsibility and groups only the current page.
The API does not provide independent pagination for individual groups. Profile
editing, user search, and sidebar counts are not implemented here.

Organisation and additional user fields are planned for later and are not part
of the current profile API. The existing schema/migration declaration for
organisation is left unchanged; it is not selected or used by this feature.

## Ownership

- src/routers/userRoutes.ts: profile HTTP endpoints and access middleware.
- src/services/users/userProfileInput.ts: strict ID and cursor validation.
- src/services/users/userProfileService.ts: safe profile selection and role-based ticket queries.

## Verification

No new migration is needed for these endpoints. Apply existing migrations and
generate Prisma if the profile fields are not yet available locally. Run from
backend:

```powershell
npx tsc --noEmit
npx tsx --test src/services/users/userProfileInput.test.ts
$env:RUN_USER_PROFILE_DB_TESTS = '1'
npx tsx --test src/services/users/userProfileService.test.ts
Remove-Item Env:RUN_USER_PROFILE_DB_TESTS
```

Use a development/test database. Database fixtures are rolled back, but
autoincrement sequences advance. Tests cover safe profile fields, all four
roles, inverse-relationship exclusion, closed tickets, tied-date pagination,
empty/missing users, and profile/relationship-bound cursors.

With the backend running, sign in as an agent and open
`http://localhost:3000/api/users/123` and
`http://localhost:3000/api/users/123/tickets`, using an existing user ID.
Check profile fields, follow nextCursor, and verify 401 signed out, 403 as
CUSTOMER/VIEWER, 400 for an ID such as 12abc, and 404 for a missing user.
HTTP middleware permissions are not covered by the service tests.