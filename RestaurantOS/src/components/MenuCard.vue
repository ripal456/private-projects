<template>
  <div
    class="bg-dark-surface border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all hover:translate-y-[-2px] cursor-pointer group"
  >
    <!-- Image -->
    <div
      class="h-36 bg-dark-surface2 flex items-center justify-center text-5xl relative overflow-hidden"
    >
      <img
        v-if="item.imageUrl"
        :src="item.imageUrl"
        :alt="item.name"
        class="w-full h-full object-cover"
      />
      <span v-else>{{ item.emoji }}</span>
      <span
        v-if="item.badge"
        class="absolute top-2.5 right-2.5 bg-neon-lime text-dark-bg text-xs font-bold px-2 py-1 rounded font-display tracking-wider"
      >
        {{ item.badge }}
      </span>
    </div>

    <!-- Body -->
    <div class="p-3.5">
      <div class="font-display font-semibold text-base mb-1">
        {{ item.name }}
      </div>
      <p class="text-xs text-dark-muted line-clamp-2 mb-3">{{ item.desc }}</p>

      <!-- Footer -->
      <div class="flex items-center justify-between">
        <span class="font-display font-black text-lg text-neon-lime"
          >€{{ item.price.toFixed(2) }}</span
        >
        <button
          @click.stop="emit('add', item)"
          class="w-8 h-8 rounded-lg bg-neon-orange text-white flex items-center justify-center text-xl font-light hover:bg-orange-600 hover:scale-108 active:scale-95 transition-all"
        >
          +
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["add"]);
</script>
