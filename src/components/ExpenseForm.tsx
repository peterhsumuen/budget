import React, { useState } from 'react';
// import type { Transaction } from '../types'; // 移除未使用的導入

interface ExpenseFormProps {
    addTransaction: (type: 'expense', name: string, amount: number, category: string) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ addTransaction }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Materials');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && amount && category) {
            addTransaction('expense', name, parseFloat(amount), category);
            setName('');
            setAmount('');
            setCategory('Materials');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="expenseName" className="block text-sm font-medium text-gray-700 mb-1">Expense Name</label>
                <input
                    type="text"
                    id="expenseName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Materials, Tools, Employee Salary"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    required
                />
            </div>
            <div>
                <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                    type="number"
                    id="expenseAmount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g., 500.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    step="0.01"
                    required
                />
            </div>
            <div>
                <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                    id="expenseCategory"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
                    required
                >
                    <option value="Materials">Materials</option>
                    <option value="Subcontractor">Subcontractor</option>
                    <option value="Permits">Permits</option>
                    <option value="Equipment Rental">Equipment Rental</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Salary">Salary</option>
                    <option value="Other">Other</option>
                </select>
            </div>
            <button
                type="submit"
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-105"
            >
                Add Expense
            </button>
        </form>
    );
};

export default ExpenseForm;
