-- Up Migration

-- A separate list from tasks — things to buy (favors, decor, signage), not
-- things to do. Quantity/store/cost are shopping-specific fields that don't
-- belong on a task.
CREATE TABLE shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  estimated_cost numeric(12, 2) CHECK (estimated_cost >= 0),
  store text,
  purchased boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX shopping_items_wedding_id_idx ON shopping_items (wedding_id);

CREATE TRIGGER shopping_items_set_updated_at
  BEFORE UPDATE ON shopping_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TABLE shopping_items;
