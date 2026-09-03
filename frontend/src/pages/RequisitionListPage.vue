<template>
  <section>
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/" class="back-btn" title="Back to Dashboard">&#8592;</RouterLink>
        <div>
          <h2>Purchase Requisitions</h2>
          <p class="muted">All purchase requisition records</p>
        </div>
      </div>
      <RouterLink class="btn btn-outline" to="/requisitions/new">+ New PR</RouterLink>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="card-panel">
      <table>
        <thead>
          <tr>
            <th>PR Number</th>
            <th>Requester</th>
            <th>Department</th>
            <th>Title</th>
            <th>Status</th>
            <th>Needed By</th>
            <th>Bookmark</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td><RouterLink :to="`/requisitions/${item.id}`">{{ item.prNumber }}</RouterLink></td>
            <td>{{ item.requesterName }}</td>
            <td>{{ item.departmentName }}</td>
            <td>{{ item.title }}</td>
            <td>
              <span class="status-badge" :class="item.status.toLowerCase()">{{ item.status }}</span>
            </td>
            <td>{{ item.neededByDate || '-' }}</td>
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
  return `PR:${itemId}`;
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
      await api.removeBookmark('PR', itemId);
      setBookmarked(itemId, false);
    } else {
      await api.addBookmark({ itemType: 'PR', itemId });
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
    const [requisitionsPayload, bookmarksPayload] = await Promise.all([
      api.listRequisitions(),
      api.listBookmarks(),
    ]);
    items.value = requisitionsPayload.items;
    bookmarkKeys.value = new Set(
      (bookmarksPayload.items || []).map((bookmark) => `${bookmark.itemType}:${bookmark.itemId}`)
    );
  } catch (error) {
    errorMessage.value = error.message;
  }
});
</script>
