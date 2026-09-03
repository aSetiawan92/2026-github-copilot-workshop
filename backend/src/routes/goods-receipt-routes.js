import { listGoodsReceipts } from '../services/goods-receipt-service.js';

export default async function goodsReceiptRoutes(fastify) {
  fastify.get('/api/goods-receipts', async () => {
    const items = await listGoodsReceipts(fastify.db);
    return { items };
  });
}
