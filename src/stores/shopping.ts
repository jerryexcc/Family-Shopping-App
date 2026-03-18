import { defineStore } from "pinia";
import { db, type ShoppingItem, type ShoppingStatus } from "../db";
import { fetchFromCloud, syncToCloud } from "../api";

export const useShoppingStore = defineStore("shopping", {
  state: () => ({
    items: [] as ShoppingItem[],
    isSyncing: false,
    hasUnsyncedChanges: false,
  }),

  actions: {
    /**
     * 載入並排序清單
     * 排序邏輯：不夠 (Partial) 0 > 待買 (Pending) 1 > 已齊 (Bought) 2
     */
    async loadItems() {
      const allItems = await db.shoppingItems.toArray();
      this.items = allItems.sort((a, b) => {
        const priority: Record<ShoppingStatus, number> = {
          partial: 0, // 買不夠的頂在最上面提醒
          pending: 1, // 還沒買的居中
          bought: 2, // 買齊的沈底
        };

        if (priority[a.status] !== priority[b.status]) {
          return priority[a.status] - priority[b.status];
        }
        return b.updatedAt - a.updatedAt; // 同狀態則按時間新舊排序
      });
    },
    async loadFromCloud() {
      this.isSyncing = true;
      try {
        // 1. 強制轉換 API 回傳值的類型
        const data = (await fetchFromCloud()) as ShoppingItem[];

        // 2. 清空本地
        await db.shoppingItems.clear();

        if (data && data.length > 0) {
          // 3. 過濾掉無效或空白的資料
          // 此時 TypeScript 已經知道 item 是 ShoppingItem，不會再噴 any 警告
          const validData = data.filter((item) => item && item.remoteId);

          await db.shoppingItems.bulkAdd(validData);
        }

        await this.loadItems();
        this.hasUnsyncedChanges = false;
      } catch (err) {
        console.error("初始化同步失敗", err);
      } finally {
        this.isSyncing = false;
      }
    },
    /**
     * 從雲端拉取資料並強制覆蓋本地 (最重要！)
     */
    async fetchFromCloud() {
      this.isSyncing = true;
      try {
        const cloudData = await fetchFromCloud();

        // 1. 清空本地資料庫，避免舊資料殘留
        await db.shoppingItems.clear();

        // 2. 將雲端抓回來的資料填入本地
        if (cloudData && cloudData.length > 0) {
          await db.shoppingItems.bulkAdd(cloudData);
        }

        await this.loadItems();
        console.log("✅ 已根據雲端資料更新本地庫");
      } catch (err) {
        console.error("無法從雲端同步:", err);
      } finally {
        this.isSyncing = false;
      }
    },

    /**
     * 智慧切換狀態
     * 順序：Pending -> (Partial) -> Bought -> Pending
     */
    async toggleItemStatus(item: ShoppingItem) {
      if (!item.id) return;

      let nextStatus: ShoppingStatus;

      // 數量大於 1 才走「不夠 (Partial)」邏輯
      if (item.targetQty > 1) {
        if (item.status === "pending") nextStatus = "partial";
        else if (item.status === "partial") nextStatus = "bought";
        else nextStatus = "pending";
      } else {
        // 數量只有 1，直接二元切換
        nextStatus = item.status === "pending" ? "bought" : "pending";
      }

      await db.shoppingItems.update(item.id, {
        status: nextStatus,
        updatedAt: Date.now(),
      });

      this.hasUnsyncedChanges = true;
      await this.loadItems();
    },

    /**
     * 新增商品
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
      await db.shoppingItems.add(newItem);
      this.hasUnsyncedChanges = true;
      await this.loadItems();
    },

    /**
     * 批次上傳雲端
     */
    async triggerSync() {
      if (this.isSyncing) return;
      this.isSyncing = true;
      try {
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
    async deleteItem(id: number) {
      try {
        await db.shoppingItems.delete(id);
        this.hasUnsyncedChanges = true; // 刪除也是一種更動，標記需要同步
        await this.loadItems(); // 重新載入列表
      } catch (err) {
        console.error("刪除失敗:", err);
      }
    },
  },
});
