<template>
  <section>
    <div class="page-header">
      <div class="page-header-left">
        <RouterLink to="/purchase-orders" class="back-btn" title="Back to list">&#8592;</RouterLink>
        <div>
          <h2>Create Purchase Order</h2>
          <p class="muted">Create PO from approved purchase requisition open lines</p>
        </div>
      </div>
    </div>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>

    <form @submit.prevent="handleSubmit">
      <div class="card-panel">
        <p class="form-section-title">PO Header</p>
        <div class="form-row">
          <div class="form-group">
            <label>Vendor Name</label>
            <input v-model="vendorName" name="vendorName" aria-label="Vendor Name" placeholder="Type..." required />
          </div>
          <div class="form-group">
            <label>Approved Requisition</label>
            <select
              v-model="selectedRequisitionId"
              name="requisitionId"
              aria-label="Approved Requisition"
              @change="loadOpenLines"
              :disabled="approvedRequisitions.length === 0"
            >
              <option value="">Select requisition</option>
              <option v-for="item in approvedRequisitions" :key="item.id" :value="item.id">
                {{ item.prNumber }} - {{ item.title }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <div class="card-panel">
        <div class="card-panel-header">
          <p class="form-section-title" style="margin:0">PO Lines</p>
          <span class="muted">{{ requisitionLabel }}</span>
        </div>

        <p v-if="approvedRequisitions.length === 0" class="muted">No approved requisitions available.</p>
        <p v-else-if="!selectedRequisitionId" class="muted">Select an approved requisition to load open lines.</p>
        <p v-else-if="lines.length === 0" class="muted">No open lines available for this requisition.</p>
        <table v-else>
          <thead>
            <tr>
              <th style="width:50px">Line</th>
              <th>Item Code</th>
              <th>Item Name</th>
              <th style="width:110px">Open Qty</th>
              <th style="width:110px">Allocate Qty</th>
              <th style="width:90px">UOM</th>
              <th style="width:140px">Unit Price</th>
              <th>Site</th>
              <th>Required Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, index) in lines" :key="line.id">
              <td>{{ line.lineNo }}</td>
              <td>{{ line.itemCode }}</td>
              <td>{{ line.itemName }}</td>
              <td>{{ line.qtyOpenForPo }}</td>
              <td>
                <input
                  v-model.number="line.qtyOrdered"
                  :name="`qtyOrdered-${index}`"
                  :aria-label="`Allocate quantity line ${line.lineNo}`"
                  type="number"
                  min="0"
                  :max="line.qtyOpenForPo"
                  step="0.01"
                />
              </td>
              <td>{{ line.uom }}</td>
              <td>
                <input
                  v-model.number="line.unitPrice"
                  :name="`unitPrice-${index}`"
                  :aria-label="`Unit price line ${line.lineNo}`"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </td>
              <td>{{ line.siteCode }}</td>
              <td>{{ line.requiredDate || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="btn-group">
        <RouterLink to="/purchase-orders" class="btn btn-outline">Cancel</RouterLink>
        <button class="btn btn-primary" type="submit">Save As Draft</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { api } from '../api';

const route = useRoute();
const router = useRouter();
const approvedRequisitions = ref([]);
const selectedRequisitionId = ref('');
const requisitionLabel = ref('No requisition selected');
const vendorName = ref('');
const lines = ref([]);
const errorMessage = ref('');

function buildEditableLine(line) {
  return {
    ...line,
    qtyOrdered: 0,
    unitPrice: line.estUnitPrice,
  };
}

async function loadOpenLines() {
  errorMessage.value = '';
  lines.value = [];
  requisitionLabel.value = 'No requisition selected';

  if (!selectedRequisitionId.value) {
    return;
  }

  try {
    const payload = await api.getRequisitionOpenLines(selectedRequisitionId.value);
    requisitionLabel.value = payload.requisition.prNumber;
    lines.value = payload.openLines.map(buildEditableLine);
  } catch (error) {
    errorMessage.value = error.message;
  }
}

async function loadApprovedRequisitions() {
  const payload = await api.listRequisitions();
  approvedRequisitions.value = payload.items.filter((item) => item.status === 'APPROVED');

  const requestedId = route.query.requisitionId;
  if (typeof requestedId === 'string' && approvedRequisitions.value.some((item) => item.id === requestedId)) {
    selectedRequisitionId.value = requestedId;
  } else if (approvedRequisitions.value.length === 1) {
    selectedRequisitionId.value = approvedRequisitions.value[0].id;
  }

  if (selectedRequisitionId.value) {
    await loadOpenLines();
  }
}

async function handleSubmit() {
  errorMessage.value = '';

  const selectedLines = lines.value.filter((line) => Number(line.qtyOrdered) > 0);
  if (selectedLines.length === 0) {
    errorMessage.value = 'Enter qty greater than 0 for at least one line';
    return;
  }

  try {
    const created = await api.createPurchaseOrder({
      vendorName: vendorName.value,
      lines: selectedLines.map((line) => ({
        prLineId: line.id,
        itemCode: line.itemCode,
        itemName: line.itemName,
        qtyOrdered: Number(line.qtyOrdered),
        unitPrice: Number(line.unitPrice || 0),
        uom: line.uom,
        siteCode: line.siteCode,
        requiredDate: line.requiredDate,
      })),
    });

    await router.push(`/purchase-orders/${created.id}`);
  } catch (error) {
    errorMessage.value = error.message;
  }
}

onMounted(async () => {
  errorMessage.value = '';
  try {
    await loadApprovedRequisitions();
  } catch (error) {
    errorMessage.value = error.message;
  }
});
</script>

<style scoped>
.card-panel table input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-input);
  font-family: inherit;
  font-size: 13px;
}
.card-panel table input:focus {
  border-color: var(--primary);
  outline: none;
}
</style>
