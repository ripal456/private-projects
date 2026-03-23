import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { MENU } from "../data/menu";
import { loadCompleteMenu } from "../services/foodAPI";

export const useRestaurantStore = defineStore("restaurant", () => {
  const cart = ref([]);
  const orders = ref([]);
  const menu = ref([]);
  const isLoadingMenu = ref(false);
  let orderCounter = ref(1000);

  const cartItemCount = computed(() =>
    cart.value.reduce((sum, item) => sum + item.qty, 0),
  );
  const cartTotal = computed(() =>
    cart.value.reduce((sum, item) => sum + item.price * item.qty, 0),
  );

  function addToCart(menuItemId) {
    const menuItem = menu.value.find((m) => m.id === menuItemId);
    if (!menuItem) return;

    const existingItem = cart.value.find((c) => c.id === menuItemId);
    if (existingItem) {
      existingItem.qty++;
    } else {
      cart.value.push({
        ...menuItem,
        qty: 1,
      });
    }
  }

  function updateCartQty(menuItemId, delta) {
    const item = cart.value.find((c) => c.id === menuItemId);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      cart.value = cart.value.filter((c) => c.id !== menuItemId);
    }
  }

  function clearCart() {
    cart.value = [];
  }

  function placeOrder() {
    if (cart.value.length === 0) return null;

    orderCounter.value++;
    const order = {
      id: `${orderCounter.value}`,
      items: cart.value.map((item) => ({
        name: item.name,
        emoji: item.emoji,
        imageUrl: item.imageUrl,
        qty: item.qty,
        price: item.price,
      })),
      total: cartTotal.value,
      status: "new",
      time: new Date().toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      placedAt: Date.now(),
    };

    orders.value.unshift(order);
    clearCart();
    return order;
  }

  function advanceOrderStatus(orderId) {
    const order = orders.value.find((o) => o.id === orderId);
    if (!order) return;

    const statusFlow = ["new", "preparing", "ready", "done"];
    const currentIndex = statusFlow.indexOf(order.status);
    if (currentIndex < statusFlow.length - 1) {
      order.status = statusFlow[currentIndex + 1];
    }
  }

  async function loadMenu() {
    isLoadingMenu.value = true;
    try {
      // Try to load from external API
      const apiMenu = await loadCompleteMenu();
      if (apiMenu.length > 0) {
        menu.value = apiMenu;
      } else {
        // Fallback to mock data if API fails
        menu.value = MENU;
      }
    } catch (error) {
      console.error("Failed to load menu from API:", error);
      // Fallback to mock data
      menu.value = MENU;
    } finally {
      isLoadingMenu.value = false;
    }
  }

  return {
    cart,
    orders,
    menu,
    isLoadingMenu,
    cartItemCount,
    cartTotal,
    addToCart,
    updateCartQty,
    clearCart,
    placeOrder,
    advanceOrderStatus,
    loadMenu,
  };
});
