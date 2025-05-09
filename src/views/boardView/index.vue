<template>
  <div class="board-page">
    <header class="header-bar">
      <h1 class="title">留言板 - 时崎狂三风格</h1>
    </header>

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
      <div v-if="!loading && messages.length === 0" class="no-data">暂无留言，快来抢沙发！</div>
    </main>

    <!-- 底部输入区 -->
    <footer class="input-area">
      <div class="input-wrapper">
        <input v-model="nickname" type="text" placeholder="你的昵称…" :disabled="submitting" />
        <textarea v-model="input" placeholder="留下你的心声…" :disabled="submitting"></textarea>
        <button @click.prevent="postMessage" :disabled="!canSubmit" class="btn-submit">送信</button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed } from 'vue'
import MarkdownIt from 'markdown-it'
import { getMessageList, createMessage } from '@/api/modules/message'

const md = new MarkdownIt()
const messages = ref<any[]>([])
const nickname = ref('')
const input = ref('')
const loading = ref(false)
const submitting = ref(false)
const msgList = ref<HTMLElement>()

const CHARACTER_KEY = 'kyouko' // 当前角色标识，可动态替换

const loadMessages = async () => {
  loading.value = true
  try {
    const res = await getMessageList({ page: 1, pageSize: 100, character_key: CHARACTER_KEY })
    if (res.success) {
      messages.value = res.data.reverse() // 最新在底部
      await scrollBottom()
    }
  } finally {
    loading.value = false
  }
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleString('ja-JP', { hour12: false })
}

async function postMessage() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    const res = await createMessage({ name: nickname.value.trim(), content: input.value, character_key: CHARACTER_KEY })
    if (res.success) {
      nickname.value = ''
      input.value = ''
      await loadMessages()
    }
  } finally {
    submitting.value = false
  }
}

async function scrollBottom() {
  await nextTick()
  if (msgList.value) msgList.value.scrollTop = msgList.value.scrollHeight
}

const canSubmit = computed(() => !!nickname.value.trim() && !!input.value.trim() && !submitting.value)

onMounted(loadMessages)
</script>

<style scoped>
.board-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #1b091b, #2e0f2e);
  color: #f0f0f0;
  font-family: 'Creepster', sans-serif;
}
.header-bar {
  position: sticky;
  top: 0;
  padding: 16px;
  text-align: center;
  background: rgba(255, 0, 51, 0.35);
  backdrop-filter: blur(6px);
  z-index: 10;
}
.title {
  margin: 0;
  font-size: 2rem;
  color: #ff79c6;
}
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.message-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 700px;
  margin: 0 auto;
}
.message-card {
  background: rgba(255,255,255,0.05);
  border-left: 4px solid #ff79c6;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  transition: transform 0.3s;
}
.message-card:hover {
  transform: translateY(-4px);
}
.msg-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
.nickname {
  font-weight: bold;
  color: #ff79c6;
}
.time {
  font-size: 0.75rem;
  opacity: 0.7;
}
.msg-content {
  background: rgba(255,0,51,0.1);
  border: 1px solid rgba(255,0,51,0.4);
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
.input-area {
  padding: 12px;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(6px);
}
.input-wrapper {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.input-wrapper input,
.input-wrapper textarea {
  width: 100%;
  padding: 14px;
  font-size: 1rem;
  background: rgba(0,0,0,0.7);
  border: 1px solid #4d002f;
  color: #f0f0f0;
  border-radius: 8px;
  resize: none;
}
.input-wrapper input { height: 40px; }
.input-wrapper textarea { height: 100px; }
.btn-submit {
  align-self: center;
  padding: 12px 36px;
  border: none;
  border-radius: 24px;
  background: linear-gradient(90deg, #ff79c6, #ff5fa1);
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 6px 12px rgba(0,0,0,0.6);
  transition: background 0.3s, transform 0.2s;
}
.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}
.btn-submit:not(:disabled):hover {
  background: linear-gradient(90deg, #ff5fa1, #ff3e75);
  transform: translateY(-2px);
}
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