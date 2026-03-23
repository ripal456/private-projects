<template>
  <div class="bg-dark-surface border border-white/10 rounded-2xl p-5">
    <div
      class="text-xs uppercase tracking-wider text-dark-muted font-semibold mb-2"
    >
      {{ label }}
    </div>
    <div
      class="font-display text-3xl font-black"
      :class="{
        'text-neon-lime': color === 'accent',
        'text-neon-orange': color === 'orange',
        'text-green-400': color === 'green',
      }"
    >
      {{ value }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: Number,
    required: true,
  },
  color: {
    type: String,
    default: "accent",
  },
});
</script>
