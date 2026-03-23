<template>
  <div class="flex gap-3 py-3 border-b border-white/10">
    <div
      class="w-12 h-12 bg-dark-surface2 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden"
    >
      <img
        v-if="item.imageUrl"
        :src="item.imageUrl"
        :alt="item.name"
        class="w-full h-full object-cover"
      />
      <span v-else>{{ item.emoji }}</span>
    </div>

    <div class="flex-1">
      <div class="text-sm font-medium mb-2">{{ item.name }}</div>
      <div class="flex items-center gap-2.5">
        <button
          @click="emit('decrease')"
          class="w-6 h-6 rounded border border-white/10 bg-dark-surface2 text-sm flex items-center justify-center hover:bg-neon-lime hover:text-dark-bg hover:border-neon-lime transition-all"
        >
          −
        </button>
        <span class="text-sm font-medium min-w-6 text-center">{{
          item.qty
        }}</span>
        <button
          @click="emit('increase')"
          class="w-6 h-6 rounded border border-white/10 bg-dark-surface2 text-sm flex items-center justify-center hover:bg-neon-lime hover:text-dark-bg hover:border-neon-lime transition-all"
        >
          +
        </button>
      </div>
    </div>

    <div class="font-display text-sm font-semibold text-neon-lime self-center">
      €{{ (item.price * item.qty).toFixed(2) }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["increase", "decrease"]);
</script>
