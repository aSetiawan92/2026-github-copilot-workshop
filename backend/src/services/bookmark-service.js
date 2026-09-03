const VALID_ITEM_TYPES = new Set(['PR', 'PO', 'GR']);

function normalizeItemType(itemType) {
  if (typeof itemType !== 'string') {
    return '';
  }

  return itemType.trim().toUpperCase();
}

function validateBookmarkPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Body is required';
  }

  const itemType = normalizeItemType(payload.itemType);
  if (!VALID_ITEM_TYPES.has(itemType)) {
    return 'itemType must be one of PR, PO, or GR';
  }

  if (!payload.itemId || typeof payload.itemId !== 'string') {
    return 'itemId is required';
  }

  return null;
}

async function itemExists(db, itemType, itemId) {
  if (itemType === 'PR') {
    const result = await db.query('SELECT id FROM purchase_requisitions WHERE id = $1', [itemId]);
    return result.rowCount > 0;
  }

  if (itemType === 'PO') {
    const result = await db.query('SELECT id FROM purchase_orders WHERE id = $1', [itemId]);
    return result.rowCount > 0;
  }

  const result = await db.query('SELECT id FROM goods_receipts WHERE id = $1', [itemId]);
  return result.rowCount > 0;
}

export async function addBookmark(db, userId, payload) {
  const validationError = validateBookmarkPayload(payload);
  if (validationError) {
    const error = new Error(validationError);
    error.statusCode = 422;
    throw error;
  }

  const itemType = normalizeItemType(payload.itemType);
  const itemId = payload.itemId;
  const exists = await itemExists(db, itemType, itemId);

  if (!exists) {
    const error = new Error(`${itemType} item not found`);
    error.statusCode = 404;
    throw error;
  }

  await db.query(
    `INSERT INTO bookmarks (user_id, item_type, item_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, item_type, item_id) DO NOTHING`,
    [userId, itemType, itemId]
  );

  return {
    userId,
    itemType,
    itemId,
  };
}

export async function removeBookmark(db, userId, itemType, itemId) {
  const normalizedItemType = normalizeItemType(itemType);
  if (!VALID_ITEM_TYPES.has(normalizedItemType)) {
    const error = new Error('itemType must be one of PR, PO, or GR');
    error.statusCode = 422;
    throw error;
  }

  if (!itemId || typeof itemId !== 'string') {
    const error = new Error('itemId is required');
    error.statusCode = 422;
    throw error;
  }

  const result = await db.query(
    `DELETE FROM bookmarks WHERE user_id = $1 AND item_type = $2 AND item_id = $3`,
    [userId, normalizedItemType, itemId]
  );

  return { removed: result.rowCount > 0 };
}

function mapBookmarkRow(row) {
  return {
    itemType: row.item_type,
    itemId: row.item_id,
    createdAt: row.created_at,
    documentNumber: row.document_number,
    title: row.item_title,
    status: row.item_status,
    secondaryText: row.secondary_text,
  };
}

export async function listBookmarks(db, userId) {
  const { rows } = await db.query(
    `SELECT b.item_type, b.item_id, b.created_at,
            CASE
              WHEN b.item_type = 'PR' THEN pr.pr_number
              WHEN b.item_type = 'PO' THEN po.po_number
              WHEN b.item_type = 'GR' THEN gr.gr_number
            END AS document_number,
            CASE
              WHEN b.item_type = 'PR' THEN pr.title
              WHEN b.item_type = 'PO' THEN po.vendor_name
              WHEN b.item_type = 'GR' THEN COALESCE(gr.notes, '')
            END AS item_title,
            CASE
              WHEN b.item_type = 'PR' THEN pr.status
              WHEN b.item_type = 'PO' THEN po.status
              WHEN b.item_type = 'GR' THEN gr.status
            END AS item_status,
            CASE
              WHEN b.item_type = 'PR' THEN pr.requester_name
              WHEN b.item_type = 'PO' THEN po.vendor_name
              WHEN b.item_type = 'GR' THEN po_for_gr.po_number
            END AS secondary_text
     FROM bookmarks b
     LEFT JOIN purchase_requisitions pr
       ON b.item_type = 'PR' AND pr.id = b.item_id
     LEFT JOIN purchase_orders po
       ON b.item_type = 'PO' AND po.id = b.item_id
     LEFT JOIN goods_receipts gr
       ON b.item_type = 'GR' AND gr.id = b.item_id
     LEFT JOIN purchase_orders po_for_gr
       ON b.item_type = 'GR' AND po_for_gr.id = gr.po_id
     WHERE b.user_id = $1
     ORDER BY b.created_at DESC`,
    [userId]
  );

  return rows.map(mapBookmarkRow);
}
