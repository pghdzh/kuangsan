<template>
  <div class="gallery-container">
    <button class="upload-btn" @click="openUploadModal">上传图片</button>
    <section class="gallery section">
      <div class="gallery-grid">
        <div v-for="(img, index) in images" :key="index" class="card" @click="openLightbox(index)" ref="cards">
          <div class="card-inner">
            <img :src="img.src" :alt="img.alt" loading="lazy" @load="onImageLoad($event)" />
            <div class="overlay">
              <span>查看大图</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    <aside class="ranking-panel">
      <h3 class="ranking-title">上传排行榜</h3>
      <ul class="ranking-list">
        <li v-for="(item, idx) in rankingList" :key="idx" class="ranking-item" :class="`rank-${idx + 1}`">
          <span class="rank">{{ idx + 1 }}</span>
          <span class="name">{{ item.nickname }}</span>
          <span class="count">{{ item.count }} 张</span>
        </li>
      </ul>
    </aside>
    <!-- Lightbox Modal -->
    <div v-if="lightboxOpen" class="lightbox" @click.self="closeLightbox">
      <span class="close" @click="closeLightbox">✕</span>
      <span class="prev" @click.stop="prevImage">‹</span>
      <img :src="images[currentIndex].src" :alt="images[currentIndex].alt" />
      <span class="next" @click.stop="nextImage">›</span>
    </div>

    <!-- 上传弹窗 -->
    <div v-if="uploadModalOpen" class="upload-modal-overlay" @click.self="closeUploadModal">
      <div class="upload-modal">
        <h3>批量上传图片</h3>
        <p class="stats">
          今日已上传：<strong>{{ uploadedToday }}</strong> 张，
          剩余可上传：<strong>{{ remaining }}</strong> 张
        </p>
        <label>
          昵称：
          <input v-model="nickname" type="text" placeholder="请输入昵称" />
        </label>
        <label>
          选择图片（最多 {{ remaining }} 张）：
          <input ref="fileInput" type="file" multiple accept="image/*" @change="handleFileSelect" />
        </label>
        <p class="tip" v-if="selectedFiles.length">
          已选 {{ selectedFiles.length }} 张
        </p>
        <div class="modal-actions">
          <button :disabled="!canSubmit || isUploading" @click="submitUpload">
            {{ isUploading ? "上传中..." : "立即上传" }}
          </button>
          <button class="cancel" @click="closeUploadModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, nextTick } from "vue";
import { uploadImages, getAllImages } from "@/api/modules/images"; // 前面封装的上传接口
import { getRankingList } from "@/api/modules/ranking"; // 根据你的实际路径调整

interface ImageItem {
  src: string;
  alt: string;
}

interface RankingItem {
  id?: number; // 如果接口返回有 id，可加上
  nickname: string;
  count: number;
}
const rankingList = ref<RankingItem[]>([]);

// 默认分页参数（如不分页可省略）
const page = 1;
const pageSize = 99;

const fetchRanking = async () => {
  const res = await getRankingList({ page, pageSize });
  if (res.success) {
    rankingList.value = res.data;
  } else {
    console.error("获取排行榜失败", res.message);
  }
};

// 自动导入 assets/gallery 下所有图片
const modules1 = import.meta.glob("@/assets/images/*.{jpg,jpeg,png,gif,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});



// 转成 ImageItem[]
const staticImages = Object.values(modules1).map(url => ({
  src: url,
  alt: '',
}))

// 响应式存放最终图片列表
const images = ref<ImageItem[]>([])

const lightboxOpen = ref(false);
const currentIndex = ref(0);

function openLightbox(index: number) {
  currentIndex.value = index;
  lightboxOpen.value = true;
}
function closeLightbox() {
  lightboxOpen.value = false;
}
function prevImage() {
  currentIndex.value =
    (currentIndex.value + images.value.length - 1) % images.value.length;
}
function nextImage() {
  currentIndex.value = (currentIndex.value + 1) % images.value.length;
}

// 渐显＆Blur‑Up 效果
function onImageLoad(e: Event) {
  const img = e.target as HTMLImageElement;
  const card = img.closest(".card");
  card?.classList.add("loaded");
}


// 上传弹窗逻辑

const uploadModalOpen = ref(false);
const nickname = ref("");
const fileInput = ref<HTMLInputElement>();
const selectedFiles = ref<File[]>([]);

// 从 localStorage 读取“今天”已上传数量
function getTodayKey() {
  return `uploaded_${new Date().toISOString().slice(0, 10)}`;
}
const uploadedToday = ref<number>(
  Number(localStorage.getItem(getTodayKey()) || 0)
);
const remaining = computed(() => Math.max(20 - uploadedToday.value, 0));

// 控制提交按钮
const canSubmit = computed(() => {
  return (
    nickname.value.trim().length > 0 &&
    selectedFiles.value.length > 0 &&
    selectedFiles.value.length <= remaining.value
  );
});

function openUploadModal() {
  nickname.value = "";
  selectedFiles.value = [];
  if (fileInput.value) fileInput.value.value = "";
  // 每次打开重新刷新已上传数
  uploadedToday.value = Number(localStorage.getItem(getTodayKey()) || 0);
  uploadModalOpen.value = true;
}
function closeUploadModal() {
  uploadModalOpen.value = false;
}

// 本地截断到剩余数量
function handleFileSelect(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || []);

  if (!files) return;

  const validFiles: File[] = [];
  for (const file of files) {
    if (file.size > 20 * 1024 * 1024) {
      alert(`文件太大：${file.name}，请控制在 20MB 内`);
      continue;
    }
    validFiles.push(file);
  }

  if (validFiles.length === 0) return;

  if (validFiles.length > remaining.value) {
    alert(
      `今天最多还能上传 ${remaining.value} 张，已为你截取前 ${remaining.value} 张`
    );
    selectedFiles.value = files.slice(0, remaining.value);
  } else {
    selectedFiles.value = files;
  }
}
const isUploading = ref(false);
async function submitUpload() {
  if (!canSubmit.value) return;
  isUploading.value = true;
  try {
    const res = await uploadImages(selectedFiles.value, nickname.value.trim());
    const uploadedCount = res.data.length;
    // 更新 localStorage
    uploadedToday.value += uploadedCount;
    localStorage.setItem(getTodayKey(), String(uploadedToday.value));

    alert(`成功上传 ${uploadedCount} 张图片`);
    closeUploadModal();
    // …可选：刷新画廊列表或把新图片追加到 images …
  } catch (err: any) {
    console.error(err);
    alert(err.message || "上传失败");
  } finally {
    isUploading.value = false;
  }
}

// Scroll-triggered lazy animation
onMounted(async () => {
  fetchRanking();

  const res = await getAllImages()
  const remoteUrls = res.images
  const remoteImages = remoteUrls.map(url => ({
    src: url,
    alt: '',
  }))
  images.value = [
    ...staticImages,
    ...remoteImages,
  ]
  await nextTick()
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll(".card").forEach((el) => {
    observer.observe(el);
  });
});
</script>

<style lang="scss" scoped>
$bg: #0d0d0d;
$accent: #d14b4b;
$text: #fde8e8;
$highlight: #ffd700;

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

.gallery-container {
  background: radial-gradient(circle at center, #111 0%, $bg 100%);
  color: $text;
  min-height: 100vh;
  padding-bottom: 60px;

  .section {
    padding: 80px 20px;
    max-width: 1200px;
    margin: 0 auto;

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 24px;

      .card {
        perspective: 1000px;
        opacity: 0;
        transform: translateY(20px);

        &.visible {
          animation: fadeInUp 0.6s ease forwards;
        }

        &.loaded {

          // Blur-up & grayscale removed
          .card-inner img {
            filter: none;
            opacity: 1;
          }
        }

        .card-inner {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
          transform-style: preserve-3d;
          transition: transform 0.5s ease, box-shadow 0.5s ease;

          &:hover {
            transform: rotateY(6deg) rotateX(3deg) scale(1.05);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.9);
          }

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
            filter: blur(20px) grayscale(100%);
            opacity: 0.6;
            transition: filter 0.6s ease, opacity 0.6s ease;
          }

          .overlay {
            position: absolute;
            bottom: 0;
            width: 100%;
            padding: 12px 0;
            background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
            text-align: center;
            opacity: 0;
            transition: opacity 0.4s;

            span {
              color: $text;
              font-family: "Cinzel Decorative", serif;
              font-size: 1.1rem;
              letter-spacing: 1px;
              background: rgba(0, 0, 0, 0.6);
              padding: 4px 12px;
              border-radius: 20px;
            }
          }

          &:hover .overlay {
            opacity: 1;
          }
        }
      }
    }
  }

  .lightbox {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    img {
      max-width: 85%;
      max-height: 85%;
      border: 3px solid $accent;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.9);
      animation: fadeInUp 0.4s ease;
    }

    .close,
    .prev,
    .next {
      position: absolute;
      color: $text;
      font-size: 2.5rem;
      cursor: pointer;
      user-select: none;
      padding: 8px;
      background: rgba(27, 27, 27, 0.8);
      border-radius: 50%;
      transition: background 0.3s;

      &:hover {
        background: $accent;
      }
    }

    .close {
      top: 20px;
      right: 20px;
    }

    .prev {
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
    }

    .next {
      right: 20px;
      top: 50%;
      transform: translateY(-50%);
    }
  }

  /* 上传按钮 */
  .upload-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    padding: 14px 24px;
    background: #d14b4b;
    color: #fde8e8;
    font-size: 1rem;
    border: none;
    border-radius: 28px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
    cursor: pointer;
    transition: transform 0.2s, background 0.3s;
    z-index: 10;

    &:hover {
      transform: scale(1.08);
      background: #ffd700;
      color: #111;
    }
  }

  /* 上传弹窗遮罩 */
  .upload-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  /* 弹窗主体 */
  .upload-modal {
    background: #1a1a1a;
    padding: 32px;
    border-radius: 12px;
    width: 360px;
    color: #fde8e8;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
    position: relative;

    .stats {
      margin-bottom: 16px;
      font-size: 0.95rem;

      strong {
        color: #d14b4b;
      }
    }

    .tip {
      margin-top: 8px;
      font-size: 0.9rem;
      color: #ffd700;
      text-align: right;
    }

    h3 {
      margin-bottom: 12px;
      font-size: 1.4rem;
      color: #ffd700;
    }

    .remaining {
      margin-bottom: 16px;
      font-size: 0.9rem;

      strong {
        color: #d14b4b;
        font-size: 1.1rem;
      }
    }

    label {
      display: block;
      margin-bottom: 14px;
      font-size: 0.95rem;

      input[type="text"],
      input[type="file"] {
        width: 100%;
        margin-top: 6px;
        padding: 8px 10px;
        border-radius: 6px;
        border: 1px solid #444;
        background: #111;
        color: #fde8e8;
      }
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;

      button {
        padding: 10px 20px;
        border: none;
        border-radius: 22px;
        cursor: pointer;
        background: #d14b4b;
        color: #fde8e8;
        font-weight: bold;
        transition: background 0.3s;

        &:hover:not(:disabled) {
          background: #ffd700;
          color: #111;
        }

        &:disabled {
          background: #555;
          cursor: not-allowed;
        }
      }

      .cancel {
        background: transparent;
        border: 2px solid #fde8e8;
        color: #fde8e8;

        &:hover {
          background: rgba(255, 215, 0, 0.2);
        }
      }
    }
  }

  .ranking-panel {
    width: 240px;
    padding: 24px 16px;
    margin-left: 24px;
    background: radial-gradient(circle at top right, rgba(29, 29, 29, 0.9), rgba(13, 13, 13, 0.9));
    border-radius: 16px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.7);
    position: fixed;
    top: 80px;
    right: 24px;
    color: $text;

    .ranking-title {
      font-size: 1.3rem;
      color: $accent;
      text-align: center;
      margin-bottom: 16px;
      font-family: "Cinzel Decorative", serif;
    }

    .ranking-list {
      list-style: none;
      padding: 0;
      margin: 0;

      .ranking-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
        margin-bottom: 4px;
        border-radius: 12px;
        transition: background 0.3s;

        &:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        // 前三名主色区分
        &.rank-1 {
          background: rgba(209, 75, 75, 0.2);
        }

        &.rank-2 {
          background: rgba(255, 215, 0, 0.2);
        }

        &.rank-3 {
          background: rgba(255, 255, 255, 0.1);
        }

        .rank {
          width: 28px;
          text-align: center;
          font-weight: bold;
          font-size: 1rem;
          color: #ffe;
        }

        .name {
          flex: 1;
          padding: 0 8px;
          font-size: 0.9rem;
        }

        .count {
          font-size: 0.85rem;
          color: $highlight;
        }
      }
    }
  }
}

/* 小屏适配 */
@media (max-width: 767px) {
  .ranking-panel {
    display: none;
  }
}
</style>
