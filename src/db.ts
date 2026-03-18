import Dexie, { type Table } from 'dexie';

export type ShoppingStatus = 'pending' | 'partial' | 'bought';

export interface ShoppingItem {
  id?: number;
  remoteId: string;
  name: string;
  brand: string;
  targetQty: number;
  note: string;
  status: ShoppingStatus;
  updatedAt: number;
}

export class MyDatabase extends Dexie {
  shoppingItems!: Table<ShoppingItem>;

  constructor() {
    super('FamilyShoppingDB');
    this.version(1).stores({
      shoppingItems: '++id, remoteId, name, status, updatedAt'
    });
  }
}

export const db = new MyDatabase();