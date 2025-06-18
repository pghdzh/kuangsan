<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { onMounted } from 'vue'
onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://unpkg.com/live2d-widget@3.1.4/lib/L2Dwidget.min.js'
  script.onload = () => {
    // @ts-ignore 忽略未声明全局变量
    L2Dwidget.init({
      model: {
        jsonPath: '/live2d/kurumi/model.json',
      },
      display: {
        position: 'right', // 可选 left/right
        width: 220,
        height: 400,
      },
      mobile: true,
      react: {
        opacityDefault: 1,
        opacityOnHover: 0.2,
      },
    })
  }
  document.body.appendChild(script)
})
</script>

<template>
  <div id="app">
    <AppHeader />

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
#app {
  position: relative;
  min-height: 100vh;
}

@media screen and (max-width: 768px) {
  #live2dcanvas {
    display: none !important;
  }
}
</style>
