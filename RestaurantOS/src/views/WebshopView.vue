<template>
  <div class="flex h-[calc(100vh-64px)]">
    <!-- Menu Area -->
    <div class="flex-1 overflow-y-auto px-8 py-8">
      <!-- Hero Section -->
      <div class="mb-8">
        <h1
          class="font-display text-5xl font-black tracking-tight leading-tight mb-2"
        >
          Fresh from the<br /><span class="text-neon-lime">kitchen.</span>
        </h1>
        <p class="text-dark-muted text-sm">
          Order directly — your food, your way.
        </p>
      </div>

      <!-- Category Filters -->
      <div class="flex gap-2 mb-8 flex-wrap">
        <button
          v-for="category in categories"
          :key="category"
          @click="activeCategory = category"
          class="px-4 py-2 rounded-full text-xs font-medium border border-white/10 bg-dark-surface2 text-dark-muted hover:text-dark-text transition-all cursor-pointer"
          :class="{
            'bg-neon-lime text-dark-bg border-neon-lime':
              activeCategory === category,
          }"
        >
          {{ category }}
        </button>
      </div>

      <!-- Menu Sections -->
      <div
        v-if="store.isLoadingMenu"
        class="flex items-center justify-center py-20"
      >
        <div class="text-center">
          <div class="text-5xl mb-4 animate-bounce">🍳</div>
          <p class="text-dark-muted">Loading menu from kitchen...</p>
        </div>
      </div>

      <div v-else>
        <!-- Show All Items with Category Headers -->
        <div v-if="activeCategory === 'All'">
          <div v-for="category in allCategories" :key="category" class="mb-14">
            <!-- Category Header -->
            <div class="flex items-center gap-3 mb-6">
              <h2 class="text-2xl font-bold text-neon-lime font-display">
                {{ category }}
              </h2>
              <span
                class="text-xs text-dark-muted bg-dark-surface2 px-3 py-1 rounded-full"
              >
                {{ itemsByCategory[category].length }} items
              </span>
            </div>

            <!-- Items Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MenuCard
                v-for="item in itemsByCategory[category]"
                :key="item.id"
                :item="item"
                @add="handleAddItem"
              />
            </div>
          </div>
        </div>

        <!-- Show Filtered Category Items -->
        <div v-else>
          <div class="mb-6">
            <div class="flex items-center gap-3 mb-6">
              <h2 class="text-2xl font-bold text-neon-lime font-display">
                {{ activeCategory }}
              </h2>
              <span
                class="text-xs text-dark-muted bg-dark-surface2 px-3 py-1 rounded-full"
              >
                {{ filteredCategoryItems.length }} items
              </span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MenuCard
              v-for="item in filteredCategoryItems"
              :key="item.id"
              :item="item"
              @add="handleAddItem"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Cart Sidebar -->
    <div class="w-96 bg-dark-surface border-l border-white/10 flex flex-col">
      <!-- Cart Header -->
      <div class="px-6 py-6 border-b border-white/10">
        <h2 class="font-display font-bold text-lg">Your Order</h2>
        <p class="text-xs text-dark-muted mt-1">
          {{
            store.cartItemCount === 0
              ? "Nothing added yet"
              : `${store.cartItemCount} item${store.cartItemCount > 1 ? "s" : ""} selected`
          }}
        </p>
      </div>

      <!-- Cart Items -->
      <div class="flex-1 overflow-y-auto px-6 py-4">
        <div
          v-if="store.cart.length === 0"
          class="flex flex-col items-center justify-center h-full gap-3 text-dark-muted"
        >
          <div class="text-4xl opacity-40">🍽️</div>
          <p class="text-sm">Your cart is empty</p>
        </div>

        <div v-else class="space-y-4">
          <CartItem
            v-for="item in store.cart"
            :key="item.id"
            :item="item"
            @increase="store.updateCartQty(item.id, 1)"
            @decrease="store.updateCartQty(item.id, -1)"
          />
        </div>
      </div>

      <!-- Cart Footer -->
      <div class="px-6 py-4 border-t border-white/10 space-y-4">
        <div class="flex justify-between items-baseline">
          <span class="text-sm text-dark-muted">Total</span>
          <span class="font-display text-3xl font-black text-neon-lime"
            >€{{ store.cartTotal.toFixed(2) }}</span
          >
        </div>
        <button
          @click="handlePlaceOrder"
          :disabled="store.cartItemCount === 0"
          class="w-full py-3 rounded-xl bg-neon-lime text-dark-bg font-display font-bold text-sm tracking-wide transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:bg-yellow-300 hover:enabled:translate-y-[-1px] active:enabled:translate-y-0"
        >
          Place Order →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRestaurantStore } from "../stores/restaurant";
import MenuCard from "../components/MenuCard.vue";
import CartItem from "../components/CartItem.vue";

const store = useRestaurantStore();
const emit = defineEmits(["show-toast"]);

const activeCategory = ref("All");

// Load menu on component mount
onMounted(() => {
  store.loadMenu();
});

const categories = computed(() => {
  const cats = new Set(store.menu.map((item) => item.category));
  return ["All", ...Array.from(cats).sort()];
});

// Get all unique categories (sorted)
const allCategories = computed(() => {
  const cats = new Set(store.menu.map((item) => item.category));
  return Array.from(cats).sort();
});

// Group items by category
const itemsByCategory = computed(() => {
  const grouped = {};
  store.menu.forEach((item) => {
    if (!grouped[item.category]) {
      grouped[item.category] = [];
    }
    grouped[item.category].push(item);
  });
  return grouped;
});

// Get items for filtered category
const filteredCategoryItems = computed(() => {
  if (activeCategory.value === "All") {
    return store.menu;
  }
  return store.menu.filter((item) => item.category === activeCategory.value);
});

const groupedMenu = computed(() => {
  const filtered =
    activeCategory.value === "All"
      ? store.menu
      : store.menu.filter((item) => item.category === activeCategory.value);

  const grouped = {};
  filtered.forEach((item) => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });
  return grouped;
});

const handleAddItem = (item) => {
  store.addToCart(item.id);
  emit("show-toast", `${item.emoji} ${item.name} added`);
};

const handlePlaceOrder = () => {
  const order = store.placeOrder();
  if (order) {
    emit("show-toast", "Order placed! Check the kitchen dashboard ✓");
  }
};
</script>
