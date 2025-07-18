import React, { useState } from 'react';

interface ProjectFormProps {
  addProject: (name: string, budget: number) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ addProject }) => {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && budget) {
      addProject(name, parseFloat(budget));
      setName('');
      setBudget('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-purple-100 p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-2">Create New Project</h3>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Project Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g. Website Redesign"
          required
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Budget</label>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g. 5000"
          required
        />
      </div>
      <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
        Add Project
      </button>
    </form>
  );
};

export default ProjectForm;