import React from 'react';
import type { Transaction } from '../types'; // 從共享檔案導入 Transaction 介面

interface TransactionListProps {
  transactions: Transaction[];
  deleteTransaction: (id: string, type: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  deleteTransaction,
}) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-2 text-gray-700">All Transactions</h3>
      {transactions.length === 0 ? (
        <p className="text-center text-gray-500 py-4">No transactions yet for this project. Add some above!</p>
      ) : (
        <ul className="space-y-3">
          {transactions.map((t) => (
            <li
              key={t.id}
              className={`flex justify-between items-center p-3 rounded shadow-sm ${
                t.type === 'expense'
                  ? 'bg-red-50 border-l-4 border-red-400'
                  : t.type === 'payment'
                  ? 'bg-green-50 border-l-4 border-green-400'
                  : 'bg-orange-50 border-l-4 border-orange-400' // Salary
              }`}
            >
              <div>
                <p className="font-medium">{t.name}</p>
                {t.category && (
                  <p className="text-xs text-gray-500">Category: {t.category}</p>
                )}
                <p className="text-xs text-gray-500 capitalize">
                  Type: {t.type}{' '}
                  {t.timestamp?.toDate && `| ${new Date(t.timestamp.toDate()).toLocaleString()}`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`text-lg font-bold ${
                    t.type === 'payment' ? 'text-green-600' : // Payments are green
                    t.type === 'expense' ? 'text-red-600' :    // Expenses are red
                    'text-orange-600'                          // Salaries are orange
                  }`}
                >
                  {t.type === 'payment' ? '+' : '-'}${Number(t.amount).toFixed(2)} {/* 確保 amount 是數字 */}
                </span>
                <button
                  onClick={() => deleteTransaction(t.id, t.type)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TransactionList;
