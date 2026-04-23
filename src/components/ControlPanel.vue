<script setup lang="ts">
import BetInput from '@/components/BetInput.vue';
import BallsSlider from '@/components/BallsSlider.vue';
import RowsSlider from '@/components/RowsSlider.vue';
import LastResultBadge from '@/components/LastResultBadge.vue';
import DropButton from '@/components/DropButton.vue';
</script>

<template>
  <div class="panel-inner">
    <BetInput />
    <BallsSlider />
    <RowsSlider />
    <LastResultBadge />
    <DropButton />
  </div>
</template>

<style scoped>
.panel-inner {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}
</style>
