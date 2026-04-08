import { defineStore } from "pinia";
import { db, type ShoppingItem, type ShoppingStatus } from "../db";
import { fetchFromCloud, syncToCloud } from "../api";

export const useShoppingStore = defineStore("shopping", {
  state: () => ({
    items: [] as ShoppingItem[],
    isSyncing: false,
    hasUnsyncedChanges: false,
    isDemoMode: false,
  }),

  actions: {
    /**
     * 1. 初始化：進入點
     * 由 App.vue 的 onMounted 呼叫
     */
    async initialize() {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "demo" || window.location.hash === "#demo") {
        this.isDemoMode = true;
        this.loadDemoData();
      } else {
        // 初始自動同步 (非 Demo)
        if (navigator.onLine) {
          await this.loadFromCloud();
        }
        await this.loadItems();
      }
    },

    /**
     * 2. 載入並排序清單 (正式模式核心)
     */
    async loadItems() {
      if (this.isDemoMode) return;
     
      // 從 db.ts 定義的 shoppingItems 抓取資料
      const allItems = await db.shoppingItems.toArray();
      this.items = allItems;
      this.sortItems();
    },

    /**
     * 3. 排序邏輯：不夠(0) > 待買(1) > 已齊(2)
     */
    sortItems() {
      const priority: Record<ShoppingStatus, number> = {
        partial: 0,
        pending: 1,
        bought: 2,
      };

      this.items.sort((a, b) => {
        if (priority[a.status] !== priority[b.status]) {
          return priority[a.status] - priority[b.status];
        }
        return b.updatedAt - a.updatedAt; // 新的在前
      });
    },

    /**
     * 4. 新增商品
     */
    async addItem(name: string, brand: string, qty: number) {
      const newItem: ShoppingItem = {
        remoteId: crypto.randomUUID(),
        name,
        brand,
        targetQty: qty,
        note: "",
        status: "pending",
        updatedAt: Date.now(),
      };

      if (this.isDemoMode) {
        newItem.id = Math.floor(Math.random() * 10000);
        this.items.push(newItem);
      } else {
        // 關鍵：寫入資料庫
        await db.shoppingItems.add(newItem);
        this.hasUnsyncedChanges = true;
        // 關鍵：重新載入，讓畫面出現新商品
        await this.loadItems();
      }
      this.sortItems();
    },

    /**
     * 5. 智慧切換狀態
     */
    async toggleItemStatus(item: ShoppingItem) {
      let nextStatus: ShoppingStatus;

      if (item.targetQty > 1) {
        if (item.status === "pending") nextStatus = "partial";
        else if (item.status === "partial") nextStatus = "bought";
        else nextStatus = "pending";
      } else {
        nextStatus = item.status === "pending" ? "bought" : "pending";
      }

      const now = Date.now();

      if (this.isDemoMode) {
        const target = this.items.find(i => i.remoteId === item.remoteId);
        if (target) {
          target.status = nextStatus;
          target.updatedAt = now;
        }
      } else {
        if (!item.id) return;
        await db.shoppingItems.update(item.id, {
          status: nextStatus,
          updatedAt: now,
        });
        this.hasUnsyncedChanges = true;
        await this.loadItems();
      }
      this.sortItems();
    },

    /**
     * 6. 刪除商品
     */
    async deleteItem(id: number, remoteId?: string) {
      if (this.isDemoMode) {
        this.items = this.items.filter(i => i.remoteId !== remoteId);
      } else {
        await db.shoppingItems.delete(id);
        this.hasUnsyncedChanges = true;
        await this.loadItems();
      }
      this.sortItems();
    },

    /**
     * 7. 雲端同步邏輯
     */
    async triggerSync() {
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
        if (this.isDemoMode) {
          await new Promise(resolve => setTimeout(resolve, 800));
          this.hasUnsyncedChanges = false;
          return true;
        }

        const allLocalData = await db.shoppingItems.toArray();
        const result = await syncToCloud(allLocalData);
        if (result.status === "success") {
          this.hasUnsyncedChanges = false;
          return true;
        }
      } catch (err) {
        console.error("同步失敗", err);
      } finally {
        this.isSyncing = false;
      }
    },

    /**
     * 8. 從雲端覆蓋本地
     */
    async loadFromCloud() {
      if (this.isDemoMode) return;
      this.isSyncing = true;
      try {
        const data = (await fetchFromCloud()) as ShoppingItem[];
        await db.shoppingItems.clear();
        if (data && data.length > 0) {
          const validData = data.filter((item) => item && item.remoteId);
          await db.shoppingItems.bulkAdd(validData);
        }
        await this.loadItems();
        this.hasUnsyncedChanges = false;
      } catch (err) {
        console.error("雲端載入失敗", err);
      } finally {
        this.isSyncing = false;
      }
    },

    /**
     * 9. Demo 假資料初始化
     */
    loadDemoData() {
      const now = Date.now();
      this.items = [
        { id: 1, remoteId: "d1", name: "示範用雞蛋", brand: "大武山", targetQty: 10, status: "partial", updatedAt: now, note: "Demo 資料" },
        { id: 2, remoteId: "d2", name: "示範用鮮奶", brand: "瑞穗", targetQty: 2, status: "pending", updatedAt: now - 5000, note: "" },
      ];
      this.sortItems();
    }
  },
});