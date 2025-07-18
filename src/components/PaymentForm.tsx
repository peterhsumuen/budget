import React, { useState } from 'react';

interface PaymentFormProps {
  addTransaction: (type: 'payment', name: string, amount: number) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ addTransaction }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && amount) {
      addTransaction('payment', name, parseFloat(amount));
      setName('');
      setAmount('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-green-50 p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-2 text-green-800">Add Payment</h3>
      <div className="mb-2">
        <label className="block text-sm mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g. Client Payment"
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
          placeholder="e.g. 5000"
          required
        />
      </div>
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
        Add Payment
      </button>
    </form>
  );
};

export default PaymentForm;
