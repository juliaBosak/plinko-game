<script setup lang="ts">
import TopBar from '@/components/TopBar.vue';
import ControlPanel from '@/components/ControlPanel.vue';
import PlinkoCanvas from '@/components/PlinkoCanvas.vue';
</script>

<template>
  <div class="game-layout">
    <TopBar />

    <div class="body">
      <aside class="sidebar">
        <ControlPanel />
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
}

/* ── Body ─────────────────────────────────────────── */
.body {
  flex: 1;
  display: flex;
}

/* ── Sidebar (desktop) ────────────────────────────── */
.sidebar {
  width: 280px;
  flex-shrink: 0;
  background: var(--bg-surface);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

/* ── Canvas area ──────────────────────────────────── */
.canvas-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

/* ── Responsive: tablet (768–1023px) ─────────────── */
@media (max-width: 1023px) and (min-width: 768px) {
  .sidebar {
    width: 240px;
  }
}

/* ── Responsive: mobile (< 768px) ────────────────── */
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

  .canvas-area {
    order: 1;
    flex: 0 0 auto;
  }
}

/* ── Mobile compact < 480px — single-column panel ── */
@media (max-width: 479px) {
  .sidebar {
    overflow-y: visible;
  }
}
</style>
