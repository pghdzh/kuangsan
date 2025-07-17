<template>
  <header class="header">
    <!-- 在线人数展示 -->
    <div class="online-count" v-if="onlineCount !== null">
      当前在线：<span class="count">{{ onlineCount }}人</span>
    </div>
    <!-- 移动端汉堡按钮 -->
    <button class="hamburger" @click="isOpen = !isOpen" aria-label="Toggle menu">
      <span :class="{ open: isOpen }"></span>
      <span :class="{ open: isOpen }"></span>
      <span :class="{ open: isOpen }"></span>
    </button>

    <nav class="nav-list" :class="{ open: isOpen }">
      <ul>
        <li v-for="item in links" :key="item.name" @click="isOpen = false">
          <router-link :to="item.path" class="link">{{ item.name }}</router-link>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { io } from 'socket.io-client'

const links = ref([
  { name: '首页', path: '/' },
  { name: '角色概览', path: '/overview' },
  { name: '图库', path: '/gallery' },
  { name: '时间线', path: '/timeline' },
  { name: '留言板', path: '/board' },
  { name: '对话狂三', path: '/talk' },
  { name: '剧情演绎', path: '/story' }, 
  { name: '对话书架', path: '/bookshelf' },
])

// 控制移动端菜单开关
const isOpen = ref(false)

// 实时在线人数
const onlineCount = ref<number | null>(null)
const socket = io('http://1.94.189.79:3000') // 替换为你的后端地址

onMounted(() => {
  socket.on('onlineCount', count => {
    onlineCount.value = count
    console.log(" onlineCount.value", onlineCount.value)
  })
})

onBeforeUnmount(() => {
  socket.disconnect()
})
</script>

<style lang="scss" scoped>
.header {
  position: fixed;
  top: 0;
  width: 100%;
  height: 64px;
  background: rgba(27, 27, 27, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;

  .online-count {
    position: absolute;
    right: 60px;
    top: 50%;
    transform: translateY(-50%);
    color: #fde8e8;
    font-family: 'Cinzel Decorative', serif;
    font-size: 1.05rem;
    background: rgba(0, 0, 0, 0.4);
    padding: 6px 12px;
    border: 1px solid #d14b4b;
    border-radius: 20px;
    box-shadow: 0 0 6px #d14b4b88;
    backdrop-filter: blur(4px);

    .count {
      color: #d14b4b;
      font-weight: bold;
      text-shadow: 0 0 3px #d14b4b;
    }
  }



  // 汉堡按钮初始隐藏，在移动端才显示
  .hamburger {
    display: none;
    position: absolute;
    right: 16px;
    background: none;
    border: none;
    flex-direction: column;
    justify-content: space-between;
    height: 20px;
    cursor: pointer;
    padding: 0;

    span {
      display: block;
      width: 24px;
      height: 2px;
      background: #fde8e8;
      transition: transform 0.3s, opacity 0.3s;
    }

    // 打开时三条线变成 X
    span.open:nth-child(1) {
      transform: translateY(8px) rotate(45deg);
    }

    span.open:nth-child(2) {
      opacity: 0;
    }

    span.open:nth-child(3) {
      transform: translateY(-8px) rotate(-45deg);
    }
  }

  .nav-list {
    ul {
      display: flex;
      justify-content: center;
      gap: 40px;
      list-style: none;

      li {
        position: relative;

        &::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 24px;
          height: 24px;
          border: 2px solid #d14b4b;
          border-radius: 50%;
          transform: translate(-50%, -50%) scale(0);
          transition: transform 0.3s;
        }

        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 2px;
          height: 10px;
          background: #fde8e8;
          transform-origin: bottom center;
          transform: translate(-50%, -100%) rotate(0deg) scale(0);
          transition: transform 0.3s;
        }

        &:hover {
          &::before {
            transform: translate(-50%, -50%) scale(1);
          }

          &::after {
            transform: translate(-50%, -100%) rotate(360deg) scale(1);
            transition: transform 1s ease-in-out;
          }

          .link {
            color: #d14b4b;
          }
        }

        .link {
          font-family: 'Cinzel Decorative', serif;
          font-size: 1.15rem;
          color: #fde8e8;
          text-decoration: none;
          padding: 4px 8px;
          position: relative;
          transition: color 0.3s;
        }
      }
    }

    // 移动端下拉样式（初始隐藏）
    &.open {
      ul {
        display: flex;
      }
    }
  }

  // 移动端适配
  @media (max-width: 768px) {
    justify-content: flex-start;
    padding: 0 16px;

    .online-count {
      top: 50%;
      right: 52px;
      font-size: 0.95rem;
      padding: 4px 10px;
    }

    .hamburger {
      display: flex;
    }

    .nav-list {
      position: absolute;
      top: 64px;
      left: 0;
      width: 100%;
      background: rgba(27, 27, 27, 0.95);
      transition: height 0.3s ease;
      overflow: hidden;
      height: 0;

      &.open {
        height: calc(100vh - 64px); // 展开到全屏高度减去 header
      }

      ul {
        flex-direction: column;
        gap: 0;
        padding: 16px 0;

        li {
          margin: 8px 0;
          text-align: center;
        }
      }
    }
  }
}
</style>
