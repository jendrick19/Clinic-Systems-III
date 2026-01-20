<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="handleCancel">
    <div class="modal-container">
      <!-- Header -->
      <div class="modal-header">
        <div>
          <h2>📅 Selecciona tu horario</h2>
          <p class="subtitle">{{ specialty }} - {{ professionalName }}</p>
        </div>
        <button class="close-btn" @click="handleCancel" aria-label="Cerrar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Time Slots Grid -->
      <div class="modal-body">
        <div v-for="block in timeBlocks" :key="block.label" class="time-block">
          <h3 class="block-label">
            <span class="icon">{{ block.icon }}</span>
            {{ block.label }}
          </h3>
          <div class="slots-grid">
            <button
              v-for="slot in block.slots"
              :key="slot.index"
              class="slot-btn"
              :class="{ 'selected': selectedSlot?.index === slot.index }"
              @click="selectSlot(slot)"
            >
              <span class="slot-number">{{ slot.index }}</span>
              <span class="slot-time">{{ slot.time }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="modal-footer">
        <button class="btn-cancel" @click="handleCancel">
          Cancelar
        </button>
        <button 
          class="btn-confirm" 
          :disabled="!selectedSlot"
          @click="handleConfirm"
        >
          <svg v-if="!selectedSlot" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v20M2 12h20"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          {{ selectedSlot ? `Confirmar ${selectedSlot.time}` : 'Selecciona un horario' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  slots: Array,
  specialty: String,
  professionalName: String,
  dateRange: String
});

const emit = defineEmits(['confirm', 'cancel', 'close']);

const selectedSlot = ref(null);

// Agrupar slots por bloques de tiempo
const timeBlocks = computed(() => {
  if (!props.slots || props.slots.length === 0) return [];

  const blocks = {
    morning: { label: 'Mañana', icon: '🌅', slots: [] },
    afternoon: { label: 'Tarde', icon: '☀️', slots: [] },
    evening: { label: 'Noche', icon: '🌙', slots: [] }
  };

  props.slots.forEach((slot, index) => {
    const hour = parseInt(slot.time.split(':')[0]);
    const isPM = slot.time.includes('PM');
    const hour24 = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);

    const slotData = {
      ...slot,
      index: index + 1
    };

    if (hour24 < 12) {
      blocks.morning.slots.push(slotData);
    } else if (hour24 < 18) {
      blocks.afternoon.slots.push(slotData);
    } else {
      blocks.evening.slots.push(slotData);
    }
  });

  // Filtrar bloques vacíos
  return Object.values(blocks).filter(block => block.slots.length > 0);
});

const selectSlot = (slot) => {
  selectedSlot.value = slot;
};

const handleConfirm = () => {
  if (selectedSlot.value) {
    emit('confirm', selectedSlot.value);
    selectedSlot.value = null;
  }
};

const handleCancel = () => {
  selectedSlot.value = null;
  emit('cancel');
  emit('close');
};

// Reset selection when modal closes
watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    selectedSlot.value = null;
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 700px;
  width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  padding: 24px 28px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.modal-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
}

.subtitle {
  margin: 6px 0 0 0;
  font-size: 20px;
  color: #06b6d4;
  font-weight: 600;
}

.close-btn {
  background: #f3f4f6;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #111827;
}

.modal-body {
  padding: 20px 28px;
  overflow-y: auto;
  flex: 1;
}

.time-block {
  margin-bottom: 28px;
}

.time-block:last-child {
  margin-bottom: 0;
}

.block-label {
  margin: 0 0 14px 0;
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon {
  font-size: 20px;
}

.slots-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
}

.slot-btn {
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-family: inherit;
}

.slot-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.slot-btn.selected {
  background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%);
  border-color: #06b6d4;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(6, 182, 212, 0.4);
}

.slot-number {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.7;
}

.slot-btn.selected .slot-number {
  opacity: 0.9;
}

.slot-time {
  font-size: 15px;
  font-weight: 600;
}

.modal-footer {
  padding: 20px 28px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel,
.btn-confirm {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel {
  background: #f3f4f6;
  color: #6b7280;
}

.btn-cancel:hover {
  background: #e5e7eb;
  color: #374151;
}

.btn-confirm {
  background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
}

.btn-confirm:hover:not(:disabled) {
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
  transform: translateY(-1px);
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Scrollbar personalizado */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 10px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-container {
    width: 95%;
    max-height: 90vh;
  }

  .slots-grid {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 8px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
}
</style>
