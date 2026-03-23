<template>
  <div class="p-8 pb-12 max-w-7xl mx-auto">
    <!-- Dashboard Header -->
    <div class="flex items-end justify-between mb-8">
      <div>
        <h1 class="font-display text-4xl font-black tracking-tight">
          Kitchen <span class="text-neon-lime">Dashboard</span>
        </h1>
        <p class="text-sm text-dark-muted mt-1">
          Manage incoming orders in real time
        </p>
      </div>
      <div class="flex items-center gap-2 text-sm font-medium text-green-400">
        <div
          class="w-2 h-2 rounded-full bg-green-400 animate-pulse-custom"
        ></div>
        Live
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-4 gap-3 mb-8">
      <StatCard
        label="Total Orders"
        :value="store.orders.length"
        color="accent"
      />
      <StatCard
        label="New"
        :value="getOrderCountByStatus('new')"
        color="accent"
      />
      <StatCard
        label="Preparing"
        :value="getOrderCountByStatus('preparing')"
        color="orange"
      />
      <StatCard
        label="Ready"
        :value="getOrderCountByStatus('ready')"
        color="green"
      />
    </div>

    <!-- Filters -->
    <div class="flex gap-2 mb-6">
      <button
        v-for="status in statuses"
        :key="status"
        @click="activeFilter = status"
        class="px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 text-dark-muted hover:text-dark-text transition-all cursor-pointer"
        :class="{
          'bg-dark-surface2 text-dark-text border-white/20':
            activeFilter === status,
        }"
      >
        {{ capitalize(status) }}
      </button>
    </div>

    <!-- Orders Grid -->
    <div
      v-if="filteredOrders.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <OrderCard
        v-for="order in filteredOrders"
        :key="order.id"
        :order="order"
        @advance="handleAdvanceOrder"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-24 text-dark-muted"
    >
      <div class="text-5xl mb-4 opacity-30">🍳</div>
      <p class="text-sm">
        No orders
        {{ activeFilter !== "all" ? `with status "${activeFilter}"` : "yet" }}
      </p>
      <p class="text-xs opacity-60 mt-1">
        Place an order from the Webshop to see it here
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRestaurantStore } from "../stores/restaurant";
import StatCard from "../components/StatCard.vue";
import OrderCard from "../components/OrderCard.vue";

const store = useRestaurantStore();
const emit = defineEmits(["show-toast"]);

const activeFilter = ref("all");
const statuses = ["all", "new", "preparing", "ready", "done"];

const filteredOrders = computed(() => {
  if (activeFilter.value === "all") {
    return store.orders;
  }
  return store.orders.filter((order) => order.status === activeFilter.value);
});

const getOrderCountByStatus = (status) => {
  return store.orders.filter((order) => order.status === status).length;
};

const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const handleAdvanceOrder = (orderId) => {
  store.advanceOrderStatus(orderId);
  const order = store.orders.find((o) => o.id === orderId);
  if (order) {
    const statusLabels = {
      new: "New",
      preparing: "Preparing",
      ready: "Ready",
      done: "Done",
    };
    emit("show-toast", `${orderId} → ${statusLabels[order.status]}`);
  }
};
</script>
