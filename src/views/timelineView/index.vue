<template>
  <div class="timeline-container">
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

    <section class="timeline section">
      <ul class="timeline-list">
        <li
          v-for="(event, idx) in timeline"
          :key="idx"
          :class="[
            { left: idx % 2 === 0, right: idx % 2 !== 0 },
            'timeline-item',
          ]"
        >
          <div class="dot"></div>
          <div class="connector"></div>
          <div class="content">
            <h3 class="event-title">{{ event.title }}</h3>
            <ul class="details">
              <li v-for="(line, i) in event.details" :key="i">{{ line }}</li>
            </ul>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";

// 1. 全量导入，直接映射成 string[]
const modules = import.meta.glob("@/assets/images2/*.{jpg,png,jpeg}", {
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

onMounted(() => {
  // 2. 每 5 秒切换一次
  timer = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % randomFive.value.length;
  }, 5000);
});

onUnmounted(() => {
  clearInterval(timer);
});
interface TimelineEvent {
  title: string;
  details: string[];
}

const timeline = ref<TimelineEvent[]>([
  {
    title: "成为精灵",
    details: [
      "原为普通人类大小姐，被崇宫澪赋予灵结晶，获得“时之精灵”与天使“刻刻帝”。",
      "助澪消灭精灵，经历史发现真相后险些反转，使用四之弹自救。",
    ],
  },
  {
    title: "失忆与重获记忆",
    details: [
      "遭澪送往邻界，回归现界后失去记忆，仅知拥有刻刻帝。",
      "凭十之弹恢复记忆，决意改变过去，寻找灵力源泉。",
    ],
  },
  {
    title: "个人主线（转学）",
    details: [
      "转入来禅高中，主动接近士道以夺取其灵力。",
      "遭遇真那攻击，分身被杀，显现本尊与真那、十香等对抗。",
      "意图引发空间震摧毁学校，被琴里阻止。",
    ],
  },
  {
    title: "琴里时期",
    details: [
      "与完全灵力的琴里交战，被击败并重伤，幸得士道护盾逃脱。",
      "亲吻昏迷士道，被封印六之弹灵力。",
      "灵装恢复，遇“幻影”筹划十二之弹之旅。",
    ],
  },
  {
    title: "美九时期",
    details: [
      "与士道联手潜入美九宅邸，利用十之弹探查情报。",
      "在天央祭会场召唤分身抗衡控制人群，为士道创造接触机会。",
      "协助士道潜入DEM社营救十香，之后消失继续追寻第二精灵。",
    ],
  },
  {
    title: "折纸时期",
    details: [
      "应精灵化折纸请求，使用十二之弹送其回五年前。",
      "目睹折纸反转灾难，吸收士道灵力使用十二之弹救援折纸。",
      "在新世界线见士道后尝试窥探记忆，未能得知对方心意。",
    ],
  },
  {
    title: "士道暴走 & 二亚时期",
    details: [
      "士道被DEM社追捕并暴走，狂三试图救援并追寻第二精灵。",
      "在二亚住所获得嗫告篇帙力量，改变目标对始源精灵的计划。",
    ],
  },
  {
    title: "六喰与复学",
    details: [
      "士道成功封印六喰后，狂三以复学为名重返校园。",
      "与士道商议封印条件，并在天台展开深夜对话。",
    ],
  },
  {
    title: "改变事实",
    details: [
      "多次使用六之弹尝试阻止DEM社暗杀士道，引发精神衰弱。",
      "在分身与幻影的纷争中，留给士道生还线索。",
    ],
  },
  {
    title: "与士道约会",
    details: [
      "连续数日与士道进行互动挑战与约会，逐渐培养情感。",
      "情人节巧克力与内衣店试穿后，使用十之弹透露心意与计划。",
    ],
  },
  {
    title: "澪时期与结局",
    details: [
      "澪本体袭击致命，分身牺牲提醒士道使用六之弹逃脱。",
      "狂三本体继承分身记忆与灵力，与DEM社终极对决，拯救世界。",
    ],
  },
]);
</script>

<style lang="scss" scoped>
$bg-color: #1b1b1b;
$panel-bg: rgba(27, 27, 27, 0.9);
$accent: #d14b4b;
$accent-light: rgba(209, 75, 75, 0.15);
$text-light: #fde8e8;
$text-highlight: #ffd700;

.timeline-container {
  background: $bg-color;
  color: $text-light;
  padding: 100px 0;
  min-height: 100vh;
  overflow-x: hidden;
  .carousel {
    position: absolute;
    inset: 0;
    z-index: 0;
    /* 放在最底层 */
    /* 叠加所有图片，通过 opacity 实现切换 */
    .carousel-image {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transition: opacity 1s ease;
      filter: blur(1.5px); /* 轻微模糊 */
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
    background: rgba(0, 0, 0, 0.2); /* 遮罩透明度可调 */
    pointer-events: none;
    z-index: 1;
  }
}

.timeline-list {
  position: relative;
  width: 90%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 0;
  list-style: none;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 50%;
    width: 6px;
    height: 100%;
    background: $accent;
    transform: translateX(-50%);
    border-radius: 3px;
  }

  .timeline-item {
    position: relative;
    width: 50%;
    padding: 30px 20px;
    box-sizing: border-box;
    opacity: 0;
    transform: translateY(30px);
    animation: fadeInUp 0.8s ease forwards;

    &.left {
      left: 0;
    }

    &.right {
      left: 50%;
    }

    @for $i from 1 through 11 {
      &:nth-of-type(#{$i}) {
        animation-delay: #{0.2 * $i}s;
      }
    }

    .dot {
      position: absolute;
      top: 40px;
      left: 50%;
      width: 18px;
      height: 18px;
      background: $accent;
      border: 4px solid $bg-color;
      border-radius: 50%;
      transform: translateX(-50%);
      box-shadow: 0 0 8px rgba(209, 75, 75, 0.7);
      animation: pulse 2s ease-in-out infinite;
      z-index: 2;
    }

    .connector {
      position: absolute;
      top: 70px;
      left: 50%;
      width: 4px;
      height: 20px;
      background: $accent-light;
      transform: translateX(-50%);
    }

    .content {
      position: relative;
      background: $panel-bg;
      padding: 24px;
      border-radius: 12px;
      backdrop-filter: blur(6px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      transition: transform 0.3s;

      &:hover {
        transform: translateY(-5px) scale(1.02);
      }

      h3.event-title {
        font-family: "Cinzel Decorative", serif;
        font-size: 1.8rem;
        color: $text-highlight;
        margin-bottom: 12px;
      }

      .details {
        list-style: disc inside;
        margin: 0;
        padding: 0;

        li {
          margin: 8px 0;
          line-height: 1.6;
        }
      }
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: translateX(-50%) scale(1);
  }

  50% {
    transform: translateX(-50%) scale(1.3);
  }
}
</style>
