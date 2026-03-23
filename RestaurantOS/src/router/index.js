import { createRouter, createWebHistory } from "vue-router";
import WebshopView from "../views/WebshopView.vue";
import DashboardView from "../views/DashboardView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "webshop",
      component: WebshopView,
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: DashboardView,
    },
  ],
});

export default router;
