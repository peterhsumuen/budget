import React from 'react';

interface ProjectSummaryProps {
  projectBudget: number;
  totalExpenses: number;
  totalPayments: number;
  totalSalaries: number;
  netBalance: number;
  remainingBudget: number;
}

const ProjectSummary: React.FC<ProjectSummaryProps> = ({
  projectBudget,
  totalExpenses,
  totalPayments,
  totalSalaries,
  netBalance,
  remainingBudget,
}) => {
  return (
    <div className="bg-purple-50 p-6 rounded-lg shadow">
      <h3 className="text-2xl font-bold text-purple-800 text-center mb-6">Project Summary</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Budget</p>
          <p className="text-xl font-bold text-purple-700">${projectBudget.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Payments Received</p>
          <p className="text-xl font-bold text-green-700">${totalPayments.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Expenses</p>
          <p className="text-xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Salaries</p>
          <p className="text-xl font-bold text-orange-500">${totalSalaries.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Net Balance</p>
          <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            ${netBalance.toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Remaining Budget</p>
          <p className={`text-xl font-bold ${remainingBudget >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
            ${remainingBudget.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProjectSummary;
