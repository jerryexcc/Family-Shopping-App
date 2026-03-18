<script setup lang="ts">
import { onMounted } from "vue";
import { useShoppingStore } from "../stores/shopping";

const store = useShoppingStore();
onMounted(() => store.loadItems());
</script>

<template>
  <div class="max-w-md mx-auto p-4 pb-32">
    <div class="flex justify-between items-center mb-4 px-2">
      <h2 class="text-xs font-black text-slate-400 uppercase tracking-widest">
        目前清單
      </h2>
      <div v-if="store.hasUnsyncedChanges" class="flex items-center gap-1">
        <span class="flex h-2 w-2 relative">
          <span
            class="animate-ping absolute h-full w-full rounded-full bg-amber-400 opacity-75"
          ></span>
          <span class="relative rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span class="text-[10px] text-amber-600 font-bold">待上傳</span>
      </div>
    </div>

    <div class="space-y-3">
      <div
        v-for="item in store.items"
        :key="item.remoteId"
        @click="store.toggleItemStatus(item)"
        class="bg-white rounded-2xl border-2 transition-all active:scale-95 p-4 cursor-pointer"
        :class="[
          item.status === 'pending'
            ? 'border-slate-100'
            : item.status === 'partial'
              ? 'border-amber-400 bg-amber-50'
              : 'border-emerald-500 bg-emerald-50 opacity-60',
        ]"
      >
        <div class="flex justify-between items-center">
          <div>
            <span class="text-[10px] font-black text-slate-400">{{
              item.brand || "一般"
            }}</span>
            <h3
              class="text-lg font-bold text-slate-800"
              :class="{ 'line-through': item.status === 'bought' }"
            >
              {{ item.name }}
            </h3>
            <span class="text-sm font-medium text-slate-500"
              >需求: {{ item.targetQty }}</span
            >
          </div>

          <div
            class="px-3 py-1 rounded-full text-xs font-black shadow-sm"
            :class="[
              item.status === 'pending'
                ? 'bg-slate-100 text-slate-500'
                : item.status === 'partial'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-500 text-white',
            ]"
          >
            {{
              item.status === "pending"
                ? "待買"
                : item.status === "partial"
                  ? "不夠"
                  : "已齊"
            }}
          </div>
        </div>
      </div>
    </div>

    <div class="fixed bottom-6 left-0 right-0 px-6 flex justify-center">
      <button
        @click="store.triggerSync()"
        class="w-full max-w-md bg-zinc-900 text-white flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-lg shadow-2xl active:scale-95 transition-all"
      >
        <span v-if="!store.isSyncing">🏁 結束採買 · 更新雲端</span>
      </button>
    </div>
  </div>
</template>
