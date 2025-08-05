<script setup lang="ts">
import { RouterView } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { ref, onMounted } from 'vue'
const welcomeText = '欢迎来到时崎狂三的世界'.split('')
const showIntro = ref(true)
const bgImage = ref('')

// 1. 批量导入图片资源
const pcImages = Object.values(import.meta.glob('@/assets/images/*.{jpg,png,jpeg,webp}', { eager: true, import: 'default' }))
const mobileImages = Object.values(import.meta.glob('@/assets/images2/*.{jpg,png,jpeg,webp}', { eager: true, import: 'default' }))
onMounted(() => {

  const isMobile = window.innerWidth <= 768
  const imageList = isMobile ? mobileImages : pcImages

  // 2. 随机选择一张图片
  const randomIndex = Math.floor(Math.random() * imageList.length)
  bgImage.value = imageList[randomIndex]

  // 3. 3秒后自动结束
  setTimeout(() => {
    showIntro.value = false
  }, 3000)

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
    <transition name="fade" v-if="showIntro">
      <div class="intro" @click="showIntro = false">
        <img :src="bgImage" alt="Kurumi" class="intro-bg" />
        <div class="intro-text">
          <span v-for="(char, index) in welcomeText" :key="index" class="intro-char"
            :style="{ animationDelay: `${index * 0.1}s` }">
            {{ char }}
          </span>
        </div>
      </div>
    </transition>
    <div v-else>
      <AppHeader />
      <main class="main-content">
        <RouterView />
      </main>
    </div>
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

.intro {
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow: hidden;
  cursor: pointer;
}

.intro-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: brightness(0.4) contrast(1.1);
}

.intro-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.9));
  z-index: 1;
}

.intro-text {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  gap: 0.25em;
  flex-wrap: wrap;
  font-size: 2.8rem;
  font-family: 'Times New Roman', serif;
  font-weight: bold;
  color: #ff4d6d;
  text-shadow:
    0 0 8px #ff1a3c,
    0 0 12px #900020,
    2px 2px 6px rgba(0, 0, 0, 0.8);
  letter-spacing: 0.1em;
  text-align: center;
  padding: 0 2rem;
  animation: glow-pulse 2.5s ease-in-out infinite alternate;
}

/* 打字动画：逐字显现 */
.intro-char {
  opacity: 0;
  animation: typeIn 0.5s ease-out forwards;
}

@keyframes typeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 整体发光律动 */
@keyframes glow-pulse {
  0% {
    text-shadow:
      0 0 6px #ff4d6d,
      0 0 12px #ff4d6d,
      2px 2px 6px rgba(0, 0, 0, 0.8);
  }

  100% {
    text-shadow:
      0 0 14px #ff1a3c,
      0 0 22px #ff1a3c,
      4px 4px 8px rgba(0, 0, 0, 0.8);
  }
}
</style>
