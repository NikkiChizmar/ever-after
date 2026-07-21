-- Up Migration

CREATE TABLE budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  planned_amount numeric(12, 2) NOT NULL DEFAULT 0 CHECK (planned_amount >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX budget_categories_wedding_id_idx ON budget_categories (wedding_id);

CREATE TRIGGER budget_categories_set_updated_at
  BEFORE UPDATE ON budget_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'venue', 'catering', 'photography', 'videography', 'florist', 'music',
    'attire', 'beauty', 'transport', 'stationery', 'rentals', 'officiant', 'other'
  )),
  status text NOT NULL DEFAULT 'researching' CHECK (status IN (
    'researching', 'contacted', 'quote_received', 'booked', 'declined'
  )),
  -- SET NULL, not CASCADE: deleting a budget category should not delete the
  -- vendors in it — it should just leave them uncategorized.
  budget_category_id uuid REFERENCES budget_categories(id) ON DELETE SET NULL,
  contact_name text,
  email text,
  phone text,
  website text,
  estimated_cost numeric(12, 2) CHECK (estimated_cost >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX vendors_wedding_id_idx ON vendors (wedding_id);
CREATE INDEX vendors_budget_category_id_idx ON vendors (budget_category_id);

CREATE TRIGGER vendors_set_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  title text,
  total_amount numeric(12, 2) NOT NULL CHECK (total_amount >= 0),
  signed_on date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contracts_wedding_id_idx ON contracts (wedding_id);
CREATE INDEX contracts_vendor_id_idx ON contracts (vendor_id);

CREATE TRIGGER contracts_set_updated_at
  BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  label text NOT NULL,
  amount numeric(12, 2) NOT NULL,
  due_date date,
  -- NULL = scheduled but not yet paid. This single field is the payment
  -- schedule (due_date set, paid_date null) and the payment history
  -- (paid_date set) — see docs/data-model.md §2.13.
  paid_date date,
  method text CHECK (method IN ('card', 'check', 'transfer', 'cash', 'other')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payments_wedding_id_idx ON payments (wedding_id);
CREATE INDEX payments_contract_id_idx ON payments (contract_id);

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TABLE payments;
DROP TABLE contracts;
DROP TABLE vendors;
DROP TABLE budget_categories;
