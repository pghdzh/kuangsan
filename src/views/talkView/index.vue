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

      <!-- 统计面板（放在聊天容器顶部） -->
      <div class="stats-panel">
        <div class="stat-item">
          总对话次数：<span>{{ stats.totalChats }}</span>
        </div>
        <div class="stat-item">
          首次使用：<span>{{
            new Date(stats.firstTimestamp).toISOString().slice(0, 10)
          }}</span>
        </div>
        <div class="stat-item">
          活跃天数：<span>{{ stats.activeDates.length }}</span> 天
        </div>
        <div class="stat-item">
          今日对话：<span>{{
            stats.dailyChats[new Date().toISOString().slice(0, 10)] || 0
          }}</span>
          次
        </div>
        <button class="detail-btn" @click="showModal = true">全部</button>
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
        <!-- 输入框 -->
        <input
          v-model="input"
          type="text"
          placeholder="向时崎狂三提问…"
          :disabled="loading"
          @keydown="handleKeydown"
        />
        <!-- 清空 & 语音 图标按钮组 -->
        <div class="btn-group">
          <button
            type="button"
            class="clear-btn"
            @click="clearChat"
            :disabled="loading"
            title="清空对话"
          >
            ✖
          </button>
          <button
            type="button"
            class="voice-btn"
            @click="isVoiceEnabled = !isVoiceEnabled"
            title="切换语音"
          >
            {{ isVoiceEnabled ? "🔊" : "🔇" }}
          </button>
        </div>
        <!-- 发送主按钮 -->
        <button
          type="submit"
          class="send-btn"
          :disabled="!input.trim() || loading"
        >
          发送
        </button>
        <!-- 统计数据按钮 -->
        <button
          type="button"
          class="Alldetail-btn"
          @click="showModal = true"
          title="查看统计"
        >
          统计数据
        </button>

        <button
          type="button"
          class="export-btn"
          @click="exportChat"
          :disabled="!chatLog.length"
        >
          导出对话为txt
        </button>
      </form>
    </div>

    <!-- 详细统计弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content">
        <h3>详细统计</h3>
        <ul class="detail-list">
          <li>总对话次数：{{ stats.totalChats }}</li>
          <li>
            首次使用：{{
              new Date(stats.firstTimestamp).toISOString().slice(0, 10)
            }}
          </li>
          <li>活跃天数：{{ stats.activeDates.length }} 天</li>
          <li>
            今日对话：{{
              stats.dailyChats[new Date().toISOString().slice(0, 10)] || 0
            }}
            次
          </li>
          <li>总使用时长：{{ formatDuration(stats.totalTime) }}</li>
          <li>当前连续活跃：{{ stats.currentStreak }} 天</li>
          <li>最长连续活跃：{{ stats.longestStreak }} 天</li>
          <li>
            最活跃日：{{ mostActiveDayComputed }} （{{
              stats.dailyChats[mostActiveDayComputed] || 0
            }}
            次）
          </li>
          <li>彩蛋统计：</li>
          <ul class="egg-list">
            <li>鼓励彩蛋：{{ stats.eggCounts.encourage }} 次</li>
            <li>无输入彩蛋：{{ stats.eggCounts.noInput }} 次</li>
            <li>里程碑彩蛋：{{ stats.eggCounts.milestone }} 次</li>
          </ul>
        </ul>
        <button class="close-btn" @click="showModal = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  reactive,
  ref,
  computed,
  onMounted,
  nextTick,
  watch,
  onBeforeUnmount,
} from "vue";
import { sendMessageToHui } from "@/api/deepseekApi";

const STORAGE_KEY = "kurumi_chat_log";
const STORAGE_VOICE_KEY = "kurumi_voice_enabled";

// 本地存储键名
const STORAGE_STATS_KEY = "kurumi_chat_stats";
const showModal = ref(false);
// Stats 类型声明，确保所有字段都有默认值
interface Stats {
  firstTimestamp: number; // 首次使用时间戳
  totalChats: number; // 总对话次数
  activeDates: string[]; // 有发言的日期列表（yyyy‑mm‑dd）
  dailyChats: Record<string, number>; // 每日对话次数
  currentStreak: number; // 当前连续活跃天数
  longestStreak: number; // 历史最长连续活跃天数
  eggCounts: {
    // 彩蛋触发次数
    encourage: number;
    noInput: number;
    milestone: number;
  };
  totalTime: number; // 累计使用时长（毫秒）
}

// 默认值，用于补齐本地存储中可能缺失的字段
const defaultStats: Stats = {
  firstTimestamp: Date.now(),
  totalChats: 0,
  activeDates: [],
  dailyChats: {},
  currentStreak: 0,
  longestStreak: 0,
  eggCounts: { encourage: 0, noInput: 0, milestone: 0 },
  totalTime: 0,
};

// 从 localStorage 加载并合并默认值
function loadStats(): Stats {
  const saved = localStorage.getItem(STORAGE_STATS_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...defaultStats, ...parsed };
    } catch {
      console.warn("加载统计数据失败，使用默认值");
    }
  }
  return { ...defaultStats };
}

// 保存到 localStorage
function saveStats() {
  localStorage.setItem(STORAGE_STATS_KEY, JSON.stringify(stats));
}

// 更新「活跃天数」及「连续活跃」逻辑
function updateActive(date: string) {
  if (!stats.activeDates.includes(date)) {
    stats.activeDates.push(date);
    updateStreak();
    saveStats(); // 持久化活跃天数变化
  }
}
function updateStreak() {
  const dates = [...stats.activeDates].sort();
  let curr = 0,
    max = stats.longestStreak,
    prevTs = 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  dates.forEach((d) => {
    const ts = new Date(d).getTime();
    if (prevTs && ts - prevTs === 86400000) curr++;
    else curr = 1;
    max = Math.max(max, curr);
    prevTs = ts;
  });
  stats.currentStreak = dates[dates.length - 1] === todayStr ? curr : 0;
  stats.longestStreak = max;
  saveStats();
}

// 更新「每日对话次数」
function updateDaily(date: string) {
  stats.dailyChats[date] = (stats.dailyChats[date] || 0) + 1;
  saveStats(); // 持久化活跃天数变化
}

// 记录彩蛋触发
function recordEgg(type: "encourage" | "noInput" | "milestone") {
  stats.eggCounts[type]++;
  saveStats(); // 马上持久化
}

// 计算最活跃日
const mostActiveDayComputed = computed(() => {
  let day = "",
    max = 0;
  for (const [d, c] of Object.entries(stats.dailyChats)) {
    if (c > max) {
      max = c;
      day = d;
    }
  }
  return day || new Date().toISOString().slice(0, 10);
});

// 格式化总使用时长
function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h} 小时 ${m} 分钟` : `${m} 分钟`;
}

// —— Vue 响应式状态 ——
const stats = reactive<Stats>(loadStats());
// 会话开始时间，用于计算本次时长
const sessionStart = Date.now();

// 1. 全量导入，直接映射成 string[]
const modules = import.meta.glob("@/assets/images/*.{jpg,png,jpeg,webp}", {
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
  recordEgg("noInput");
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

// 3. 重置／启动 180 秒无输入定时器
function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(triggerNoInputEgg, 180 * 1000);
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
  if (stats.totalChats === 0 && !localStorage.getItem(STORAGE_STATS_KEY)) {
    stats.firstTimestamp = Date.now();
    saveStats();
  }
  const date = new Date().toISOString().slice(0, 10); // 每次都取最新“今天”
  stats.totalChats++;
  updateActive(date);
  updateDaily(date);
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
    //  throw new Error("测试错误");
    const history = chatLog.value.filter((msg) => !msg.isEgg && !msg.isError);
    const botReply = await sendMessageToHui(userText, history);
    if (botReply == "error") {
      playVoice("error");
      const errorMessages = [
        "啊啦～灵魂点数似乎不够了呢，狂三可说不出话了哦♡",
        "刻刻帝的时间已冻结……等能量恢复后我们再继续吧。",
        "狂三现在有点累了，要不你稍等一下，再来找人家玩呀～",
        "对不起，灵魂石与时之砂都已耗尽，狂三暂时无法与你对话，请稍后补充能量~",
        "子弹已空，时间也静止了。暂时无法再与你畅谈……你愿意再次为我启动【刻刻帝】吗？",
      ];

      const randomIndex = Math.floor(Math.random() * errorMessages.length);

      chatLog.value.push({
        id: Date.now() + 2,
        role: "bot",
        text: errorMessages[randomIndex],
        isError: true,
      });
    } else {
      chatLog.value.push({
        id: Date.now() + 1,
        role: "bot",
        text: botReply,
      }); // 1. 检查里程碑彩蛋，是否触发
      const hasMilestone = checkMilestones();
      // —— 鼓励彩蛋：30% 概率触发 ——
      if (!hasMilestone && Math.random() < 0.1) {
        // 随机挑一条
        const egg =
          encourageEggs[Math.floor(Math.random() * encourageEggs.length)];
        recordEgg("encourage");
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
    }

    // —— 彩蛋结束 ——
  } catch (e) {
    console.error(e);
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
        text: "你好，我是时崎狂三，有什么想知道的吗？",
      },
    ];
    localStorage.removeItem(STORAGE_KEY);
    playVoice("clear");
    clearTimeout(idleTimer);
    resetIdleTimer();
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
      text: "你好，我是时崎狂三，有什么想知道的吗？",
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
//导出对话记录
function exportChat() {
  // 将每条消息格式化成“角色：内容”并按行拼接
  const lines = chatLog.value.map((msg) => {
    const role = msg.role === "user" ? "你" : "狂三";
    // 去掉 HTML 标签
    const text = msg.text.replace(/<[^>]+>/g, "").trim();
    return `${role}：${text}`;
  });
  const content = lines.join("\n");
  // 创建 blob 并触发下载
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // 文件名可以加个时间戳
  const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.download = `对话记录-${date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleBeforeUnload() {
  stats.totalTime += Date.now() - sessionStart;
  saveStats();
}

onMounted(() => {
  scrollToBottom();
  resetIdleTimer();
  // 2. 每 5 秒切换一次
  timer = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % randomFive.value.length;
  }, 5000);

  window.addEventListener("beforeunload", handleBeforeUnload);
});

onBeforeUnmount(() => {
  clearTimeout(idleTimer);
  clearInterval(timer);
  window.removeEventListener("beforeunload", handleBeforeUnload);
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

  @keyframes gradient-flow {
    0%,
    100% {
      background-position: 0% 50%;
    }

    50% {
      background-position: 100% 50%;
    }
  }

  .carousel {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      pointer-events: none;
      z-index: 1;
    }

    .carousel-image {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 1s ease;
      filter: blur(1px);

      &.active {
        opacity: 1;
      }
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
      align-items: center;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(6px);
      padding: 8px 16px;
      border-radius: 12px;
      margin-bottom: 12px;
      font-size: 14px;
      color: #fff;

      .stat-item {
        margin-right: 55px;

        span {
          color: #ff3366;
          font-weight: bold;
        }
      }

      .detail-btn {
        margin-left: auto;
        background: transparent;
        border: 1px solid #ff3366;
        border-radius: 4px;
        padding: 4px 12px;
        color: #ff3366;
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: rgba(255, 51, 102, 0.1);
        }
      }
    }
  }

  .messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px 0 100px;
    overscroll-behavior: contain;
    scroll-behavior: smooth;
  }

  .message {
    display: flex;
    align-items: flex-start;
    margin-bottom: 12px;

    &.user {
      flex-direction: row-reverse;
    }

    &.error .bubble {
      background: rgba(255, 51, 102, 0.4);
      border: 1px solid #ff3366;
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

      &.bot {
        background-image: url("@/assets/images2/zavatar.webp");
        box-shadow: 0 0 12px #ff0033;
      }

      &.user {
        background: rgba(255, 255, 255, 0.9);
      }
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

      &.loading {
        color: rgba(255, 255, 255, 0.8);
      }

      // 机器人的气泡尖角
      .message.bot & {
        border-radius: 16px 16px 16px 4px;
      }

      .message.user & {
        border-radius: 16px 16px 4px 16px;
      }
    }
  }

  .dots {
    display: inline-flex;
    align-items: center;
    margin-left: 4px;

    .dot {
      opacity: 0;
      font-size: 16px;
      animation: blink 1s infinite;

      &:nth-child(1) {
        animation-delay: 0s;
      }

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
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
  }

  .input-area {
    position: sticky;
    bottom: 0;
    display: flex;
    align-items: center;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 24px;
    backdrop-filter: blur(6px);
    padding: 8px 12px;
    gap: 8px;
    z-index: 10;

    input {
      flex: 1;
      padding: 12px 20px;
      background: transparent;
      border: none;
      color: #fff;
      font-size: 16px;
      outline: none;

      &::placeholder {
        color: rgba(255, 255, 255, 0.6);
      }
    }

    // 按钮容器，方便对齐和间距控制
    .btn-group {
      display: flex;
      align-items: center;
      gap: 6px;

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        border: none;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        cursor: pointer;
        transition: background 0.2s;

        &:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        &.voice-btn {
          font-size: 18px;
        }

        &.clear-btn {
          font-size: 16px;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    // 发送按钮
    .send-btn {
      flex-shrink: 0;
      padding: 0 24px;
      height: 40px;
      background: linear-gradient(to right, #ff0033, #990033);
      border: none;
      border-radius: 20px;
      color: #fff;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.3s;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .export-btn {
      margin-left: 8px;
      padding: 4px 12px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fafafa;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    // “更多统计”按钮，高亮但不抢主按钮风头
    .Alldetail-btn {
      flex-shrink: 0;
      margin-left: 4px;
      background: transparent;
      border: 1px solid #ff3366;
      border-radius: 4px;
      padding: 4px 12px;
      color: #ff3366;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
      display: none;

      &:hover {
        background: rgba(255, 51, 102, 0.1);
      }
    }
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .modal-content {
      background: rgba(26, 26, 26, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 51, 102, 0.3);
      border-radius: 16px;
      padding: 24px;
      width: 320px;
      color: #fff;
      box-shadow: 0 0 20px rgba(255, 0, 51, 0.2);
      animation: fadeInUp 0.3s ease;

      h3 {
        margin-bottom: 16px;
        font-size: 20px;
        font-weight: bold;
        text-align: center;
        color: #ff3366;
        letter-spacing: 1px;
        border-bottom: 1px solid rgba(255, 51, 102, 0.2);
        padding-bottom: 8px;
      }

      .detail-list {
        list-style: none;
        padding: 0;
        margin: 0 0 20px;
        line-height: 1.6;
        font-size: 14px;

        li {
          margin-bottom: 8px;
          color: #f3f3f3;

          &:nth-child(odd) {
            color: #ffccd5;
          }
        }

        .egg-list {
          list-style: none;
          margin-top: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px dashed rgba(255, 51, 102, 0.3);

          li {
            margin-bottom: 6px;
            color: #ff99aa;
            font-size: 13px;

            &::before {
              content: "✨ ";
              color: #ff6699;
            }
          }
        }
      }

      .close-btn {
        display: block;
        margin: 0 auto;
        padding: 8px 20px;
        background: transparent;
        border: 1px solid #ff3366;
        border-radius: 6px;
        color: #ff3366;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 51, 102, 0.1);
          transform: scale(1.05);
          box-shadow: 0 0 8px rgba(255, 51, 102, 0.4);
        }
      }
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }

    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  // 移动端适配（≤768px）
  @media (max-width: 768px) {
    .chat-container {
      width: 100%;
      margin: 0;
      padding: 8px;

      .stats-panel {
        display: none;
      }
    }

    .bubble {
      padding: 8px 12px;
      font-size: 14px;
      max-width: 85%;
    }

    .avatar {
      width: 32px;
      height: 32px;
    }

    .input-area {
      flex-direction: column;
      gap: 6px;

      button {
        width: 100%;
      }

      .Alldetail-btn {
        display: block;
      }
    }

    .carousel {
      display: none;
    }
  }
}
</style>
