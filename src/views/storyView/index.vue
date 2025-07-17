<template>
  <div class="chat-page">
    <!-- 背景轮播放在最底层 -->
    <div class="carousel">
      <img v-for="(src, idx) in randomFive" :key="idx" :src="src" class="carousel-image"
        :class="{ active: idx === currentIndex }" />
    </div>
    <div class="chat-container">
      <div class="messages" ref="msgList">
        <transition-group name="msg" tag="div">
          <div v-for="msg in chatLog" :key="msg.id" :class="['message', msg.role, { error: msg.isError }]">
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
        <input v-model="input" type="text" placeholder="下一步要做什么呢…" :disabled="loading" @keydown="handleKeydown" />
        <!-- 清空 图标按钮组 -->
        <div class="btn-group">
          <button type="button" class="clear-btn" @click="clearChat" :disabled="loading" title="清空对话">
            ✖
          </button>
        </div>
        <!-- 发送主按钮 -->
        <button type="submit" class="send-btn" :disabled="!input.trim() || loading">
          发送
        </button>

        <button type="button" class="export-btn" @click="exportChat" :disabled="!chatLog.length">导出对话为txt</button>
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
import { sendMessageToSystem } from "@/api/deepseekApi";

const STORAGE_KEY = "kurumi_chat_log";

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


async function sendMessage() {
  if (!input.value.trim()) return;
  const userText = input.value;
  chatLog.value.push({
    id: Date.now(),
    role: "user",
    text: userText,
  });
  input.value = "";
  loading.value = true;


  try {
    //  throw new Error("测试错误");
    const history = chatLog.value.filter((msg) => !msg.isEgg && !msg.isError);
    const botReply = await sendMessageToSystem(userText, history);
    chatLog.value.push({
      id: Date.now() + 1,
      role: "bot",
      text: botReply,
    });

  } catch (e) {
    console.error(e);

    const errorMessages = [
      "能量余额已见底，无法再维持当前剧情演绎。",
      "API余额耗尽，请去b站私信联系我吧",
    ];

    const randomIndex = Math.floor(Math.random() * errorMessages.length);

    chatLog.value.push({
      id: Date.now() + 2,
      role: "bot",
      text: errorMessages[randomIndex],
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
        text: `今天是4月10日，空间震爆警报在天宫市再次响起，街道上人群四散撤离。
而你——五河士道，匆匆赶往妹妹琴里所在的餐厅，心头急促。
就在你踩碎一片倒塌的瓦砾时，一道紫色光芒撕裂天穹——夜刀神十香首次现身于空间震爆的中心，手持光剑，周身环绕着余波扭曲。你意识到，一切的变故，将从此刻与你相连。
准备好了吗？从“初遇”开始，你的故事，由你来书写。`,
      },
    ];
    localStorage.removeItem(STORAGE_KEY);
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
      text: `今天是4月10日，空间震爆警报在天宫市再次响起，街道上人群四散撤离。
而你——五河士道，匆匆赶往妹妹琴里所在的餐厅，心头急促。
就在你踩碎一片倒塌的瓦砾时，一道紫色光芒撕裂天穹——夜刀神十香首次现身于空间震爆的中心，手持光剑，周身环绕着余波扭曲。你意识到，一切的变故，将从此刻与你相连。
准备好了吗？从“初遇”开始，你的故事，由你来书写。`,
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
  const lines = chatLog.value.map(msg => {
    const role = msg.role === 'user' ? '你' : '狂三';
    // 去掉 HTML 标签
    const text = msg.text.replace(/<[^>]+>/g, '').trim();
    return `${role}：${text}`;
  });
  const content = lines.join('\n');
  // 创建 blob 并触发下载
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // 文件名可以加个时间戳
  const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  a.download = `对话记录-${date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}



onMounted(() => {
  scrollToBottom();
  // 2. 每 5 秒切换一次
  timer = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % randomFive.value.length;
  }, 5000);

});

onBeforeUnmount(() => {
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
        background-image: url("@/assets/sdAvatar.jpg");
        box-shadow: 0 0 12px #ff0033;
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


  // 移动端适配（≤768px）
  @media (max-width: 768px) {
    .chat-container {
      width: 100%;
      margin: 0;
      padding: 8px;


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
    }


  }
}
</style>
