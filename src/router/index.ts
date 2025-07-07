import { createRouter, createWebHashHistory } from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
NProgress.configure({ showSpinner: false }); // NProgress Configuration 刷新页面头部进度条

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/views/homeView/index.vue"),
    },

    {
      path: "/overview",
      component: () => import("@/views/overView/index.vue"),
    },

    {
      path: "/gallery",
      component: () => import("@/views/galleryView/index.vue"),
    },

    {
      path: "/timeline",
      component: () => import("@/views/timelineView/index.vue"),
    },
    {
      path: "/board",
      component: () => import("@/views/boardView/index.vue"),
    },
    {
      path: "/talk",
      component: () => import("@/views/talkView/index.vue"),
    },
    {
      path: "/bookshelf",
      component: () => import("@/views/bookshelfView/index.vue"),
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;
