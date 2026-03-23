<template>
  <div class="bg-dark-bg text-dark-text min-h-screen font-body">
    <!-- Navigation -->
    <nav
      class="bg-dark-surface border-b border-white/10 sticky top-0 z-100 flex items-center justify-between px-8 h-16"
    >
      <div class="font-display font-bold text-lg tracking-tighter">
        Restaurant<span class="text-neon-lime">OS</span>
      </div>

      <div class="flex gap-1">
        <router-link
          to="/"
          class="nav-tab"
          :class="{ active: $route.path === '/' }"
        >
          Webshop
        </router-link>
        <router-link
          to="/dashboard"
          class="nav-tab"
          :class="{ active: $route.path === '/dashboard' }"
        >
          Kitchen Dashboard
        </router-link>
      </div>

      <button
        @click="$router.push('/')"
        class="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-surface2 border border-white/10 text-sm font-medium hover:border-neon-lime hover:text-neon-lime transition-all"
      >
        <span>🛒</span>
        <span>Cart</span>
        <span
          v-if="store.cartItemCount > 0"
          class="flex items-center justify-center w-5 h-5 rounded-full bg-neon-lime text-dark-bg text-xs font-bold font-display"
        >
          {{ store.cartItemCount }}
        </span>
      </button>
    </nav>

    <!-- Toast Notification -->
    <Teleport to="body">
      <transition
        enter-active-class="transition-transform duration-300 ease-out"
        leave-active-class="transition-transform duration-300 ease-in"
        enter-from-class="translate-y-24"
        enter-to-class="translate-y-0"
        leave-from-class="translate-y-0"
        leave-to-class="translate-y-24"
      >
        <div
          v-if="toastMessage"
          class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-dark-surface2 border border-neon-lime text-dark-text px-6 py-3 rounded-xl text-sm font-medium pointer-events-none"
        >
          {{ toastMessage }}
        </div>
      </transition>
    </Teleport>

    <!-- Main Views -->
    <router-view v-slot="{ Component }">
      <component :is="Component" @show-toast="showToast" />
    </router-view>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRestaurantStore } from "./stores/restaurant";

const store = useRestaurantStore();
const toastMessage = ref("");

const showToast = (message) => {
  toastMessage.value = message;
  setTimeout(() => {
    toastMessage.value = "";
  }, 2200);
};

defineExpose({ showToast });
</script>

<style scoped>
.nav-tab {
  @apply px-4 py-1.5 rounded-lg text-sm font-medium text-dark-muted hover:text-dark-text hover:bg-dark-surface2 transition-all cursor-pointer inline-block;
}

.nav-tab.active {
  @apply bg-neon-lime text-dark-bg;
}
</style>
