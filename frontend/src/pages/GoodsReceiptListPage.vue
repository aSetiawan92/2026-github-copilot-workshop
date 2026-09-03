<template>
  <section>
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/" class="back-btn" title="Back to Dashboard">&#8592;</RouterLink>
        <div>
          <h2>Goods Receipts</h2>
          <p class="muted">All goods receipt records</p>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="card-panel">
      <table>
        <thead>
          <tr>
            <th>GR Number</th>
            <th>PO Number</th>
            <th>Vendor</th>
            <th>Status</th>
            <th>Receipt Date</th>
            <th>Bookmark</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.grNumber }}</td>
            <td>{{ item.poNumber }}</td>
            <td>{{ item.vendorName }}</td>
            <td>
              <span class="status-badge" :class="item.status.toLowerCase()">{{ item.status }}</span>
            </td>
            <td>{{ item.receiptDate || '-' }}</td>
            <td>
              <button
                type="button"
                class="btn-bookmark"
                :class="{ bookmarked: isBookmarked(item.id) }"
                :disabled="isPending(item.id)"
                @click="toggleBookmark(item.id)"
              >
                {{ isBookmarked(item.id) ? 'Bookmarked' : 'Bookmark' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { api } from '../api';

const items = ref([]);
const errorMessage = ref('');
const bookmarkKeys = ref(new Set());
const pendingKeys = ref(new Set());

function bookmarkKey(itemId) {
  return `GR:${itemId}`;
}

function isBookmarked(itemId) {
  return bookmarkKeys.value.has(bookmarkKey(itemId));
}

function isPending(itemId) {
  return pendingKeys.value.has(bookmarkKey(itemId));
}

function addPending(itemId) {
  const next = new Set(pendingKeys.value);
  next.add(bookmarkKey(itemId));
  pendingKeys.value = next;
}

function removePending(itemId) {
  const next = new Set(pendingKeys.value);
  next.delete(bookmarkKey(itemId));
  pendingKeys.value = next;
}

function setBookmarked(itemId, bookmarked) {
  const next = new Set(bookmarkKeys.value);
  if (bookmarked) {
    next.add(bookmarkKey(itemId));
  } else {
    next.delete(bookmarkKey(itemId));
  }
  bookmarkKeys.value = next;
}

async function toggleBookmark(itemId) {
  const bookmarked = isBookmarked(itemId);
  addPending(itemId);
  errorMessage.value = '';

  try {
    if (bookmarked) {
      await api.removeBookmark('GR', itemId);
      setBookmarked(itemId, false);
    } else {
      await api.addBookmark({ itemType: 'GR', itemId });
      setBookmarked(itemId, true);
    }
  } catch (error) {
    errorMessage.value = error.message;
  } finally {
    removePending(itemId);
  }
}

onMounted(async () => {
  try {
    const [goodsReceiptsPayload, bookmarksPayload] = await Promise.all([
      api.listGoodsReceipts(),
      api.listBookmarks(),
    ]);

    items.value = goodsReceiptsPayload.items;
    bookmarkKeys.value = new Set(
      (bookmarksPayload.items || []).map((bookmark) => `${bookmark.itemType}:${bookmark.itemId}`)
    );
  } catch (error) {
    errorMessage.value = error.message;
  }
});
</script>
