import React, { useState } from 'react';

interface SalaryFormProps {
  addTransaction: (type: 'salary', name: string, amount: number) => void;
}

const SalaryForm: React.FC<SalaryFormProps> = ({ addTransaction }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && amount) {
      addTransaction('salary', name, parseFloat(amount));
      setName('');
      setAmount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-orange-50 p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-2 text-orange-800">Add Salary</h3>
      <div className="mb-2">
        <label className="block text-sm mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g. Project Manager"
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
          placeholder="e.g. 2000"
          required
        />
      </div>
      <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
        Add Salary
      </button>
    </form>
  );
};

export default SalaryForm;
