<template>
  <section>
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/" class="back-btn" title="Back to Dashboard">&#8592;</RouterLink>
        <div>
          <h2>Bookmarks</h2>
          <p class="muted">Saved PR, PO, and GR items</p>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <div class="card-panel">
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Number</th>
            <th>Title</th>
            <th>Status</th>
            <th>Saved</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="`${item.itemType}:${item.itemId}`">
            <td>{{ item.itemType }}</td>
            <td>{{ item.documentNumber || '-' }}</td>
            <td>{{ item.title || item.secondaryText || '-' }}</td>
            <td>
              <span class="status-badge" :class="item.status ? item.status.toLowerCase() : ''">{{ item.status || '-' }}</span>
            </td>
            <td>{{ item.createdAt ? new Date(item.createdAt).toLocaleString() : '-' }}</td>
            <td>
              <RouterLink v-if="item.itemType === 'PR'" :to="`/requisitions/${item.itemId}`">Open</RouterLink>
              <RouterLink v-else-if="item.itemType === 'PO'" :to="`/purchase-orders/${item.itemId}`">Open</RouterLink>
              <RouterLink v-else to="/goods-receipts">Open</RouterLink>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="6" class="muted">No bookmarks yet.</td>
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

onMounted(async () => {
  try {
    const payload = await api.listBookmarks();
    items.value = payload.items || [];
  } catch (error) {
    errorMessage.value = error.message;
  }
});
</script>
