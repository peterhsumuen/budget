// src/types.ts
export interface Transaction {
  id: string;
  name: string;
  amount: number; // 確保這裡明確是 number
  type: 'expense' | 'payment' | 'salary'; // 類型仍然包含 'salary' 以便靈活性，儘管它現在是費用類別
  category?: string | null; // category 可能是可選的，且可以是 null
  timestamp?: { toDate: () => Date }; // Firestore timestamp 物件
}
