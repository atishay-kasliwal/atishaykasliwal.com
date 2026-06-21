-- ═══════════════════════════════════════════════════════════════════════════════
-- FAMILY STORY PLATFORM — Production PostgreSQL Schema
-- Graph-first design: every entity is a node, every connection is a typed edge.
-- Extensible relationship types, full audit trail, versioning, search indexing.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- trigram index for fuzzy name search
CREATE EXTENSION IF NOT EXISTS "btree_gist";    -- overlap/exclusion constraints for date ranges

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE gender_type AS ENUM (
  'male', 'female', 'non_binary', 'other', 'unknown'
);

CREATE TYPE person_status AS ENUM (
  'living', 'deceased', 'unknown', 'stillborn'
);

CREATE TYPE relationship_category AS ENUM (
  'family',       -- parent, sibling, spouse
  'occupation',   -- colleague, mentor, predecessor
  'education',    -- teacher, classmate
  'business',     -- co-founder, investor, employee
  'geography',    -- migrated_with, neighbor
  'legacy',       -- influenced, inspired, mentored
  'custom'        -- open extension point
);

CREATE TYPE media_type AS ENUM (
  'photo', 'document', 'video', 'audio', 'scan', 'certificate', 'other'
);

CREATE TYPE business_status AS ENUM (
  'founding', 'operating', 'sold', 'closed', 'merged', 'unknown'
);

CREATE TYPE education_status AS ENUM (
  'completed', 'incomplete', 'dropped', 'transferred', 'ongoing', 'unknown'
);

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT MIXIN (applied via triggers, not table inheritance)
-- All tables include: created_at, updated_at, created_by, updated_by, is_deleted
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- FAMILY BRANCH
-- Top-level grouping. A family may have multiple named branches.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE family_branch (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,                      -- "Kasliwal Main", "London Branch"
  description     TEXT,
  founding_year   SMALLINT,
  founding_location TEXT,
  color_hex       CHAR(7),                            -- UI accent color
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_family_branch_name ON family_branch USING gin (name gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────────────────────
-- PERSON  (core graph node)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE person (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Identity
  first_name          TEXT NOT NULL,
  middle_name         TEXT,
  last_name           TEXT,
  birth_last_name     TEXT,                           -- maiden/prior surname
  nicknames           TEXT[],                         -- array of informal names
  display_name        TEXT GENERATED ALWAYS AS (
                        COALESCE(first_name || ' ' || last_name, first_name)
                      ) STORED,

  -- Demographics
  gender              gender_type NOT NULL DEFAULT 'unknown',
  gender_note         TEXT,                           -- for changed/non-binary cases
  status              person_status NOT NULL DEFAULT 'unknown',

  -- Dates  (partial dates allowed — store as text when only year known)
  birth_date          DATE,
  birth_date_approx   TEXT,                           -- "circa 1920", "before 1925"
  death_date          DATE,
  death_date_approx   TEXT,
  birth_location_id   UUID,                           -- FK → location
  death_location_id   UUID,

  -- Content
  biography           TEXT,
  legacy_note         TEXT,                           -- how we remember them (never "died")
  personal_notes      TEXT,                           -- private editor notes

  -- Meta-graph
  family_branch_id    UUID REFERENCES family_branch(id),
  generation_number   SMALLINT,                       -- 1 = root ancestors

  -- Flags
  is_living           BOOLEAN GENERATED ALWAYS AS (status = 'living') STORED,
  is_private          BOOLEAN NOT NULL DEFAULT FALSE, -- hide from public view
  has_conflicts       BOOLEAN NOT NULL DEFAULT FALSE, -- data quality flag
  is_duplicate_of     UUID,                           -- points to canonical record

  -- Search
  search_vector       TSVECTOR GENERATED ALWAYS AS (
                        setweight(to_tsvector('english', COALESCE(first_name,'')), 'A') ||
                        setweight(to_tsvector('english', COALESCE(last_name,'')), 'A') ||
                        setweight(to_tsvector('english', COALESCE(biography,'')), 'C')
                      ) STORED,

  -- Audit
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by          UUID,
  updated_by          UUID,
  version             INTEGER NOT NULL DEFAULT 1,
  is_deleted          BOOLEAN NOT NULL DEFAULT FALSE
);

-- Primary search index
CREATE INDEX idx_person_search ON person USING gin (search_vector);
-- Fuzzy name search (trigram)
CREATE INDEX idx_person_first_name_trgm ON person USING gin (first_name gin_trgm_ops);
CREATE INDEX idx_person_last_name_trgm  ON person USING gin (last_name  gin_trgm_ops);
-- Filtering
CREATE INDEX idx_person_generation  ON person (generation_number) WHERE is_deleted = FALSE;
CREATE INDEX idx_person_branch      ON person (family_branch_id)  WHERE is_deleted = FALSE;
CREATE INDEX idx_person_birth_year  ON person (EXTRACT(YEAR FROM birth_date)) WHERE birth_date IS NOT NULL;
CREATE INDEX idx_person_status      ON person (status);
CREATE INDEX idx_person_living      ON person (is_living) WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- RELATIONSHIP EDGE  (the heart of the graph model)
-- Typed, directed, temporally-bounded.
-- Subject → predicate → object pattern.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE relationship (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  from_person_id  UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  to_person_id    UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,

  -- Open relationship type — not an enum; new types added by inserting new values.
  -- Core types: biological_parent, adoptive_parent, step_parent, guardian,
  --             spouse, divorced, separated, widowed,
  --             sibling, half_sibling, step_sibling, twin, triplet,
  --             mentored, influenced, founded_with, preceded_in_role
  rel_type        TEXT NOT NULL,
  category        relationship_category NOT NULL DEFAULT 'family',

  -- Temporal (optional)
  start_date      DATE,
  end_date        DATE,
  is_current      BOOLEAN NOT NULL DEFAULT TRUE,

  -- Quality
  confidence      SMALLINT DEFAULT 100 CHECK (confidence BETWEEN 0 AND 100),
  source_note     TEXT,                               -- where data came from
  is_disputed     BOOLEAN NOT NULL DEFAULT FALSE,

  -- Audit
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by      UUID,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Prevent exact duplicate edges
  CONSTRAINT uq_relationship UNIQUE NULLS NOT DISTINCT (from_person_id, to_person_id, rel_type, start_date)
);

-- Bidirectional graph traversal
CREATE INDEX idx_rel_from   ON relationship (from_person_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_rel_to     ON relationship (to_person_id)   WHERE is_deleted = FALSE;
CREATE INDEX idx_rel_type   ON relationship (rel_type)        WHERE is_deleted = FALSE;
CREATE INDEX idx_rel_cat    ON relationship (category)        WHERE is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- LOCATION
-- Canonical place registry — reused across person, business, event tables.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE location (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city        TEXT,
  state       TEXT,
  country     TEXT NOT NULL,
  country_iso CHAR(2),
  latitude    NUMERIC(9,6),
  longitude   NUMERIC(9,6),
  display     TEXT GENERATED ALWAYS AS (
                COALESCE(city || ', ', '') || COALESCE(state || ', ', '') || country
              ) STORED,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_location_country ON location (country);
CREATE INDEX idx_location_city_trgm ON location USING gin (city gin_trgm_ops);

-- Add FK constraints now that location exists
ALTER TABLE person
  ADD CONSTRAINT fk_person_birth_loc FOREIGN KEY (birth_location_id) REFERENCES location(id),
  ADD CONSTRAINT fk_person_death_loc FOREIGN KEY (death_location_id) REFERENCES location(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PERSON LOCATION HISTORY
-- Tracks every place a person lived, worked, or visited.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE location_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id   UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES location(id),
  start_date  DATE,
  end_date    DATE,
  is_current  BOOLEAN NOT NULL DEFAULT FALSE,
  note        TEXT,                                   -- "fled during Partition", "work assignment"
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_loc_hist_person   ON location_history (person_id);
CREATE INDEX idx_loc_hist_location ON location_history (location_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- OCCUPATION HISTORY
-- Multiple careers, breaks, and retirements per person.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE occupation_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id       UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  organization    TEXT,
  industry        TEXT,
  location_id     UUID REFERENCES location(id),
  start_date      DATE,
  end_date        DATE,
  is_current      BOOLEAN NOT NULL DEFAULT FALSE,
  is_career_break BOOLEAN NOT NULL DEFAULT FALSE,     -- sabbatical, gap year
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_occ_person   ON occupation_history (person_id);
CREATE INDEX idx_occ_industry ON occupation_history USING gin (industry gin_trgm_ops);
CREATE INDEX idx_occ_title    ON occupation_history USING gin (title   gin_trgm_ops);

-- ─────────────────────────────────────────────────────────────────────────────
-- EDUCATION HISTORY
-- Supports interruptions, transfers, multiple degrees.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE education_history (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id       UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  institution     TEXT NOT NULL,
  degree          TEXT,
  field_of_study  TEXT,
  location_id     UUID REFERENCES location(id),
  start_date      DATE,
  end_date        DATE,
  graduation_year SMALLINT,
  status          education_status NOT NULL DEFAULT 'completed',
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_edu_person      ON education_history (person_id);
CREATE INDEX idx_edu_institution ON education_history USING gin (institution gin_trgm_ops);
CREATE INDEX idx_edu_year        ON education_history (graduation_year);

-- ─────────────────────────────────────────────────────────────────────────────
-- BUSINESS
-- Companies, partnerships, ventures started or associated with family members.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE business (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  industry        TEXT,
  founded_year    SMALLINT,
  closed_year     SMALLINT,
  status          business_status NOT NULL DEFAULT 'operating',
  location_id     UUID REFERENCES location(id),
  website         TEXT,
  notes           TEXT,

  -- Search
  search_vector   TSVECTOR GENERATED ALWAYS AS (
                    setweight(to_tsvector('english', COALESCE(name,'')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(description,'')), 'C')
                  ) STORED,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_business_search  ON business USING gin (search_vector);
CREATE INDEX idx_business_name    ON business USING gin (name gin_trgm_ops);
CREATE INDEX idx_business_status  ON business (status);

-- ─────────────────────────────────────────────────────────────────────────────
-- BUSINESS ROLE  (person ↔ business many-to-many with temporal role)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE business_role (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id   UUID NOT NULL REFERENCES person(id)   ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES business(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,                         -- "Founder", "Director", "Employee"
  start_date  DATE,
  end_date    DATE,
  is_current  BOOLEAN NOT NULL DEFAULT FALSE,
  equity_pct  NUMERIC(5,2),                         -- ownership percentage if known
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_bizrole_person   ON business_role (person_id);
CREATE INDEX idx_bizrole_business ON business_role (business_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- ACHIEVEMENT
-- Flexible award/recognition entity, linked to person or business.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE achievement (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id   UUID REFERENCES person(id)   ON DELETE CASCADE,
  business_id UUID REFERENCES business(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  awarded_by  TEXT,
  awarded_at  DATE,
  category    TEXT,                                  -- "Academic", "Business", "Civic"
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
  CHECK (person_id IS NOT NULL OR business_id IS NOT NULL)
);

CREATE INDEX idx_ach_person   ON achievement (person_id)   WHERE is_deleted = FALSE;
CREATE INDEX idx_ach_business ON achievement (business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_ach_year     ON achievement (EXTRACT(YEAR FROM awarded_at)) WHERE awarded_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- MEDIA ASSET  (photos, documents, recordings)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE media_asset (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id       UUID REFERENCES person(id)   ON DELETE SET NULL,
  business_id     UUID REFERENCES business(id) ON DELETE SET NULL,
  storage_url     TEXT NOT NULL,                     -- Cloud Storage URL
  thumbnail_url   TEXT,
  asset_type      media_type NOT NULL DEFAULT 'photo',
  title           TEXT,
  description     TEXT,
  taken_at        DATE,
  location_id     UUID REFERENCES location(id),
  mime_type       TEXT,
  file_size_bytes BIGINT,
  is_primary      BOOLEAN NOT NULL DEFAULT FALSE,    -- profile photo flag
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by     UUID,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_media_person   ON media_asset (person_id)   WHERE is_deleted = FALSE;
CREATE INDEX idx_media_business ON media_asset (business_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_media_year     ON media_asset (EXTRACT(YEAR FROM taken_at)) WHERE taken_at IS NOT NULL;
CREATE INDEX idx_media_primary  ON media_asset (person_id, is_primary) WHERE is_primary = TRUE AND is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- STORY CHAPTER  (narrative content per person or family branch)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE story_chapter (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id       UUID REFERENCES person(id)        ON DELETE CASCADE,
  family_branch_id UUID REFERENCES family_branch(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  chapter_order   SMALLINT NOT NULL DEFAULT 0,
  era_label       TEXT,                              -- "The Merchant Years", "Building India"
  year_from       SMALLINT,
  year_to         SMALLINT,
  featured_media_id UUID REFERENCES media_asset(id),

  -- Search
  search_vector   TSVECTOR GENERATED ALWAYS AS (
                    setweight(to_tsvector('english', COALESCE(title,'')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(body,'')),  'B')
                  ) STORED,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by      UUID,
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,

  CHECK (person_id IS NOT NULL OR family_branch_id IS NOT NULL)
);

CREATE INDEX idx_chapter_person ON story_chapter (person_id, chapter_order);
CREATE INDEX idx_chapter_search ON story_chapter USING gin (search_vector);

-- ─────────────────────────────────────────────────────────────────────────────
-- LEGACY EVENT  (significant moments in the family's history — not person-centric)
-- Powers the Timeline mode.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE legacy_event (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT,
  event_date      DATE,
  event_year      SMALLINT,
  event_type      TEXT NOT NULL,                     -- "birth", "business_founded", "migration", "marriage", "war", "milestone"
  location_id     UUID REFERENCES location(id),
  family_branch_id UUID REFERENCES family_branch(id),
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted      BOOLEAN NOT NULL DEFAULT FALSE
);

-- Junction: a legacy event can involve multiple people
CREATE TABLE legacy_event_person (
  event_id    UUID NOT NULL REFERENCES legacy_event(id) ON DELETE CASCADE,
  person_id   UUID NOT NULL REFERENCES person(id)       ON DELETE CASCADE,
  role_label  TEXT,
  PRIMARY KEY (event_id, person_id)
);

CREATE INDEX idx_leg_event_year   ON legacy_event (event_year);
CREATE INDEX idx_leg_event_type   ON legacy_event (event_type);
CREATE INDEX idx_leg_event_person ON legacy_event_person (person_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TAG
-- Free-form labels for people, businesses, events (many-to-many via junction).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE tag (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  category    TEXT,
  color_hex   CHAR(7),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE person_tag (
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  tag_id    UUID NOT NULL REFERENCES tag(id)    ON DELETE CASCADE,
  PRIMARY KEY (person_id, tag_id)
);

CREATE INDEX idx_person_tag_tag ON person_tag (tag_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE  (private editor commentary, different from biography)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE note (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id   UUID REFERENCES person(id)   ON DELETE CASCADE,
  business_id UUID REFERENCES business(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  is_private  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_deleted  BOOLEAN NOT NULL DEFAULT FALSE
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PERSON VALUES / INFLUENCES / LANGUAGES  (arrays kept light via junction tables)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE person_value (
  person_id   UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  value_label TEXT NOT NULL,
  PRIMARY KEY (person_id, value_label)
);

CREATE TABLE person_language (
  person_id   UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  language    TEXT NOT NULL,
  proficiency TEXT DEFAULT 'native',
  PRIMARY KEY (person_id, language)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TIMELINE EVENT  (lightweight events for the UI timeline slider)
-- Denormalized view-friendly table for fast rendering.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE timeline_event (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year            SMALLINT NOT NULL,
  month           SMALLINT,
  title           TEXT NOT NULL,
  subtitle        TEXT,
  event_type      TEXT NOT NULL,
  person_id       UUID REFERENCES person(id),
  business_id     UUID REFERENCES business(id),
  location_id     UUID REFERENCES location(id),
  family_branch_id UUID REFERENCES family_branch(id),
  is_public       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_year    ON timeline_event (year);
CREATE INDEX idx_timeline_type    ON timeline_event (event_type);
CREATE INDEX idx_timeline_person  ON timeline_event (person_id) WHERE person_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- AUDIT LOG  (immutable append-only change record for versioning)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE audit_log (
  id              BIGSERIAL PRIMARY KEY,
  table_name      TEXT NOT NULL,
  record_id       UUID NOT NULL,
  action          TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  changed_fields  JSONB,
  old_values      JSONB,
  new_values      JSONB,
  changed_by      UUID,
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_record    ON audit_log (record_id, table_name);
CREATE INDEX idx_audit_changed   ON audit_log (changed_at);
CREATE INDEX idx_audit_table     ON audit_log (table_name);

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGERS: updated_at auto-maintenance
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'person','relationship','occupation_history','education_history',
    'business','business_role','story_chapter','note'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: increment version on person update
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_person_version()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_person_version
BEFORE UPDATE ON person
FOR EACH ROW EXECUTE FUNCTION increment_person_version();

-- ─────────────────────────────────────────────────────────────────────────────
-- VIEWS for common access patterns
-- ─────────────────────────────────────────────────────────────────────────────

-- Active family members with current location
CREATE VIEW v_active_members AS
SELECT
  p.id,
  p.display_name,
  p.first_name,
  p.last_name,
  p.gender,
  p.status,
  p.generation_number,
  p.birth_date,
  p.death_date,
  p.biography,
  p.legacy_note,
  fb.name AS branch_name,
  l.display AS birth_location,
  cl.display AS current_location
FROM person p
LEFT JOIN family_branch fb ON p.family_branch_id = fb.id
LEFT JOIN location l ON p.birth_location_id = l.id
LEFT JOIN LATERAL (
  SELECT loc.display
  FROM location_history lh
  JOIN location loc ON lh.location_id = loc.id
  WHERE lh.person_id = p.id AND lh.is_current = TRUE
  LIMIT 1
) cl ON TRUE
WHERE p.is_deleted = FALSE AND p.is_private = FALSE;

-- Person with all connections (graph adjacency)
CREATE VIEW v_person_graph AS
SELECT
  r.from_person_id,
  p1.display_name AS from_name,
  r.rel_type,
  r.category,
  r.to_person_id,
  p2.display_name AS to_name,
  r.start_date,
  r.end_date,
  r.is_current,
  r.confidence
FROM relationship r
JOIN person p1 ON r.from_person_id = p1.id AND p1.is_deleted = FALSE
JOIN person p2 ON r.to_person_id   = p2.id AND p2.is_deleted = FALSE
WHERE r.is_deleted = FALSE;

-- ─────────────────────────────────────────────────────────────────────────────
-- FULL-TEXT SEARCH: unified cross-table search function
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_family(query TEXT, result_limit INT DEFAULT 20)
RETURNS TABLE (
  result_type   TEXT,
  result_id     UUID,
  display       TEXT,
  rank          REAL
) LANGUAGE sql STABLE AS $$
  SELECT 'person', id, display_name,
    ts_rank(search_vector, websearch_to_tsquery('english', query))
  FROM person
  WHERE search_vector @@ websearch_to_tsquery('english', query)
    AND is_deleted = FALSE

  UNION ALL

  SELECT 'business', id, name,
    ts_rank(search_vector, websearch_to_tsquery('english', query))
  FROM business
  WHERE search_vector @@ websearch_to_tsquery('english', query)
    AND is_deleted = FALSE

  UNION ALL

  SELECT 'chapter', id, title,
    ts_rank(search_vector, websearch_to_tsquery('english', query))
  FROM story_chapter
  WHERE search_vector @@ websearch_to_tsquery('english', query)
    AND is_deleted = FALSE

  ORDER BY rank DESC
  LIMIT result_limit;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SCALABILITY NOTES
-- • Partition timeline_event by year if data grows beyond 100K rows
-- • Partition audit_log by month (RANGE on changed_at)
-- • Add pg_vector extension for AI embedding search when enrichment is enabled
-- • Use materialized view for v_person_graph and refresh on relationship change
-- • Consider read-replica for search queries under high concurrency
-- ─────────────────────────────────────────────────────────────────────────────
