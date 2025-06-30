<template>
  <div class="chat-page">
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
    <div class="chat-container">
      <!-- 统计面板 -->
      <div class="stats-panel">
        <div class="stat-item">
          对话次数：<span>{{ totalChats }}</span> 次
        </div>
        <div class="stat-item">
          已使用：<span>{{ daysUsed }}</span> 天
        </div>
        <div class="stat-item">
          首次使用：<span>{{ firstDate }}</span>
        </div>
      </div>
      <div class="messages" ref="msgList">
        <transition-group name="msg" tag="div">
          <div
            v-for="msg in chatLog"
            :key="msg.id"
            :class="['message', msg.role, { error: msg.isError }]"
          >
            <div class="avatar" :class="msg.role"></div>
            <div class="bubble">
              <div class="content" v-html="msg.text"></div>
            </div>
          </div>
          <div v-if="loading" class="message bot" key="loading">
            <div class="avatar bot"></div>
            <div class="bubble loading">
              正在思考中
              <span class="dots">
                <span class="dot">.</span>
                <span class="dot">.</span>
                <span class="dot">.</span>
              </span>
            </div>
          </div>
        </transition-group>
      </div>
      <form class="input-area" @submit.prevent="sendMessage">
        <input
          v-model="input"
          type="text"
          placeholder="向时崎狂三提问…"
          :disabled="loading"
          @keydown="handleKeydown"
        />
        <button type="submit" :disabled="!input.trim() || loading">发送</button>
        <button type="button" class="clear-btn" @click="clearChat">清空</button>
        <button
          type="button"
          class="voice-btn"
          @click="isVoiceEnabled = !isVoiceEnabled"
        >
          {{ isVoiceEnabled ? "语音开启🔊" : "语音关闭🔇" }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  onMounted,
  nextTick,
  watch,
  onBeforeUnmount,
  onUnmounted,
} from "vue";
import { sendMessageToKurumi } from "@/api/deepseekApi";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt();
const STORAGE_KEY = "kurumi_chat_log";
const STORAGE_VOICE_KEY = "kurumi_voice_enabled";
const STORAGE_STATS_KEY = "kurumi_chat_stats";

// 统计状态
interface Stats {
  firstTimestamp: number;
  totalChats: number;
}

const stats = ref<Stats>(loadStats());
const totalChats = ref(stats.value.totalChats);
const daysUsed = ref(computeDays(stats.value.firstTimestamp));
const firstDate = ref(formatDate(stats.value.firstTimestamp));

// 保存统计
function saveStats() {
  localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats.value));
}

function loadStats(): Stats {
  const saved = localStorage.getItem(STORAGE_STATS_KEY);
  if (saved) {
    try {
      const s = JSON.parse(saved);
      return s;
    } catch {
      // 忽略解析错误
    }
  }
  return { firstTimestamp: Date.now(), totalChats: 0 };
}

// 计算相隔天数
function computeDays(start: number): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((Date.now() - start) / msPerDay) + 1;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}
// 1. 全量导入，直接映射成 string[]
const modules = import.meta.glob("@/assets/images/*.{jpg,png,jpeg}", {
  eager: true,
});
const allSrcs: string[] = Object.values(modules).map((mod: any) => mod.default);

// 2. 洗牌并取 5 张
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

interface ChatMsg {
  id: number;
  role: "user" | "bot";
  text: string;
  isError?: boolean;
  isEgg?: boolean;
}

const chatLog = ref<ChatMsg[]>(loadChatLog());
const input = ref("");
const loading = ref(false);
const msgList = ref<HTMLElement>();
const isVoiceEnabled = ref(loadVoiceSetting());
// 鼓励彩蛋列表
const encourageEggs = [
  { file: "Encourage (1).mp3", text: "失败只是过程而已，你一定能跨过去♡" },
  { file: "Encourage (2).mp3", text: "下一步也由我在背后守护你…♡" },
  { file: "Encourage (3).mp3", text: "别着急♡你已经很努力了" },
  { file: "Encourage (4).mp3", text: "就算在黑暗中，我也会为你照亮…放心♡" },
  { file: "Encourage (5).mp3", text: "相信自己…结果会随之而来♡" },
  { file: "Encourage (6).mp3", text: "即便是小小的一步，也是实实在在的前进♡" },
  { file: "Encourage (7).mp3", text: "你的努力我都看得见…我也很开心♡" },
  { file: "Encourage (8).mp3", text: "累了就休息，不要勉强自己♡" },
];

// 1. 定义无输入彩蛋列表
const noInputEggs = [
  { file: "noInput (1).mp3", text: "喂…别一直沉默，说点什么嘛♡" },
  { file: "noInput (2).mp3", text: "无聊了吗？能听到我的声音吗？" },
  { file: "noInput (3).mp3", text: "这么安静…仿佛时间都停止了♡" },
  { file: "noInput (4).mp3", text: "呵呵，就不跟我说句话吗？" },
  { file: "noInput (5).mp3", text: "只有时间在流逝…好寂寞呢♡" },
];
let idleTimer: ReturnType<typeof setTimeout>;

// 记录对话开始时间
let startTime = Date.now();
// 防止重复触发
const triggered = new Set<string>();

// 里程碑彩蛋配置
const milestoneEggs = [
  {
    count: 20,
    files: ["20 (1)", "20 (2)"],
    texts: [
      "二十个刻度…和你的每个瞬间都转瞬即逝，心都快跳出来了♡",
      "20次了…你竟然和我共享了这么多‘时间’，真是太特别了♡",
    ],
  },
  {
    count: 50,
    files: ["50 (1)", "50 (2)"],
    texts: [
      "五十个瞬间…仿佛要沉溺在和你共度的时光里♡",
      "50次了…仿佛时间都站在我们这边…希望能永远持续下去♡",
    ],
  },
  {
    count: 100,
    files: ["100 (1)", "100 (2)"],
    texts: [
      "百个刻度…和你共享的‘时间’都已成了珍宝…我想一直待在你身边♡",
      "100次了…就像命运的齿轮锁住了我们…我不想分开♡",
    ],
  },
  {
    elapsed: 10 * 60 * 1000,
    files: ["10m (1)", "10m (2)"],
    texts: [
      "十个刻度…我想感受你的心跳…♡",
      "10分钟…和我共度的‘刹那’竟如此浓密，仿佛永恒♡",
    ],
  },
  {
    elapsed: 30 * 60 * 1000,
    files: ["30m (1)", "30m (2)"],
    texts: [
      "30分钟…被与你的时光禁锢，似乎再也回不去了♡",
      "三十个刻度…连秒针声都成了只属于我们的小夜曲♡",
    ],
  },
];

function checkMilestones(): boolean {
  const userCount = chatLog.value.filter((m) => m.role === "user").length;
  const elapsed = Date.now() - startTime;
  let triggeredOne = false;
  milestoneEggs.forEach((m) => {
    const key = m.count != null ? `c${m.count}` : `e${m.elapsed}`;
    if (triggered.has(key)) return;

    const hitCount = m.count != null && userCount >= m.count;
    const hitTime = m.elapsed != null && elapsed >= m.elapsed;
    if (hitCount || hitTime) {
      const idx = Math.floor(Math.random() * m.files.length);
      const file = m.files[idx];
      const text = m.texts[idx];

      // 播放对应语音
      playVoice(file);

      // 插入彩蛋消息
      chatLog.value.push({
        id: Date.now(),
        role: "bot",
        text: `<p style="opacity:.7;color: #ffb3c1;">${text}</p>`,
        isEgg: true,
      });

      triggered.add(key);
      triggeredOne = true;
    }
  });
  return triggeredOne;
}
// 2. 触发彩蛋的方法（随机挑选、打标记）
function triggerNoInputEgg() {
  const egg = noInputEggs[Math.floor(Math.random() * noInputEggs.length)];
  // 播放对应语音
  playVoice(egg.file.replace(".mp3", ""));
  // 推入气泡，标记 isEgg: true
  chatLog.value.push({
    id: Date.now(),
    role: "bot",
    text: `<p style="opacity:.7;color: #ffb3c1;">${egg.text}</p>`,
    isEgg: true,
  });
  resetIdleTimer(); // 重新启动定时器
}

// 3. 重置／启动 30 秒无输入定时器
function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(triggerNoInputEgg, 60 * 1000);
}

function loadVoiceSetting() {
  const saved = localStorage.getItem(STORAGE_VOICE_KEY);
  return saved !== null ? JSON.parse(saved) : true;
}

watch(isVoiceEnabled, (val) => {
  if (isVoiceEnabled) {
    playVoice("welcome");
  }
  localStorage.setItem(STORAGE_VOICE_KEY, JSON.stringify(val));
});

function playVoice(name: string) {
  if (!isVoiceEnabled.value) return;
  const audio = new Audio(`/voice/${name}.mp3`);
  audio.play().catch((e) => console.warn("音频播放失败：", e));
}

async function sendMessage() {
  if (!input.value.trim()) return;
  // 更新统计时机：用户消息入 chatLog
  stats.value.totalChats++;
  totalChats.value = stats.value.totalChats;
  daysUsed.value = computeDays(stats.value.firstTimestamp);
  saveStats();

  resetIdleTimer();
  const userText = input.value;
  chatLog.value.push({
    id: Date.now(),
    role: "user",
    text: userText,
  });
  input.value = "";
  loading.value = true;
  playVoice("think");

  try {
    const history = chatLog.value.filter((msg) => !msg.isEgg);
    const botReply = await sendMessageToKurumi(userText, history);
    chatLog.value.push({
      id: Date.now() + 1,
      role: "bot",
      text: md.render(botReply),
    });

    // 1. 检查里程碑彩蛋，是否触发
    const hasMilestone = checkMilestones();
    // —— 鼓励彩蛋：30% 概率触发 ——
    if (!hasMilestone && Math.random() < 0.3) {
      // 随机挑一条
      const egg =
        encourageEggs[Math.floor(Math.random() * encourageEggs.length)];
      // 播放对应语音（不带 .mp3 后缀）
      playVoice(egg.file.replace(".mp3", ""));
      // 推入带标记的彩蛋消息
      chatLog.value.push({
        id: Date.now() + 2,
        role: "bot",
        text: `<p style="opacity:.7;color: #ffb3c1;">${egg.text}</p>`,
        isEgg: true,
      });
    }
    // —— 彩蛋结束 ——
  } catch (e) {
    console.error(e);
    playVoice("error");
    chatLog.value.push({
      id: Date.now() + 2,
      role: "bot",
      text: "对不起，出了点问题，请稍后再试。",
      isError: true,
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendMessage();
}

function clearChat() {
  if (confirm("确定要清空全部对话吗？")) {
    chatLog.value = [
      {
        id: Date.now(),
        role: "bot",
        text: md.render("你好，我是时崎狂三，有什么想知道的吗？"),
      },
    ];
    localStorage.removeItem(STORAGE_KEY);
    playVoice("clear");
  }
}

function loadChatLog(): ChatMsg[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("chatLog 解析失败：", e);
    }
  }
  return [
    {
      id: Date.now(),
      role: "bot",
      text: md.render("你好，我是时崎狂三，有什么想知道的吗？"),
    },
  ];
}

async function scrollToBottom() {
  await nextTick();
  if (msgList.value) {
    msgList.value.scrollTop = msgList.value.scrollHeight;
  }
}

watch(
  chatLog,
  async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chatLog.value));
    await scrollToBottom();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  clearTimeout(idleTimer);
});

onMounted(() => {
  daysUsed.value = computeDays(stats.value.firstTimestamp);
  scrollToBottom();
  resetIdleTimer();
  // 2. 每 5 秒切换一次
  timer = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % randomFive.value.length;
  }, 10000);
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<style scoped lang="scss">
.chat-page {
  padding-top: 64px;
  height: 100vh;
  background: linear-gradient(135deg, #0d0d0d, #2c001e, #1a1a1a);
  background-size: 400% 400%;
  animation: gradient-flow 20s ease infinite;
  color: #fff;
  display: flex;
  flex-direction: column;
  .carousel {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    /* 放在最底层 */
    /* 叠加所有图片，通过 opacity 实现切换 */
    .carousel-image {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 1s ease;
      filter: blur(1px); /* 轻微模糊 */
    }

    .carousel-image.active {
      opacity: 1;
    }
  }
  /* 遮罩层 */
  .carousel::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.5); /* 遮罩透明度可调 */
    pointer-events: none;
    z-index: 1;
  }
}

@keyframes gradient-flow {
  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 800px;
  margin: 0 auto;
  padding: 16px;
  gap: 12px;
  height: 100%;
  .stats-panel {
    display: flex;
    justify-content: space-around;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(6px);
    padding: 8px 16px;
    border-radius: 12px;
    margin-bottom: 12px;
    color: #fff;
    font-size: 14px;
  }

  .stat-item span {
    font-weight: bold;
    color: #ff3366;
  }
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 100px;
  padding-top: 10px;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
}

.message {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.message.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin: 0 8px;
  background-size: cover;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  z-index: 10;
}

.avatar.bot {
  background-image: url("@/assets/images/zavatar.jpg");
  box-shadow: 0 0 12px #ff0033;
}

.avatar.user {
  background: rgba(255, 255, 255, 0.9);
}

.bubble {
  max-width: 70%;
  background: rgba(255, 0, 51, 0.1);
  border: 1px solid rgba(255, 0, 51, 0.4);
  backdrop-filter: blur(8px);
  padding: 12px 16px;
  border-radius: 16px;
  line-height: 1.6;
  word-break: break-word;
  box-shadow: 0 0 8px rgba(255, 0, 51, 0.3);
}
.dots {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}
.dot {
  opacity: 0;
  font-size: 16px;
  animation: blink 1s infinite;
}
.dot:nth-child(1) {
  animation-delay: 0s;
}
.dot:nth-child(2) {
  animation-delay: 0.2s;
}
.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%,
  100% {
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
}
.message.bot .bubble {
  border-radius: 16px 16px 16px 4px;
}

.message.user .bubble {
  border-radius: 16px 16px 4px 16px;
}

.message.error .bubble {
  background: rgba(255, 51, 102, 0.4);
  border: 1px solid #ff3366;
}

.input-area {
  position: sticky;
  bottom: 0;
  display: flex;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 24px;
  backdrop-filter: blur(6px);
  padding: 8px;
  gap: 8px;
  z-index: 10;
}

.input-area input {
  flex: 1;
  padding: 12px 20px;
  background: transparent;
  border: none;
  color: #fff;
  font-size: 16px;
  outline: none;
}

.input-area input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.input-area button {
  background: linear-gradient(to right, #ff0033, #990033);
  border: none;
  color: #fff;
  padding: 0 20px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.input-area button.clear-btn,
.input-area .voice-btn {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(6px);
  color: #fff;
}

.input-area button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.voice-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.loading {
  color: rgba(255, 255, 255, 0.8);
}

@media (max-width: 600px) {
  .avatar {
    width: 36px;
    height: 36px;
  }

  .bubble {
    max-width: 80%;
    font-size: 14px;
  }
}

.egg-text {
  display: block;
  opacity: 0.7;
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
/* 移动端适配（≤768px） */
@media (max-width: 768px) {
  /* 容器宽度调整为全屏 */
  .chat-container {
    width: 100%;
    margin: 0;
    padding: 8px;
  }

  /* 聊天气泡减小内边距、字体稍小 */
  .bubble {
    padding: 8px 12px;
    font-size: 14px;
    max-width: 85%;
  }

  /* 头像再缩小一点 */
  .avatar {
    width: 32px;
    height: 32px;
  }

  /* 输入区纵向排列，按钮全宽 */
  .input-area {
    flex-direction: column;
    gap: 6px;
  }
  .input-area button {
    width: 100%;
  }

  /* 隐藏背景轮播，减少流量和渲染开销 */
  .carousel {
    display: none;
  }
}
</style>
