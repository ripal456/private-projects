<template>
  <div
    class="bg-dark-surface border border-white/10 rounded-2xl p-5 animate-slide-in hover:border-white/20 transition-all"
  >
    <!-- Header -->
    <div class="flex justify-between items-start mb-3.5">
      <div>
        <div class="font-display font-bold text-base">{{ order.id }}</div>
        <div class="text-xs text-dark-muted mt-0.5">{{ order.time }}</div>
      </div>
      <span
        class="text-xs font-bold px-2.5 py-1 rounded border font-display uppercase tracking-wider"
        :class="getStatusStyles(order.status)"
      >
        {{ getStatusLabel(order.status) }}
      </span>
    </div>

    <!-- Items List -->
    <div class="mb-3.5 space-y-2">
      <div
        v-for="item in order.items"
        :key="item.name"
        class="flex gap-2 items-start text-xs text-dark-muted"
      >
        <div
          v-if="item.imageUrl"
          class="w-8 h-8 bg-dark-surface2 rounded flex-shrink-0 overflow-hidden"
        >
          <img
            :src="item.imageUrl"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="flex-1">
          <span class="text-dark-text block"
            >{{ item.qty }}× {{ item.name }}</span
          >
          <span class="text-dark-muted text-xs"
            >€{{ (item.price * item.qty).toFixed(2) }}</span
          >
        </div>
      </div>
    </div>

    <!-- Total -->
    <div class="font-display text-xl font-black text-neon-lime mb-3.5">
      €{{ order.total.toFixed(2) }}
    </div>

    <!-- Progress Bar -->
    <div class="h-1 bg-dark-surface2 rounded-full mb-4 overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500"
        :style="{
          width: getProgress(order.status) + '%',
          backgroundColor: getProgressColor(order.status),
        }"
      ></div>
    </div>

    <!-- Action Button -->
    <button
      @click="emit('advance', order.id)"
      :disabled="!canAdvance(order.status)"
      class="w-full py-2.5 rounded-lg border border-white/10 bg-dark-surface2 text-sm font-medium transition-all hover:enabled:border-neon-lime hover:enabled:text-neon-lime hover:enabled:bg-dark-bg disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {{ getButtonLabel(order.status) }}
    </button>
  </div>
</template>

<script setup>
import { STATUS_CONFIG, STATUS_FLOW, ADVANCE_LABELS } from "../data/menu";

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["advance"]);

const getStatusLabel = (status) => STATUS_CONFIG[status].label;
const getProgress = (status) => STATUS_CONFIG[status].progress;
const getProgressColor = (status) => STATUS_CONFIG[status].color;

const getStatusStyles = (status) => {
  const baseStyles =
    "px-2.5 py-1 rounded border font-display uppercase tracking-wider text-xs font-bold";
  if (status === "new")
    return baseStyles + " bg-yellow-500/15 text-neon-lime border-yellow-500/30";
  if (status === "preparing")
    return (
      baseStyles + " bg-orange-500/15 text-neon-orange border-orange-500/30"
    );
  if (status === "ready")
    return baseStyles + " bg-green-500/15 text-green-400 border-green-500/30";
  if (status === "done")
    return baseStyles + " bg-white/10 text-dark-muted border-white/20";
};

const canAdvance = (status) => {
  return ADVANCE_LABELS[status] !== null;
};

const getButtonLabel = (status) => {
  return ADVANCE_LABELS[status] || "Completed ✓";
};
</script>
