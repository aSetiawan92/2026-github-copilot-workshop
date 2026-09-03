CREATE TABLE IF NOT EXISTS bookmarks (
  user_id VARCHAR(120) NOT NULL,
  item_type VARCHAR(2) NOT NULL CHECK (item_type IN ('PR', 'PO', 'GR')),
  item_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created
  ON bookmarks(user_id, created_at DESC);
