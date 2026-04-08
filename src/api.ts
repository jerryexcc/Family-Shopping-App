import axios from 'axios';
import { type ShoppingItem } from "./db";

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzs8B3LSn4LYgYPLPz9JjFclycCU-x2tSZpt8KosoyK59m0mETnrrntUILHEaxwb3YY/exec';

export const syncToCloud = async (data: any[]) => {
  try {
    const response = await axios.post(GAS_URL, JSON.stringify(data), {
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
    return response.data;
  } catch (error) {
    console.error('同步失敗:', error);
    throw error;
  }
};

// 2. 讀取資料 (GET) - 新增這個
export const fetchFromCloud = async (): Promise<ShoppingItem[]> => {
  const response = await axios.get(`${GAS_URL}?t=${Date.now()}`);
  return response.data; // 現在 fetchFromCloud() 預設就是 Promise<ShoppingItem[]>
};