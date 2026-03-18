<script setup lang="ts">
import { ref } from 'vue';
import AddItem from './components/AddItem.vue';
import ShoppingList from './components/ShoppingList.vue';

const mode = ref<'add' | 'shop'>('add');
</script>

<template>
  <div class="min-h-screen transition-colors duration-500"
       :class="mode === 'add' ? 'bg-slate-50' : 'bg-zinc-100'">
   
    <nav class="sticky top-0 z-20 shadow-sm transition-colors duration-500"
         :class="mode === 'add' ? 'bg-indigo-600' : 'bg-zinc-900'">
      <div class="max-w-md mx-auto flex">
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
/* 精緻的轉場動畫 */
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
</style>