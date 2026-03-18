<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useShoppingStore } from './stores/shopping';
import AddItem from './components/AddItem.vue';
import ShoppingList from './components/ShoppingList.vue';

const store = useShoppingStore();
const mode = ref<'add' | 'shop'>('add');

// 取得 Store 狀態
const isDemoMode = computed(() => store.isDemoMode);
const isSyncing = computed(() => store.isSyncing);

// 偵測 LINE 瀏覽器
const isLineBrowser = /Line/i.test(navigator.userAgent);

onMounted(async () => {
  // 啟動關鍵：執行包含網址偵測與資料載入的初始化
  await store.initialize();
 
  // 如果偵測到是 Demo 模式，可以選擇預設跳到採買模式看成果
  if (store.isDemoMode) {
    mode.value = 'shop';
  }
});
</script>

<template>
  <div class="min-h-screen transition-colors duration-500"
       :class="mode === 'add' ? 'bg-slate-50' : 'bg-zinc-100'">
   
    <div v-if="isDemoMode"
         class="bg-amber-500 text-white text-center py-1.5 text-xs font-black tracking-widest uppercase">
      🚧 Demo Mode - Data will not be saved 🚧
    </div>

    <div v-if="isLineBrowser && !isDemoMode"
         class="bg-blue-600 text-white p-2 text-center text-[10px] leading-tight font-bold">
      點擊右上角「...」並選擇「使用預設瀏覽器開啟」即可安裝到桌面
    </div>

    <nav class="sticky top-0 z-20 shadow-sm transition-colors duration-500"
         :class="mode === 'add' ? 'bg-indigo-600' : 'bg-zinc-900'">
      <div class="max-w-md mx-auto flex relative">
        <button
          @click="mode = 'add'"
          class="flex-1 py-4 font-black text-sm tracking-widest transition-all relative"
          :class="mode === 'add' ? 'text-white' : 'text-indigo-300'"
        >
          📝 添加模式
          <div v-if="mode === 'add'" class="absolute bottom-0 left-0 w-full h-1 bg-white"></div>
        </button>
        <button
          @click="mode = 'shop'"
          class="flex-1 py-4 font-black text-sm tracking-widest transition-all relative"
          :class="mode === 'shop' ? 'text-white' : 'text-zinc-500'"
        >
          🛒 採買模式
          <div v-if="mode === 'shop'" class="absolute bottom-0 left-0 w-full h-1 bg-emerald-400"></div>
        </button>

        <div v-if="isSyncing" class="absolute right-4 top-1/2 -translate-y-1/2">
          <div class="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
        </div>
      </div>
    </nav>

    <main class="py-2">
      <Transition name="fade" mode="out-in">
        <div :key="mode">
          <AddItem v-if="mode === 'add'" />
          <ShoppingList v-else />
        </div>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
/* 保持前輩原有的精緻轉場動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 確保橫幅文字不會在窄螢幕擠壓 */
.sticky {
  position: -webkit-sticky;
  position: sticky;
}
</style>