<script setup lang="ts">
import { computed } from 'vue';
import { usePlinkoStore } from '@/stores/plinkoStore';
import { isIdleGameState } from '@/types/plinko';
import { ROWS_MIN, ROWS_MAX } from '@/constants/layout';
import RangeSlider from '@/components/RangeSlider.vue';

const store = usePlinkoStore();

const isDisabled = computed(() => !isIdleGameState(store.gameState));
</script>

<template>
  <RangeSlider
    label="Rows"
    :model-value="store.rows"
    :min="ROWS_MIN"
    :max="ROWS_MAX"
    color="var(--purple)"
    glow-rgb="124, 77, 255"
    :disabled="isDisabled"
    @update:model-value="store.setRows($event)"
  />
</template>
