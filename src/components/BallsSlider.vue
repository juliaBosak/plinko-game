<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePlinkoStore } from '@/stores/plinkoStore';
import { isIdleGameState } from '@/types/plinko';
import { BALLS_MIN, BALLS_MAX } from '@/constants/layout';
import RangeSlider from '@/components/RangeSlider.vue';

const store = usePlinkoStore();
const { ballsPerDrop, gameState } = storeToRefs(store);

const isDisabled = computed(() => !isIdleGameState(gameState.value));
</script>

<template>
  <RangeSlider
    label="Balls"
    :model-value="ballsPerDrop"
    :min="BALLS_MIN"
    :max="BALLS_MAX"
    color="var(--teal)"
    glow-rgb="0, 200, 160"
    :disabled="isDisabled"
    @update:model-value="store.setBallsPerDrop($event)"
  />
</template>
