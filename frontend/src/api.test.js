import { afterEach, describe, expect, test, vi } from 'vitest';
import { api } from './api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('purchase order api helpers', () => {
  test('createPurchaseOrder posts payload to purchase-orders endpoint', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ id: 'po-1' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const payload = { vendorName: 'PT Supplier', lines: [{ prLineId: 'line-1', qtyOrdered: 2 }] };
    const result = await api.createPurchaseOrder(payload);

    expect(result).toEqual({ id: 'po-1' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/purchase-orders',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  });

  test('submitPurchaseOrder calls the submit endpoint', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ id: 'po-1', status: 'SUBMITTED' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.submitPurchaseOrder('po-1');

    expect(result.status).toBe('SUBMITTED');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/purchase-orders/po-1/submit',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('addBookmark posts payload to bookmarks endpoint', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ itemType: 'PR', itemId: 'pr-1' }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const payload = { itemType: 'PR', itemId: 'pr-1' };
    const result = await api.addBookmark(payload);

    expect(result).toEqual({ itemType: 'PR', itemId: 'pr-1' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/bookmarks',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    );
  });

  test('removeBookmark uses delete endpoint', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ removed: true }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await api.removeBookmark('PO', 'po-1');

    expect(result).toEqual({ removed: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/bookmarks/PO/po-1',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
