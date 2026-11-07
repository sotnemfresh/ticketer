CREATE INDEX "Ticket_createdAt_id_idx" ON "Ticket"("createdAt", "id");

CREATE INDEX "Ticket_content_search_idx" ON "Ticket" USING GIN (
  to_tsvector('simple'::regconfig, coalesce("subject", '') || ' ' || coalesce("description", ''))
);

CREATE INDEX "TicketMessage_bodyText_search_idx" ON "TicketMessage" USING GIN (
  to_tsvector('simple'::regconfig, "bodyText")
);