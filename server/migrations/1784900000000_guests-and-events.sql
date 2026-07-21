-- Up Migration

CREATE TABLE parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name text NOT NULL,
  mailing_address text,
  -- Whose side, for list-splitting and counts. Null is a normal, common answer.
  side text CHECK (side IS NULL OR side IN ('partner1', 'partner2', 'both')),
  notes text,
  -- Reserved for a future guest-facing RSVP portal (see docs/data-model.md §5).
  -- Costs nothing to add now; adding it after launch would be a migration.
  invite_code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX parties_wedding_id_idx ON parties (wedding_id);

CREATE TRIGGER parties_set_updated_at
  BEFORE UPDATE ON parties
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  -- Deleting a party deletes its guests — see docs/data-model.md §2.4.
  party_id uuid NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  -- Nullable: an unnamed plus-one is a real row before it has a name.
  first_name text,
  last_name text,
  email text,
  phone text,
  age_type text NOT NULL DEFAULT 'adult' CHECK (age_type IN ('adult', 'child', 'infant')),
  is_plus_one boolean NOT NULL DEFAULT false,
  -- An unnamed plus-one has no independent identity — if the host guest is
  -- removed, their plus-one goes with them.
  plus_one_of uuid REFERENCES guests(id) ON DELETE CASCADE,
  dietary_notes text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT plus_one_requires_host CHECK (NOT is_plus_one OR plus_one_of IS NOT NULL)
);

CREATE INDEX guests_wedding_id_idx ON guests (wedding_id);
CREATE INDEX guests_party_id_idx ON guests (party_id);
CREATE INDEX guests_plus_one_of_idx ON guests (plus_one_of);

CREATE TRIGGER guests_set_updated_at
  BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE guest_dietary_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  tag text NOT NULL CHECK (tag IN (
    'vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'nut_allergy',
    'shellfish_allergy', 'kosher', 'halal', 'other'
  )),
  UNIQUE (guest_id, tag)
);

CREATE INDEX guest_dietary_tags_guest_id_idx ON guest_dietary_tags (guest_id);

CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  -- Free text, not an enum: couples invent events (sangeet, afterparty) —
  -- see docs/data-model.md §2.7.
  name text NOT NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  venue_name text,
  address text,
  attire text,
  notes text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_wedding_id_idx ON events (wedding_id);

CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE meal_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_kids_meal boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Lets event_invitations reference (event_id, id) as a composite FK below,
  -- guaranteeing a guest can never select a meal from a different event's menu.
  UNIQUE (event_id, id)
);

CREATE INDEX meal_options_wedding_id_idx ON meal_options (wedding_id);
CREATE INDEX meal_options_event_id_idx ON meal_options (event_id);

CREATE TRIGGER meal_options_set_updated_at
  BEFORE UPDATE ON meal_options
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE event_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id uuid NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  rsvp_status text NOT NULL DEFAULT 'pending' CHECK (rsvp_status IN ('pending', 'attending', 'declined')),
  responded_at timestamptz,
  response_source text NOT NULL DEFAULT 'manual' CHECK (response_source IN ('manual', 'portal')),
  meal_option_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guest_id, event_id),
  -- The composite FK is the actual guarantee: it can only reference a meal
  -- option whose event_id matches THIS row's event_id. See migration comment
  -- on meal_options.
  FOREIGN KEY (event_id, meal_option_id) REFERENCES meal_options (event_id, id) ON DELETE SET NULL
);

CREATE INDEX event_invitations_wedding_id_idx ON event_invitations (wedding_id);
CREATE INDEX event_invitations_guest_id_idx ON event_invitations (guest_id);
CREATE INDEX event_invitations_event_id_idx ON event_invitations (event_id);

CREATE TRIGGER event_invitations_set_updated_at
  BEFORE UPDATE ON event_invitations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TABLE event_invitations;
DROP TABLE meal_options;
DROP TABLE events;
DROP TABLE guest_dietary_tags;
DROP TABLE guests;
DROP TABLE parties;
