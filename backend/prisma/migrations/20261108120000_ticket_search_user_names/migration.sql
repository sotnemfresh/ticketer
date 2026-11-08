CREATE INDEX "User_name_search_idx" ON "User" USING GIN (
  to_tsvector('simple'::regconfig, "name")
);

CREATE INDEX "Ticket_requesterId_idx" ON "Ticket"("requesterId");

CREATE INDEX "Ticket_assigneeId_idx" ON "Ticket"("assigneeId");