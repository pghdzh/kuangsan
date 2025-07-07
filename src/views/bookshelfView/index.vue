<template>
  <div class="bookshelf-page">
    <!-- 顶部 -->
    <header class="header">
      <h1 class="page-title">狂三对话书架</h1>
      <button class="upload-btn" @click="showUploadModal = true">
        上传文档
      </button>
    </header>

    <!-- 书架列表 -->
    <section class="bookshelf">
      <div
        v-for="(book, i) in books"
        :key="book.name + i"
        class="book-card"
        :class="{ open: currentBook === i }"
        @click="openBook(i)"
      >
        <div class="cover-bg"></div>
        <div class="cover-content">
          <h3 class="cover-title">{{ book.name }}</h3>
          <p class="cover-uploader">{{ book.uploader }}</p>
        </div>
      </div>
    </section>

    <!-- 阅读器 -->
    <div
      v-if="currentBook !== null"
      class="reader-overlay"
      @click.self="closeBook"
    >
      <transition name="flip">
        <div class="reader-container" key="reader">
          <div class="reader-header">
            <h2>{{ books[currentBook].name }}</h2>
            <button class="close-btn" @click="closeBook">✖</button>
          </div>
          <div class="reader-body">
            <pre>{{ books[currentBook].content }}</pre>
          </div>
        </div>
      </transition>
    </div>

    <!-- 自定义弹窗 -->
    <div class="custom-modal" v-if="showUploadModal">
      <div class="modal-content">
        <h3>上传 TXT 文档</h3>
        <input type="text" v-model="uploader" placeholder="请输入上传者昵称" />
        <input type="file" accept=".txt" @change="handleFileChange" />
        <p v-if="selectedFile" class="file-info">
          已选择：{{ selectedFile.name }}
        </p>
        <div class="modal-actions">
          <button @click="showUploadModal = false">取消</button>
          <button class="confirm" @click="confirmUpload">确认上传</button>
        </div>
      </div>
    </div>

    <div class="loading-indicator" v-if="loading">正在加载...</div>
    <div class="no-more" v-if="!hasMore">没有更多了</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { uploadTxtFile, getAllTxtFiles } from "@/api/modules/txtFilesReq";

type Book = { name: string; content: string; uploader: string };

const books = ref<Book[]>([]);
const currentBook = ref<number | null>(null);

// 分页状态
const page = ref(1);
const limit = 10;
const loading = ref(false);
const hasMore = ref(true);

//上传弹窗
const showUploadModal = ref(false);
const uploader = ref("");
const selectedFile = ref<File | null>(null);

function openBook(i: number) {
  currentBook.value = i;
}
function closeBook() {
  currentBook.value = null;
}

function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (!file.name.endsWith(".txt")) {
    alert("只能上传 .txt 文件");
    return;
  }
  selectedFile.value = file;
}

async function confirmUpload() {
  if (!selectedFile.value) return alert("请选择 TXT 文件");
  if (!uploader.value.trim()) return alert("请输入昵称");

  try {
    await uploadTxtFile(selectedFile.value, uploader.value);
    alert("上传成功");
    showUploadModal.value = false;
    uploader.value = "";
    selectedFile.value = null;
    page.value = 1;
    hasMore.value = true; // 重新允许加载
    books.value = []; // 清空旧书列表
    loadPage(page.value);
  } catch (e) {
    alert("上传失败");
  }
}

// 加载某一页并追加
async function loadPage(p: number) {
  if (loading.value || !hasMore.value) return;
  loading.value = true;
  try {
    const res: any = await getAllTxtFiles(p, limit);
    const list = res.data || [];
    // 如果返回数量 < limit，说明没有更多
    if (list.length < limit) {
      hasMore.value = false;
    }
    for (const item of list) {
      try {
        const r = await fetch(item.url);
        const text = await r.text();
        books.value.push({
          name: item.name,
          content: text,
          uploader: item.uploader,
        });
      } catch (e) {
        // 某本书加载失败可以忽略
      }
    }
  } catch (e) {
    console.error("加载页失败", p, e);
  } finally {
    loading.value = false;
  }
}

// 触底检测
function onScroll() {
  const scrollY = window.scrollY || window.pageYOffset;
  const viewportH = window.innerHeight;
  const fullH = document.documentElement.scrollHeight;
  if (scrollY + viewportH >= fullH - 50) {
    // 距离底部 50px 以内就加载下一页
    page.value += 1;
    loadPage(page.value);
  }
}

onMounted(() => {
  // 首次加载
  loadPage(page.value);
  // 监听滚动
  window.addEventListener("scroll", onScroll);
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<style scoped lang="scss">
$dark-bg: #1a1a1a;
$accent: #ff3366;
$gradient: linear-gradient(135deg, #ff3366, #990033);
$text-light: #eee;
$overlay-bg: rgba(0, 0, 0, 0.7);

.bookshelf-page {
  background: $dark-bg;
  color: $text-light;
  min-height: 100vh;
  padding: 84px 16px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  width: 100%;
  text-align: center;
  margin-bottom: 16px;

  .page-title {
    font-size: 1.8rem;
    background: $gradient;
    -webkit-background-clip: text;
    color: transparent;
    margin-bottom: 20px;
  }

  .upload-btn {
    padding: 6px 12px;
    border: 1px solid $accent;
    border-radius: 4px;
    background: rgba(255, 51, 102, 0.1);
    color: $accent;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.3s;

    &:hover {
      background: rgba(255, 51, 102, 0.3);
    }
  }
}

.bookshelf {
  display: flex;
  flex-wrap: wrap; // 允许换行
  justify-content: center;
  gap: 36px; // 间距
  padding: 32px;
  overflow-y: auto;
}

.book-card {
  flex: 0 0 200px; // 固定宽度 200px，不放大不缩小
  height: 280px; // 你可以根据封面比例调整高度
  position: relative;
  cursor: pointer;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.6);
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  .cover-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #330011, #660022);

    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='45' stroke='rgba(255,255,255,0.1)' stroke-width='5' fill='none'/%3E%3Cpath d='M50 15v35l20 10' stroke='rgba(255,255,255,0.1)' stroke-width='4' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 80%;
    }
  }

  .cover-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    color: #f2dede;
    text-align: center;

    .cover-title {
      font-size: 1rem;
      font-weight: bold;
      line-height: 1.2;
      margin-top: 8px;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cover-uploader {
      font-size: 0.75rem;
      opacity: 0.8;
      margin-bottom: 8px;
    }
  }

  &:hover {
    transform: translateY(-4px) scale(1.03);
    box-shadow: 0 8px 20px rgba(255, 51, 102, 0.5);
    z-index: 5;
  }
  &.open {
    transform: translateY(-8px) scale(1.05);
    box-shadow: 0 12px 24px rgba(255, 51, 102, 0.7);
    z-index: 10;
  }
}

.reader-overlay {
  position: fixed;
  inset: 0;
  background: $overlay-bg;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  z-index: 999 !important; // 保证最高

  .reader-container {
    background: #222;
    width: 100%;
    max-width: 500px;
    max-height: 80%;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .reader-header {
      padding: 10px;
      background: $gradient;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        margin: 0;
        font-size: 1.2rem;
        color: #fff;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 1.3rem;
        color: #fff;
        cursor: pointer;
      }
    }

    .reader-body {
      padding: 12px;
      background: #111;
      color: #ddd;
      overflow-y: auto;
      flex: 1;

      pre {
        white-space: pre-wrap;
        word-break: break-word;
      }
    }
  }
}

/* 自定义弹窗样式 */
.custom-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;

  .modal-content {
    background: #222;
    padding: 24px;
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    gap: 12px;

    h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #fff;
    }

    input[type="text"],
    input[type="file"] {
      background: #111;
      color: #eee;
      padding: 8px;
      border: 1px solid #555;
      border-radius: 4px;
    }

    .file-info {
      font-size: 0.85rem;
      color: #aaa;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;

      button {
        padding: 6px 12px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
        background: #555;
        color: #fff;
        transition: background 0.3s;

        &:hover {
          background: #777;
        }

        &.confirm {
          background: $accent;

          &:hover {
            background: #cc2a55; // 比 #ff3366 深一些
          }
        }
      }
    }
  }
}

.flip-enter-active,
.flip-leave-active {
  transition: transform 0.5s ease, opacity 0.5s ease;
}

.flip-enter {
  transform: rotateY(-90deg);
  opacity: 0;
}

.flip-enter-to {
  transform: rotateY(0deg);
  opacity: 1;
}

.flip-leave {
  transform: rotateY(0deg);
  opacity: 1;
}

.flip-leave-to {
  transform: rotateY(90deg);
  opacity: 0;
}
</style>
