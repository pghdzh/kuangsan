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
          <router-link to="/overview" class="btn">角色概览</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import rose from '@/assets/rose.png'
// Canvas 引用
const canvasEl = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D
let animationId: number
let lastTime = 0
let elapsed = 0

// 玫瑰粒子接口，包含摆动参数
interface Rose {
  baseX: number      // 初始水平位置
  y: number          // 垂直位置
  size: number       // 大小
  speed: number      // 垂直速度
  swayAmp: number    // 摆动振幅
  swayFreq: number   // 摆动频率
  phase: number      // 摆动相位
  angle: number      // 旋转角度
  angularSpeed: number // 旋转速度
}

const roses: Rose[] = []
const ROSE_COUNT = 20
const ROSE_IMG = new Image()
ROSE_IMG.src = rose

// 初始化粒子数组，设置每个属性
function initRoses() {
  roses.length = 0
  const canvas = canvasEl.value!
  const w = canvas.width / (window.devicePixelRatio || 1)
  const h = canvas.height / (window.devicePixelRatio || 1)

  for (let i = 0; i < ROSE_COUNT; i++) {
    const baseX = Math.random() * w
    roses.push({
      baseX,
      y: Math.random() * -h,
      size: 30 + Math.random() * 40,
      speed: 30 + Math.random() * 70,
      swayAmp: 20 + Math.random() * 20,
      swayFreq: 0.5 + Math.random() * 1, // 频率 0.5~1.5
      phase: Math.random() * Math.PI * 2,
      angle: Math.random() * Math.PI * 2,
      angularSpeed: (Math.random() - 0.5) * 2
    })
  }
  elapsed = 0
}

// 画布尺寸自适应（支持高清屏）
function resizeCanvas() {
  const canvas = canvasEl.value!
  const parent = canvas.parentElement!
  const dpr = window.devicePixelRatio || 1
  const w = parent.clientWidth
  const h = parent.clientHeight

  canvas.style.width = w + 'px'
  canvas.style.height = h + 'px'
  canvas.width = w * dpr
  canvas.height = h * dpr

  ctx.scale(dpr, dpr)
}

// 帧循环，使用性能时间戳精确计算 dt
function tick(now: number) {
  if (!lastTime) lastTime = now
  const dt = (now - lastTime) / 1000
  lastTime = now
  elapsed += dt

  const canvas = canvasEl.value!
  const w = canvas.clientWidth
  const h = canvas.clientHeight

  // 清空画布
  ctx.clearRect(0, 0, w, h)

  roses.forEach(r => {
    // 垂直下落
    r.y += r.speed * dt

    // 水平正弦摆动
    const sway = r.swayAmp * Math.sin(r.phase + elapsed * r.swayFreq)
    const x = r.baseX + sway

    // 旋转更新
    r.angle += r.angularSpeed * dt

    // 重置到底部
    if (r.y > h + r.size) {
      r.y = -r.size
      r.baseX = Math.random() * w
      r.phase = Math.random() * Math.PI * 2
    }

    // 水平环绕
    if (x > w + r.size) return // 超出右侧不渲染
    if (x < -r.size) return     // 超出左侧不渲染

    // 绘制旋转后的玫瑰
    ctx.save()
    ctx.translate(x, r.y)
    ctx.rotate(r.angle)
    ctx.drawImage(ROSE_IMG, -r.size / 2, -r.size / 2, r.size, r.size)
    ctx.restore()
  })

  animationId = requestAnimationFrame(tick)
}

onMounted(() => {
  const canvas = canvasEl.value!
  ctx = canvas.getContext('2d')!

  // 图片加载后初始化并启动动画
  ROSE_IMG.onload = () => {
    resizeCanvas()
    initRoses()
    animationId = requestAnimationFrame(tick)
  }

  window.addEventListener('resize', () => {
    cancelAnimationFrame(animationId)
    resizeCanvas()
    initRoses()
    lastTime = 0
    animationId = requestAnimationFrame(tick)
  })
})

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  window.removeEventListener('resize', resizeCanvas)
})
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
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;

      .hero-text {
        max-width: 50%;
        opacity: 0;
        transform: translateX(-20px);
        animation: fadeInRight 1s 0.5s forwards;

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
        }

        .btn {
          display: inline-block;
          padding: 10px 30px;
          font-family: "Cinzel Sans", sans-serif;
          font-size: 1rem;
          background: transparent;
          border: 2px solid #d14b4b;
          border-radius: 50px;
          text-decoration: none;
          color: #d14b4b;
          transition: background 0.3s, color 0.3s;

          &:hover {
            background: #d14b4b;
            color: #1b1b1b;
          }
        }
      }
    }
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
</style>
