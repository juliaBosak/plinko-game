<script setup lang="ts">
import PlinkoCanvas from './PlinkoCanvas.vue';
import RowsSlider from './RowsSlider.vue';
</script>

<template>
  <div class="game-layout">
    <header class="top-bar">
      <span class="brand">Plinko</span>
    </header>

    <div class="body">
      <aside class="sidebar">
        <div class="panel-inner">
          <RowsSlider />
        </div>
      </aside>

      <div class="canvas-area">
        <PlinkoCanvas />
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-layout {
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
  color: var(--text-primary);
  overflow: hidden;
}

/* ── Top bar ──────────────────────────────────────────────────── */
.top-bar {
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  font-weight: 700;
  letter-spacing: 0.04em;
}

.brand {
  font-size: 18px;
  color: var(--text-primary);
}

/* ── Body ─────────────────────────────────────────────────────── */
.body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ── Sidebar (desktop) ────────────────────────────────────────── */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-inner {
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Canvas area — fills remaining space; pegs are centred inside ── */
.canvas-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

/* ── Responsive: tablet (768–1023px) ─────────────────────────── */
@media (max-width: 1023px) and (min-width: 768px) {
  .sidebar {
    width: 240px;
  }
}

/* ── Responsive: mobile (< 768px) ────────────────────────────── */
@media (max-width: 767px) {
  .body {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-top: 1px solid var(--border-subtle);
    order: 2;
  }

  .panel-inner {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 12px;
    gap: 12px;
  }

  .canvas-area {
    order: 1;
    flex: 0 0 auto;
  }
}
</style>
