import React, { useState } from 'react';

interface ExpenseFormProps {
  addTransaction: (type: 'expense', name: string, amount: number, category: string | null) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ addTransaction }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Materials');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && amount) {
      addTransaction('expense', name, parseFloat(amount), category);
      setName('');
      setAmount('');
      setCategory('Materials');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-blue-50 p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-2 text-blue-800">Add Expense</h3>
      <div className="mb-2">
        <label className="block text-sm mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g. Lumber"
          required
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm mb-1">Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g. 250"
          required
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="Materials">Materials</option>
          <option value="Subcontractor">Subcontractor</option>
          <option value="Permits">Permits</option>
          <option value="Equipment Rental">Equipment Rental</option>
          <option value="Utilities">Utilities</option>
          <option value="Marketing">Marketing</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
        Add Expense
      </button>
    </form>
  );
};

export default ExpenseForm;
