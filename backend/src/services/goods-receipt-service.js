function mapHeader(row) {
  return {
    id: row.id,
    grNumber: row.gr_number,
    status: row.status,
    receiptDate: row.receipt_date,
    poId: row.po_id,
    poNumber: row.po_number,
    vendorName: row.vendor_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listGoodsReceipts(db) {
  const { rows } = await db.query(
    `SELECT gr.id, gr.gr_number, gr.status, gr.receipt_date, gr.po_id, gr.created_at, gr.updated_at,
            po.po_number, po.vendor_name
     FROM goods_receipts gr
     JOIN purchase_orders po ON po.id = gr.po_id
     ORDER BY gr.created_at DESC`
  );

  return rows.map(mapHeader);
}
