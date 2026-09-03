import { describe, expect, test, jest } from '@jest/globals';
import { addBookmark, listBookmarks, removeBookmark } from '../../src/services/bookmark-service.js';

describe('bookmark-service', () => {
  test('addBookmark rejects invalid itemType', async () => {
    const db = { query: jest.fn() };

    await expect(addBookmark(db, 'user-1', { itemType: 'XX', itemId: 'id-1' })).rejects.toMatchObject({
      message: 'itemType must be one of PR, PO, or GR',
      statusCode: 422,
    });
  });

  test('addBookmark rejects when item does not exist', async () => {
    const db = { query: jest.fn(() => ({ rowCount: 0, rows: [] })) };

    await expect(
      addBookmark(db, 'user-1', { itemType: 'PR', itemId: '11111111-1111-1111-1111-111111111999' })
    ).rejects.toMatchObject({
      message: 'PR item not found',
      statusCode: 404,
    });
  });

  test('addBookmark inserts bookmark for existing item', async () => {
    let call = 0;
    const db = {
      query: jest.fn(() => {
        call += 1;
        if (call === 1) {
          return { rowCount: 1, rows: [{ id: 'po-1' }] };
        }

        return { rowCount: 1, rows: [] };
      }),
    };

    const result = await addBookmark(db, 'user-1', { itemType: 'po', itemId: 'po-1' });

    expect(result).toEqual({ userId: 'user-1', itemType: 'PO', itemId: 'po-1' });
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  test('removeBookmark validates itemType', async () => {
    const db = { query: jest.fn() };

    await expect(removeBookmark(db, 'user-1', 'bad', 'x')).rejects.toMatchObject({
      message: 'itemType must be one of PR, PO, or GR',
      statusCode: 422,
    });
  });

  test('removeBookmark returns removed=true when row deleted', async () => {
    const db = { query: jest.fn(() => ({ rowCount: 1, rows: [] })) };

    const result = await removeBookmark(db, 'user-1', 'PR', 'pr-1');

    expect(result).toEqual({ removed: true });
  });

  test('listBookmarks maps query rows', async () => {
    const db = {
      query: jest.fn(() => ({
        rowCount: 1,
        rows: [
          {
            item_type: 'GR',
            item_id: 'gr-1',
            created_at: '2026-01-01T00:00:00.000Z',
            document_number: 'GR-2026-0001',
            item_title: 'Draft receipt',
            item_status: 'DRAFT',
            secondary_text: 'PO-2026-0001',
          },
        ],
      })),
    };

    const result = await listBookmarks(db, 'user-1');

    expect(result).toEqual([
      {
        itemType: 'GR',
        itemId: 'gr-1',
        createdAt: '2026-01-01T00:00:00.000Z',
        documentNumber: 'GR-2026-0001',
        title: 'Draft receipt',
        status: 'DRAFT',
        secondaryText: 'PO-2026-0001',
      },
    ]);
  });
});
