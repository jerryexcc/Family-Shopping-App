<script setup lang="ts">
import { ref, computed } from 'vue';
import { useShoppingStore } from '../stores/shopping';
import type { ShoppingItem } from '../db';

const store = useShoppingStore();

// 輸入框的狀態
const name = ref('');
const brand = ref('');
const qty = ref(1);
const editingId = ref<number | null>(null); // 追蹤目前是否正在「編輯」舊項目

// 過濾出「尚未買齊」的商品 (Pending & Partial)
// 這些是規劃者最在意的項目
const planningItems = computed(() => {
  return store.items.filter(item => item.status !== 'bought');
});

const handleAdd = async () => {
  if (!name.value) return;

  // 如果是在編輯舊項目，先把它刪掉再新增（確保 remoteId 更新）
  if (editingId.value) {
    await store.deleteItem(editingId.value);
  }

  await store.addItem(name.value, brand.value, qty.value);
 
  // 重置表單
  name.value = '';
  brand.value = '';
  qty.value = 1;
  editingId.value = null;

  // 自動背景同步
  store.triggerSync();
};

// 核心功能：點擊清單中的任何一筆，立刻進入編輯狀態
const startEdit = (item: ShoppingItem) => {
  name.value = item.name;
  brand.value = item.brand;
  qty.value = item.targetQty;
  editingId.value = item.id || null;
 
  // 視覺回饋：滾動到頂部方便輸入
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const cancelEdit = () => {
  name.value = '';
  brand.value = '';
  qty.value = 1;
  editingId.value = null;
};
</script>

<template>
  <div class="max-w-md mx-auto p-4 space-y-6 pb-20">
    <section class="bg-white p-6 rounded-3xl shadow-xl border-2 transition-colors"
             :class="editingId ? 'border-amber-400' : 'border-slate-50'">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-sm font-black" :class="editingId ? 'text-amber-600' : 'text-indigo-600'">
          {{ editingId ? '✏️ 正在修改項目' : '📝 規劃新商品' }}
        </h3>
        <button v-if="editingId" @click="cancelEdit" class="text-xs text-slate-400 underline">取消修改</button>
      </div>

      <div class="space-y-4">
        <input v-model="name" type="text" placeholder="品名"
               class="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-indigo-500">
       
        <div class="grid grid-cols-2 gap-4">
          <input v-model="brand" type="text" placeholder="品牌"
                 class="w-full bg-slate-50 border-none rounded-xl p-3">
          <div class="flex items-center bg-slate-50 rounded-xl px-2">
            <button @click="qty > 1 ? qty-- : null" class="p-2 text-xl font-bold text-slate-400">-</button>
            <input v-model.number="qty" type="number" class="w-full bg-transparent border-none text-center font-bold">
            <button @click="qty++" class="p-2 text-xl font-bold text-slate-400">+</button>
          </div>
        </div>

        <button @click="handleAdd" :disabled="!name"
                class="w-full py-4 rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all"
                :class="editingId ? 'bg-amber-500 text-white' : 'bg-indigo-600 text-white'">
          {{ editingId ? '更新商品資訊' : '確認添加商品' }}
        </button>
      </div>
    </section>

    <section class="space-y-3">
      <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
        清單預覽 (點擊項目可修改)
      </h3>
     
      <div v-if="planningItems.length === 0" class="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 text-sm">
        清單目前是空的，快加點東西吧！
      </div>

      <div v-for="item in planningItems" :key="item.remoteId"
           @click="startEdit(item)"
           class="bg-white p-4 rounded-2xl border-2 border-slate-100 flex justify-between items-center active:scale-95 transition-all cursor-pointer shadow-sm">
        <div>
          <div class="text-[10px] font-bold text-slate-400">{{ item.brand || '一般' }}</div>
          <div class="text-base font-bold text-slate-800">{{ item.name }}</div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-lg font-black text-indigo-600">x{{ item.targetQty }}</div>
          <div class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
            <span class="text-slate-300">✏️</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>