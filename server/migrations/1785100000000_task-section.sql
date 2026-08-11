-- Up Migration

-- Free-text sub-grouping within a task's category — e.g. category "Reception"
-- with sections "Reception tables," "Cookie table," "Guest book table." Not
-- an enum: the areas are invented per-wedding, same reasoning as
-- events.name (see 1784900000000_guests-and-events.sql).
ALTER TABLE tasks ADD COLUMN section text;

-- Down Migration

ALTER TABLE tasks DROP COLUMN section;
