<template>
  <header class="header">
    <nav class="nav-list">
      <ul>
        <li v-for="item in links" :key="item.name">
          <router-link :to="item.path" class="link">{{ item.name }}</router-link>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const links = ref([
  { name: '首页', path: '/' },
  { name: '角色概览', path: '/overview' },
  { name: '图库', path: '/gallery' },
  { name: '时间线', path: '/timeline' },
  { name: '留言板', path: '/board' },
  { name: '对话狂三', path: '/talk' }
])
</script>

<style lang="scss" scoped>
.header {
  width: 100%;
  line-height: 64px;
  background: rgba(27, 27, 27, 0.85);
  position: fixed;
  top: 0;
  z-index: 100;
  height: 64px;

  .nav-list {
    ul {
      display: flex;
      justify-content: center;
      gap: 40px;
      list-style: none;

      li {
        position: relative;

        // 时钟外圈
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

        // 时钟指针
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
  }
}
</style>