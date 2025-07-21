import React from 'react';
// import type { Transaction } from '../types'; // 移除未使用的導入

interface ProjectSummaryProps {
  projectBudget: number;
  totalExpenses: number;
  totalPayments: number;
  totalSalaries: number; // 重新引入 totalSalaries 屬性
  netBalance: number;
  remainingBudget: number;
}

const ProjectSummary: React.FC<ProjectSummaryProps> = ({
  projectBudget,
  totalExpenses,
  totalPayments,
  totalSalaries, // 現在使用這個屬性
  netBalance,
  remainingBudget,
}) => {
  return (
    <div className="p-6 bg-purple-50 rounded-xl shadow-inner space-y-4 text-center">
      <h2 className="text-2xl font-semibold text-purple-700 mb-4">Project Financial Overview</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 text-sm">Project Budget</p>
          <p className="text-purple-600 text-2xl font-bold">${projectBudget.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 text-sm">Total Payments</p>
          <p className="text-green-600 text-2xl font-bold">${totalPayments.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 text-sm">Total Expenses</p>
          <p className="text-red-600 text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
        </div>
        {/* Salaries 顯示現在使用傳入的 totalSalaries 屬性 */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 text-sm">Salaries</p>
          <p className="text-xl font-bold text-orange-500">${totalSalaries.toFixed(2)}</p> {/* <-- 這裡改為使用 totalSalaries */}
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 text-sm">Project Net Balance</p>
          <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ${netBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 text-sm">Remaining Budget</p>
          <p className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
            ${remainingBudget.toFixed(2)}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-4">
        This summary reflects the financial overview for the currently selected project.
      </p>
    </div>
  );
};

export default ProjectSummary;
