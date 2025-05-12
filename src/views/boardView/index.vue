<template>
  <div class="board-page">
    <!-- 背景轮播放在最底层 -->
    <div class="carousel">
      <img
        v-for="(src, idx) in randomFive"
        :key="idx"
        :src="src"
        class="carousel-image"
        :class="{ active: idx === currentIndex }"
      />
    </div>
    <!-- 留言列表 -->
    <main class="messages" ref="msgList">
      <transition-group name="fade" tag="div" class="message-list">
        <div v-for="msg in messages" :key="msg.id" class="message-card">
          <div class="msg-header">
            <span class="nickname">{{ msg.name }}</span>
            <span class="time">{{ formatTime(msg.created_at) }}</span>
          </div>
          <div class="msg-content" v-html="msg.content"></div>
        </div>
      </transition-group>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-if="!loading && messages.length === 0" class="no-data">
        暂无留言，快来抢沙发！
      </div>
    </main>

    <!-- 底部输入区 -->
    <footer class="input-area">
      <div class="input-wrapper">
        <input
          v-model="nickname"
          type="text"
          placeholder="你的昵称…"
          :disabled="submitting"
        />
        <textarea
          v-model="input"
          placeholder="留下你的心声…"
          :disabled="submitting"
        ></textarea>
        <button
          @click.prevent="postMessage"
          :disabled="!canSubmit"
          class="btn-submit"
        >
          送信
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, computed } from "vue";
import { getMessageList, createMessage } from "@/api/modules/message";

// 全量导入并随机取五张
const modules = import.meta.glob("@/assets/images/*.{jpg,png,jpeg}", {
  eager: true,
});
const allSrcs: string[] = Object.values(modules).map((mod: any) => mod.default);
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const randomFive = ref<string[]>(shuffle(allSrcs).slice(0, 5));
const currentIndex = ref(0);
let timer: number;

const messages = ref<any[]>([]);
const nickname = ref("");
const input = ref("");
const loading = ref(false);
const submitting = ref(false);
const msgList = ref<HTMLElement>();

const loadMessages = async () => {
  loading.value = true;
  try {
    const res = await getMessageList({ page: 1, pageSize: 100 });
    if (res.success) {
      messages.value = res.data.reverse();
      await scrollBottom();
    }
  } finally {
    loading.value = false;
  }
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleString("ja-JP", { hour12: false });
}

async function postMessage() {
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    const res = await createMessage({
      name: nickname.value.trim(),
      content: input.value,
    });
    if (res.success) {
      nickname.value = "";
      input.value = "";
      await loadMessages();
    }
  } finally {
    submitting.value = false;
  }
}

async function scrollBottom() {
  await nextTick();
  if (msgList.value) msgList.value.scrollTop = msgList.value.scrollHeight;
}

const canSubmit = computed(
  () => !!nickname.value.trim() && !!input.value.trim() && !submitting.value
);

onMounted(() => {
  loadMessages();
  timer = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % randomFive.value.length;
  }, 5000);
});
onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped>
.board-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-top: 64px;
  background: linear-gradient(135deg, #1b091b, #2e0f2e);
  color: #f0f0f0;
  font-family: "Creepster", sans-serif;
}
.carousel {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.carousel-image {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1s ease;
  filter: blur(1.5px);
}
.carousel-image.active {
  opacity: 1;
}
.carousel::before {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.2);
  pointer-events: none;
  z-index: 1;
}
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  z-index: 10;
}
.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 700px;
  margin: 0 auto;
}
.message-card {
  background: rgba(30, 0, 30, 0.6); /* 深暗紫色半透明底 */
  border-left: 4px solid #b30000; /* 血红色左边线 */
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(179, 0, 0, 0.5); /* 血红阴影 */
  transition: transform 0.3s, box-shadow 0.3s;
}
.message-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(255, 28, 28, 0.7);
}

.msg-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
/* 昵称突出——血红文字 + 轻微光晕 */
.nickname {
  font-weight: bold;
  color: #ff1c1c; /* 鲜血红 */
 
}

/* 时间保持偏暗，只微调对比度 */
.time {
  font-size: 0.75rem;
  opacity: 0.6;
  color: #ccc;
}
.msg-content {
  background: rgba(255, 0, 51, 0.1);
  border: 1px solid rgba(255, 0, 51, 0.4);
  backdrop-filter: blur(4px);
  padding: 12px;
  border-radius: 8px;
  line-height: 1.5;
}
.no-data,
.loading {
  text-align: center;
  padding: 24px;
  color: #aaa;
  font-style: italic;
}

/* —— 底部输入区 —— */
.input-area {
  padding: 12px;
  z-index: 10;
}
.input-wrapper {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 狂三风格输入框 */
.input-wrapper input,
.input-wrapper textarea {
  width: 100%;
  padding: 14px;
  font-size: 1rem;
  background: rgba(20, 0, 20, 0.8); /* 更深的暗紫/黑底 */
  border: 1px solid #8b0000; /* 深红描边 */
  color: #f0f0f0;
  border-radius: 8px;
  resize: none;
  transition: border 0.3s, box-shadow 0.3s;
}
.input-wrapper input:focus,
.input-wrapper textarea:focus {
  border-color: #ff1c1c; /* 聚焦时鲜血红 */
  box-shadow: 0 0 8px rgba(255, 28, 28, 0.7);
}
.input-wrapper input {
  height: 40px;
}
.input-wrapper textarea {
  height: 100px;
}

/* 狂三风格按钮 */
.btn-submit {
  align-self: center;
  padding: 12px 36px;
  border: none;
  border-radius: 24px;
  background: linear-gradient(90deg, #4b0000, #b30000); /* 暗红到血红 */
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 6px 12px rgba(179, 0, 0, 0.6);
  transition: background 0.3s, transform 0.2s, box-shadow 0.3s;
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
.btn-submit:not(:disabled):hover {
  background: linear-gradient(90deg, #b30000, #ff1c1c);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(255, 28, 28, 0.7);
}

/* 留言过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
