-- Up Migration

CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  due_date date,
  -- Assignment is either a real collaborator (FK, so "my tasks" views and
  -- notifications work) or a free-text label for people who'll never have
  -- an account ("Mom", "Best man", "Florist") — never both. See
  -- docs/data-model.md §2.14.
  assignee_member_id uuid REFERENCES wedding_members(id) ON DELETE SET NULL,
  assignee_label text,
  CHECK (assignee_member_id IS NULL OR assignee_label IS NULL),
  -- SET NULL, not CASCADE: deleting a vendor shouldn't delete the task that
  -- mentions it, just detach it — same reasoning as vendors.budget_category_id.
  vendor_id uuid REFERENCES vendors(id) ON DELETE SET NULL,
  category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tasks_wedding_id_idx ON tasks (wedding_id);
CREATE INDEX tasks_assignee_member_id_idx ON tasks (assignee_member_id);
CREATE INDEX tasks_vendor_id_idx ON tasks (vendor_id);

CREATE TRIGGER tasks_set_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TABLE tasks;
