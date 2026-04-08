import axios from 'axios';
import { type ShoppingItem } from '../db';

// 這裡填入你的 Google Apps Script 部署網址
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzs8B3LSn4LYgYPLPz9JjFclycCU-x2tSZpt8KosoyK59m0mETnrrntUILHEaxwb3YY/exec'; 

export const fetchFromCloud = async () => {
  const response = await axios.get(GAS_URL);
  return response.data;
};

export const syncToCloud = async (data: ShoppingItem[]) => {
  // 使用 text/plain 繞過 CORS 預檢
  const response = await axios.post(GAS_URL, JSON.stringify(data), {
    headers: { 'Content-Type': 'text/plain' }
  });
  return response.data;
};