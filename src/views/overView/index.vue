<template>
  <div class="overview-container">
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

    <!-- 基本信息 -->
    <section class="basic-info section">
      <div class="section-deco"></div>
      <h2 class="section-title">基本信息</h2>
      <ul class="info-list">
        <li><span class="label">中文名：</span>时崎狂三</li>
        <li><span class="label">外文名：</span>時崎 狂三（ときさき くるみ）</li>
        <li><span class="label">罗马音：</span>Tokisaki Kurumi</li>
        <li><span class="label">别名：</span>梦魇（Nightmare）</li>
        <li><span class="label">声优：</span>真田麻美</li>
        <li><span class="label">性别：</span>女</li>
        <li>
          <span class="label">登场作品：</span>轻小说《约会大作战》及其衍生作品
        </li>
      </ul>
    </section>

    <!-- 身体数据 -->
    <section class="stats section">
      <h2 class="section-title">身体数据</h2>
      <ul class="stats-list">
        <li><span class="label">生日：</span>6月10日</li>
        <li><span class="label">年龄：</span>外表16岁，实际40岁以上</li>
        <li><span class="label">身高：</span>157cm</li>
        <li><span class="label">三围：</span>85 / 59 / 87 cm</li>
      </ul>
    </section>

    <!-- 角色形象 -->
    <section class="appearance section">
      <h2 class="section-title">角色形象</h2>
      <p>
        一头黑色双麻花辫，瀑布刘海遮住左半面容，右侧露出酒红色眸子。纤细如瓷的身姿与樱唇勾勒出魔鬼般魅力，皮肤如珍珠般白晢。通常以哥特萝莉或修道服风格亮相。
      </p>
    </section>

    <!-- 性格特点 -->
    <section class="personality section">
      <h2 class="section-title">性格特点</h2>
      <ul class="personality-list">
        <li>外表可爱少女，内心冷酷杀手，常将人类视为食物，已杀超过一万人。</li>
        <li>喜欢猫却不愿让人知道，对小猫会脸红扭动。</li>
        <li>深爱士道，却不愿被封印；分身常光明示爱，真实感情深藏不露。</li>
        <li>曾有“狂三四天王”的中二历史，中二分身自称超强存在。</li>
      </ul>
    </section>

    <!-- 灵装 & 天使 -->
    <section class="powers section">
      <h2 class="section-title">灵装 &amp; 天使</h2>
      <ul class="powers-list">
        <li>
          <strong>灵装</strong
          >：神威灵装·三番（Elohim），哥特风洋装与修道服融合，能吸收灵结晶增强形态。
        </li>
        <li>
          <strong>天使</strong
          >：刻刻帝（Zafkiel），巨大时钟形态，长短针为古式步枪与手枪，子弹拥有各种能力。
        </li>
      </ul>
    </section>

    <!-- 天使技能 -->
    <section class="skills section">
      <h2 class="section-title">天使技能（Zafkiel 弹丸）</h2>
      <ul class="skills-list">
        <li><strong>Aleph（⼀之弹）</strong>：加速目标时间，可瞬移。</li>
        <li><strong>Bet（二之弹）</strong>：减缓目标时间流动。</li>
        <li><strong>Gimel（三之弹）</strong>：改变对象成长速度。</li>
        <li><strong>Dalet（四之弹）</strong>：使时间倒流，重置状态。</li>
        <li><strong>Hei（五之弹）</strong>：预见短暂未来。</li>
        <li><strong>Vav（六之弹）</strong>：意识移至过去自己身体。</li>
        <li><strong>Zayin（七之弹）</strong>：时间静止。</li>
        <li><strong>Het（八之弹）</strong>：召唤分身，替换自身。</li>
        <li><strong>Tet（九之弹）</strong>：连接不同时间轴个体意识。</li>
        <li><strong>Yud（十之弹）</strong>：传送击中目标的过去记忆。</li>
        <li>
          <strong>Yud-Aleph（十一之弹）</strong>：吞噬灵力后送目标至未来。
        </li>
        <li>
          <strong>Yud-Bet（十二之弹）</strong
          >：吞噬灵力后送目标至过去，可多重分身。
        </li>
      </ul>
    </section>

    <!-- 特殊能力 -->
    <section class="special section">
      <h2 class="section-title">特殊能力</h2>
      <ul class="special-list">
        <li><strong>空间震</strong>：凭意志引发范畴震动。</li>
        <li><strong>食时之城</strong>：结界吸收生命时间，禁锢生灵。</li>
        <li><strong>影子空间</strong>：隐身、储存分身与囚禁生体。</li>
        <li><strong>嗫告篇帙（Ratziel）</strong>：二亚天使力量再现。</li>
      </ul>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";

// 1. 全量导入，直接映射成 string[]
const modules = import.meta.glob("@/assets/images2/*.{jpg,png,jpeg,webp}", {
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
</script>

<style lang="scss" scoped>
.overview-container {
  color: #fde8e8;
  background-color: #1b1b1b;
  min-height: 100vh;
  padding-top: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
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

  .section {
    width: 80%;
    max-width: 900px;
    margin: 40px 0;
    background: rgba(27, 27, 27, 0.85);
    padding: 32px;
    border-radius: 16px;
    backdrop-filter: blur(6px);
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.8s ease forwards;

    // 每个分区延迟
    &:nth-of-type(1) {
      animation-delay: 0.2s;
    }
    &:nth-of-type(2) {
      animation-delay: 0.4s;
    }
    &:nth-of-type(3) {
      animation-delay: 0.6s;
    }
    &:nth-of-type(4) {
      animation-delay: 0.8s;
    }
    &:nth-of-type(5) {
      animation-delay: 1s;
    }
    &:nth-of-type(6) {
      animation-delay: 1.2s;
    }
    &:nth-of-type(7) {
      animation-delay: 1.4s;
    }

    .section-title {
      font-family: "Cinzel Decorative", serif;
      font-size: 2.2rem;
      color: #e8bebe;
      border-bottom: 2px solid #d14b4b;
      display: inline-block;
      margin-bottom: 24px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      &.info-list,
      &.stats-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px 24px;
      }
      &.personality-list,
      &.powers-list,
      &.special-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 16px;
      }
      &.skills-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px 24px;
      }

      li {
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 8px;
        transition: background 0.3s;

        &:hover {
          background: rgba(209, 75, 75, 0.2);
        }

        .label {
          font-weight: bold;
          color: #d14b4b;
          margin-right: 8px;
        }

        strong {
          color: #ffd700;
        }
      }

      p & {
        margin: 0;
      }
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
