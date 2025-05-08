<template>
    <div class="board-page">
        <h1 class="title">時崎狂三の留言板</h1>
        <div class="messages" ref="msgList">
            <transition-group name="fade" tag="div">
                <div v-for="(msg, index) in messages" :key="index" class="message">
                    <div class="header">
                        <span class="nickname">{{ msg.nickname }}</span>
                        <span class="time">{{ formatTime(msg.time) }}</span>
                    </div>
                    <div class="content">
                        <div class="text" v-html="msg.text"></div>
                    </div>
                </div>
            </transition-group>
        </div>
        <form class="input-area" @submit.prevent="postMessage">
            <input v-model="nickname" type="text" placeholder="你的昵称…" :disabled="loading" />
            <textarea v-model="input" placeholder="留下你的心声…" :disabled="loading"></textarea>
            <button type="submit" :disabled="!input.trim() || !nickname.trim() || loading">送信</button>
        </form>
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
    width: 100%;
    margin: 0 auto;
    padding: 20px;
    background: #1a0f1a;
    color: #fff;
    font-family: 'Creepster', sans-serif;
    display: flex;
    flex-direction: column;
    height: 100vh;
}

.title {
    text-align: center;
    font-size: 2.5rem;
    color: #ff0033;
    margin-bottom: 20px;
}

.messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid #33001a;
    border-radius: 8px;
}

.message {
    margin-bottom: 16px;
    animation: fade-in 0.5s;
}

.header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
}

.nickname {
    font-weight: bold;
    color: #ff79c6;
}

.time {
    font-size: 0.75rem;
    opacity: 0.6;
}

.content {
    background: rgba(255, 0, 51, 0.1);
    border: 1px solid rgba(255, 0, 51, 0.4);
    backdrop-filter: blur(6px);
    padding: 12px;
    border-radius: 12px;
}

.input-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 10px;
}

.input-area input,
.input-area textarea {
    width: 90%;
    margin-bottom: 8px;
    padding: 12px;
    font-size: 1rem;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid #33001a;
    color: #fff;
    border-radius: 8px;
    outline: none;
}

.input-area textarea {
    height: 80px;
    resize: none;
}

.input-area button {
    padding: 8px 16px;
    background: linear-gradient(to right, #ff0033, #990033);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
}

.input-area button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

@keyframes fade-in {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>