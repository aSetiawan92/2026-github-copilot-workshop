import { addBookmark, listBookmarks, removeBookmark } from '../services/bookmark-service.js';

function getCurrentUserId(request) {
  const fromHeader = request.headers['x-user-id'];
  if (typeof fromHeader === 'string' && fromHeader.trim()) {
    return fromHeader.trim();
  }

  return 'workshop-user';
}

export default async function bookmarkRoutes(fastify) {
  fastify.get('/api/bookmarks', async (request) => {
    const userId = getCurrentUserId(request);
    const items = await listBookmarks(fastify.db, userId);
    return { items };
  });

  fastify.post('/api/bookmarks', async (request, reply) => {
    try {
      const userId = getCurrentUserId(request);
      const bookmark = await addBookmark(fastify.db, userId, request.body);
      reply.code(201);
      return bookmark;
    } catch (error) {
      if (error.statusCode) {
        reply.code(error.statusCode);
        return { message: error.message };
      }

      throw error;
    }
  });

  fastify.delete('/api/bookmarks/:itemType/:itemId', async (request, reply) => {
    try {
      const userId = getCurrentUserId(request);
      const result = await removeBookmark(
        fastify.db,
        userId,
        request.params.itemType,
        request.params.itemId
      );
      return result;
    } catch (error) {
      if (error.statusCode) {
        reply.code(error.statusCode);
        return { message: error.message };
      }

      throw error;
    }
  });
}
