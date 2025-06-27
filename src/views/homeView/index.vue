<template>
  <div class="home-container">
    <!-- 主视觉区 -->
    <section class="hero">
      <!-- Canvas 层 -->
      <canvas ref="canvasEl" class="rose-canvas"></canvas>
      <div class="hero-overlay">
        <div class="hero-text">
          <h1>时崎狂三</h1>
          <p>追寻时间的脚步，掌控命运的轮回</p>
          <router-link to="/overview" class="btn" aria-label="角色概览">角色概览</router-link>
        </div>
      </div>
      <!-- 时钟齿轮装饰 -->
      <div class="gear-deco gear1"></div>
      <div class="gear-deco gear2"></div>
      <div class="thank-list">
        <h3>感谢名单</h3>
        <div class="scroll-list">
          <div class="thank-item">莺时零散</div>
          <div class="thank-item">kurumi</div>
          <div class="thank-item">翎蘊</div>
          <div class="thank-item">神乐三三</div>
          <div class="thank-item">doMGameMaker</div>

        </div>
      </div>
    </section>

    <!-- 页脚波浪 -->
    <footer class="footer-wave-3">
      <svg class="wave wave1" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="waveGrad3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#ff4f4f" />
            <stop offset="100%" stop-color="#800000" />
          </linearGradient>
        </defs>
        <path d="M0,40 C300,140 900,-20 1200,60 L1200,100 L0,100 Z" fill="url(#waveGrad3)" />
      </svg>
      <svg class="wave wave2" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <path d="M0,50 C400,0 800,150 1200,50 L1200,100 L0,100 Z" fill="rgba(255,79,79,0.6)" />
      </svg>
      <svg class="wave wave3" viewBox="0 0 1200 100" preserveAspectRatio="none">
        <path d="M0,30 C200,80 1000,20 1200,70 L1200,100 L0,100 Z" fill="rgba(255,79,79,0.3)" />
      </svg>
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import rose from "@/assets/rose.png";

const canvasEl = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D;
let animationId: number;
let lastTime = 0;
let elapsed = 0;

interface Rose {
  baseX: number;
  y: number;
  size: number;
  speed: number;
  swayAmp: number;
  swayFreq: number;
  phase: number;
  angle: number;
  angularSpeed: number;
}

const roses: Rose[] = [];
const ROSE_COUNT_DESKTOP = 20;
const ROSE_COUNT_MOBILE = 8;
const ROSE_IMG = new Image();
ROSE_IMG.src = rose;

function initRoses(count: number) {
  roses.length = 0;
  const canvas = canvasEl.value!;
  const w = canvas.width / (window.devicePixelRatio || 1);
  const h = canvas.height / (window.devicePixelRatio || 1);

  for (let i = 0; i < count; i++) {
    const baseX = Math.random() * w;
    roses.push({
      baseX,
      y: Math.random() * -h,
      size: 30 + Math.random() * 40,
      speed: 30 + Math.random() * 70,
      swayAmp: 20 + Math.random() * 20,
      swayFreq: 0.5 + Math.random() * 1,
      phase: Math.random() * Math.PI * 2,
      angle: Math.random() * Math.PI * 2,
      angularSpeed: (Math.random() - 0.5) * 2,
    });
  }
  elapsed = 0;
}

let resizeTimeout: number;
function resizeCanvas() {
  window.clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    cancelAnimationFrame(animationId);
    const canvas = canvasEl.value!;
    const parent = canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    const h = parent.clientHeight;

    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    canvas.width = w * dpr;
    canvas.height = h * dpr;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const isMobile = w < 768;
    initRoses(isMobile ? ROSE_COUNT_MOBILE : ROSE_COUNT_DESKTOP);
    lastTime = 0;
    animationId = requestAnimationFrame(tick);
  }, 200);
}

function tick(now: number) {
  if (!lastTime) lastTime = now;
  const dt = (now - lastTime) / 1000;
  lastTime = now;
  elapsed += dt;

  const canvas = canvasEl.value!;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);

  roses.forEach((r) => {
    r.y += r.speed * dt;
    const sway = r.swayAmp * Math.sin(r.phase + elapsed * r.swayFreq);
    const x = r.baseX + sway;
    r.angle += r.angularSpeed * dt;

    if (r.y > h + r.size) {
      r.y = -r.size;
      r.baseX = Math.random() * w;
      r.phase = Math.random() * Math.PI * 2;
    }

    if (x > w + r.size || x < -r.size) return;

    ctx.save();
    ctx.translate(x, r.y);
    ctx.rotate(r.angle);
    ctx.drawImage(ROSE_IMG, -r.size / 2, -r.size / 2, r.size, r.size);
    ctx.restore();
  });

  animationId = requestAnimationFrame(tick);
}

onMounted(() => {
  const canvas = canvasEl.value!;
  ctx = canvas.getContext("2d")!;

  ROSE_IMG.onload = () => {
    resizeCanvas();
  };
  window.addEventListener("resize", resizeCanvas);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener("resize", resizeCanvas);
});
</script>

<style lang="scss" scoped>
.home-container {
  .hero {
    position: relative;
    width: 100%;
    height: 100vh;
    background: radial-gradient(circle at center, #3e1a1a, #0d0d0d);
    overflow: hidden;

    .rose-canvas {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
    }

    .hero-overlay {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .hero-text {
        max-width: 800px;
        width: 50%;
        text-align: center;
        opacity: 0;
        transform: translateX(-20px);
        animation: fadeInRight 1s 0.5s cubic-bezier(0.68, -0.6, 0.32, 1.6) forwards;

        h1 {
          font-family: "Cinzel Decorative", serif;
          font-size: 4rem;
          margin: 0;
          color: #e8bebe;
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.7);
        }

        p {
          font-size: 1.25rem;
          margin: 16px 0;
          font-style: italic;
          color: #f8dcdc;
          position: relative;

          &::after {
            content: "";
            display: block;
            width: 60px;
            height: 2px;
            margin: 12px auto 0;
            background: linear-gradient(90deg,
                rgba(232, 190, 190, 0),
                rgba(232, 190, 190, 1));
          }
        }

        .btn {
          display: inline-block;
          padding: 10px 30px;
          margin-top: 16px;
          font-family: "Cinzel Sans", sans-serif;
          font-size: 1rem;
          background: transparent;
          border: 2px solid #d14b4b;
          border-radius: 50px;
          text-decoration: none;
          color: #d14b4b;
          transition: background 0.3s, color 0.3s, box-shadow 0.3s;

          &:hover {
            background: #d14b4b;
            color: #1b1b1b;
            box-shadow: 0 0 8px rgba(213, 75, 75, 0.7);
          }

          &:focus {
            outline: none;
            box-shadow: 0 0 0 3px rgba(209, 75, 75, 0.5);
          }
        }
      }
    }

    .gear-deco {
      position: absolute;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 50%;
      pointer-events: none;

      &.gear1 {
        width: 200px;
        height: 200px;
        top: 10%;
        left: 5%;
      }

      &.gear2 {
        width: 150px;
        height: 150px;
        bottom: 15%;
        right: 10%;
      }
    }

    .thank-list {
      position: absolute;
      top: 50%;
      right: 5%;
      transform: translateY(-50%);
      width: 22%;
      height: 40%;
      padding: 16px;
      background: rgba(20, 10, 10, 0.6);
      border: 2px solid rgba(232, 190, 190, 0.6);
      border-radius: 16px;
      box-shadow: 0 0 16px rgba(209, 75, 75, 0.8), 0 8px 24px rgba(0, 0, 0, 0.7);
      color: #e8bebe;
      overflow: hidden;
      z-index: 10;
      backdrop-filter: blur(4px);
      animation: glowBorder 3s ease-in-out infinite alternate;

      h3 {
        margin: 0 0 12px;
        font-family: "Cinzel Decorative", serif;
        font-size: 1.5rem;
        text-align: center;
        text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.7);
      }

      .scroll-list {
        position: relative;
        height: calc(100% - 2.5rem);
        overflow: hidden;

        &::before,
        &::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          height: 20%;
          pointer-events: none;
          z-index: 5;
        }

      }

      .thank-item {
        margin: 8px 0;
        padding: 8px 12px;
        background: linear-gradient(135deg,
            rgba(209, 75, 75, 0.4),
            rgba(128, 0, 0, 0.4));
        border: 1px solid rgba(209, 75, 75, 0.8);
        border-radius: 24px;
        text-align: center;
        font-size: 0.95rem;
        font-weight: 500;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.7);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
        transform-style: preserve-3d;
        transition: transform 0.3s;
        cursor: default;
        position: relative;
        z-index: 2;
        /* 浮动效果 */
        animation: float 4s ease-in-out infinite alternate;

        /* 不同序号随机时长 */
        &:nth-child(4n + 1) {
          animation-duration: 5s;
        }

        &:nth-child(4n + 2) {
          animation-duration: 6s;
        }

        &:nth-child(4n + 3) {
          animation-duration: 4.5s;
        }

        &:nth-child(4n) {
          animation-duration: 5.5s;
        }

        &:hover {
          transform: translateZ(10px) scale(1.08);
          box-shadow: 0 6px 16px rgba(209, 75, 75, 0.8);
        }
      }

      /* 边框发光动画 */
      @keyframes glowBorder {
        from {
          box-shadow: 0 0 8px rgba(209, 75, 75, 0.6),
            0 4px 12px rgba(0, 0, 0, 0.5);
        }

        to {
          box-shadow: 0 0 16px rgba(209, 75, 75, 1),
            0 8px 24px rgba(0, 0, 0, 0.7);
        }
      }


      /* 徽章浮动：小幅上下漂浮与轻微旋转 */
      @keyframes float {
        0% {
          transform: translateY(0) rotateZ(0deg);
        }

        100% {
          transform: translateY(-6px) rotateZ(-2deg);
        }
      }


    }


  }

  .footer-wave-3 {
    position: relative;
    width: 100%;
    height: 120px;
    margin-top: -125px;
    overflow: hidden;

    .wave {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 200%;
      height: 100%;
      transform: translateX(0);
    }

    .wave1 {
      animation: waveMove 16s linear infinite;
      z-index: 1;
    }

    .wave2 {
      animation: waveMove 24s linear infinite;
      z-index: 2;
      animation-delay: -4s;
    }

    .wave3 {
      animation: waveMove 32s linear infinite;
      z-index: 3;
      animation-delay: -8s;
    }
  }

  @keyframes waveMove {
    0% {
      transform: translateX(0);
    }

    100% {
      transform: translateX(-50%);
    }
  }

  @keyframes fadeInRight {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }

    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes arrowBounce {

    0%,
    100% {
      transform: translateY(0) rotate(-45deg);
    }

    50% {
      transform: translateY(-10px) rotate(-45deg);
    }
  }
}

/* 小屏适配 */
@media (max-width: 767px) {
  .home-container .hero .hero-overlay .hero-text {
    width: 80%;
  }

  .hero .thank-list {
    display: none;
  }
}
</style>
