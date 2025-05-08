<template>
    <div class="board-page">

  
      <!-- 留言列表 -->
      <main class="messages" ref="msgList">
        <transition-group name="fade" tag="div">
          <div v-for="(msg, index) in messages" :key="index" class="message">
            <div class="msg-header">
              <span class="nickname">{{ msg.nickname }}</span>
              <span class="time">{{ formatTime(msg.time) }}</span>
            </div>
            <div class="msg-content" v-html="msg.text"></div>
          </div>
        </transition-group>
      </main>
  
      <!-- 底部输入区 -->
      <footer class="input-area">
        <div class="input-wrapper">
          <input v-model="nickname" type="text" placeholder="你的昵称…" :disabled="loading" />
          <textarea v-model="input" placeholder="留下你的心声…" :disabled="loading"></textarea>
          <button @click.prevent="postMessage" :disabled="!input.trim() || !nickname.trim() || loading">送信</button>
        </div>
      </footer>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, nextTick } from 'vue'
  import MarkdownIt from 'markdown-it'
  
  const STORAGE_KEY = 'kurumi_board'
  const md = new MarkdownIt()
  
  interface Msg { nickname: string; text: string; time: number }
  
  const messages = ref<Msg[]>(loadMessages())
  const nickname = ref('')
  const input = ref('')
  const loading = ref(false)
  const msgList = ref<HTMLElement>()
  
  function loadMessages(): Msg[] {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try { return JSON.parse(saved) }
      catch { return [] }
    }
    return []
  }
  
  function saveMessages() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value))
  }
  
  function formatTime(ts: number) {
    const d = new Date(ts)
    return d.toLocaleString('ja-JP', { hour12: false })
  }
  
  async function postMessage() {
    if (!input.value.trim() || !nickname.value.trim()) return
    loading.value = true
    const text = md.render(input.value)
    messages.value.push({ nickname: nickname.value.trim(), text, time: Date.now() })
    input.value = ''
    saveMessages()
    await scrollBottom()
    loading.value = false
  }
  
  async function scrollBottom() {
    await nextTick()
    if (msgList.value) msgList.value.scrollTop = msgList.value.scrollHeight
  }
  
  onMounted(() => {
    scrollBottom()
  })
  </script>
  
  <style scoped>
  .board-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding-top: 64px;
    background: linear-gradient(135deg, #1a0f1a, #0d000f);
    color: #fff;
    font-family: 'Creepster', sans-serif;
  }
  
  .header-bar {
    padding: 20px;
    text-align: center;
    background: rgba(0,0,0,0.7);
  }
  .title {
    margin: 0;
    font-size: 2.5rem;
    color: #ff0033;
  }
  
  .messages {
    flex: 1;
    width: 40%;
    overflow-y: auto;
    padding: 20px;
    margin: 0 auto;
  }
  
  .message {
    margin-bottom: 16px;
    animation: fade-in 0.4s;
  }
  
  .msg-header {
    display: flex;
    margin-bottom: 4px;
  }
  .nickname {
    font-weight: bold;
    color: #ff79c6;
    margin-right: 20px;
  }
  .time {
    font-size: 0.75rem;
    opacity: 0.6;
  }
  
  .msg-content {
    background: rgba(255,0,51,0.1);
    border: 1px solid rgba(255,0,51,0.4);
    backdrop-filter: blur(6px);
    padding: 12px;
    border-radius: 12px;
  }
  
  .input-area {
    padding: 10px 0;
  }
  .input-wrapper {
    max-width: 700px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .input-wrapper input,
  .input-wrapper textarea {
    width: 100%;
    padding: 12px;
    font-size: 1rem;
    background: rgba(0,0,0,0.6);
    border: 1px solid #33001a;
    color: #fff;
    border-radius: 8px;
    outline: none;
  }
  .input-wrapper textarea { height: 80px; resize: none; }
  
  .input-wrapper button {
    align-self: center;
    padding: 8px 24px;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
  }
  .input-wrapper button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  </style>
  