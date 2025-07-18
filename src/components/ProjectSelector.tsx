import React from 'react';

interface Project {
  id: string;
  name: string;
  budget: number;
}

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  setSelectedProjectId,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6 border border-gray-200">
      <label className="block text-sm font-semibold mb-2 text-gray-700">Select a Project</label>
      {projects.length === 0 ? (
        <p className="text-gray-500">No projects available.</p>
      ) : (
        <select
          className="w-full p-2 border rounded"
          value={selectedProjectId || ''}
          onChange={(e) => setSelectedProjectId(e.target.value)}
        >
          <option value="" disabled>-- Select a Project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} (${project.budget.toFixed(2)})
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default ProjectSelector;
