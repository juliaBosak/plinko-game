<script setup lang="ts">
defineProps<{
  label: string;
  modelValue: number;
  min: number;
  max: number;
  /** CSS color value, e.g. "var(--teal)" or "#7c4dff" */
  color: string;
  /** RGB triplet for the glow, e.g. "0, 200, 160" */
  glowRgb: string;
  disabled?: boolean;
}>();

defineEmits<{
  (e: 'update:modelValue', value: number): void;
}>();

function onInput(e: Event, emit: (e: 'update:modelValue', v: number) => void) {
  const val = parseInt((e.target as HTMLInputElement).value, 10);
  if (!isNaN(val)) emit('update:modelValue', val);
}
</script>

<template>
  <div
    class="range-slider"
    :class="{ disabled }"
    :style="{ '--slider-color': color, '--slider-glow-rgb': glowRgb }"
  >
    <div class="slider-header">
      <span class="label">{{ label }}</span>
      <span class="value">{{ modelValue }}</span>
    </div>

    <input
      type="range"
      :min="min"
      :max="max"
      :step="1"
      :value="modelValue"
      :disabled="disabled"
      class="range"
      @input="onInput($event, $emit)"
    />

    <div class="tick-row">
      <span
        v-for="n in (max - min + 1)"
        :key="n"
        class="tick"
        :style="{ left: `calc(${(n - 1) / (max - min)} * (100% - 16px) + 8px)` }"
      >{{ n + min - 1 }}</span>
    </div>
  </div>
</template>

<style scoped>
.range-slider {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 6px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  min-width: 24px;
  text-align: right;
}

.range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  background: var(--border-default);
  border-radius: var(--radius-pill);
  outline: none;
  cursor: pointer;
  accent-color: var(--slider-color);
  transition: opacity var(--duration-fast);
}

.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: var(--slider-color);
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(var(--slider-glow-rgb), 0.6);
  cursor: pointer;
  transition: box-shadow var(--duration-fast);
}

.range::-webkit-slider-thumb:hover {
  box-shadow: 0 0 10px rgba(var(--slider-glow-rgb), 0.9);
}

.disabled .range {
  opacity: 0.4;
  cursor: not-allowed;
}

.tick-row {
  position: relative;
  height: 14px;
  margin-top: 2px;
}

.tick {
  position: absolute;
  transform: translateX(-50%);
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
