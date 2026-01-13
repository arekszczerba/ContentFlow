"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

interface Project {
  id: string;
  name: string;
  createdAt: string;
  _count: {
    pages: number;
  };
}

export default function ProjectList({ refreshTrigger }: { refreshTrigger: number }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await axios.get(`${apiUrl}/projects`);
        setProjects(res.data);
      } catch (error) {
        console.error("Error fetching projects", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [refreshTrigger]);

  if (loading) return <div className="p-8 text-gray-500">Loading projects...</div>;

  if (projects.length === 0) {
    return (
      <div className="mt-8 p-12 border-2 border-dashed border-gray-300 text-center bg-white">
        <h3 className="text-lg font-medium text-gray-900">No active migrations</h3>
        <p className="mt-1 text-gray-500">Upload a CSV file above to create your first project.</p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 uppercase tracking-wider text-xs">Active Projects</h2>
      
      {/* Grid Layout - Kafelki */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="bg-white border border-gray-200 hover:border-blue-400 transition-colors group flex flex-col"
          >
            {/* Header Karty */}
            <div className="p-5 border-b border-gray-100 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-800 border border-blue-100">
                  IN PROGRESS
                </span>
              </div>

              {/* Statystyki w karcie */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Pages</p>
                  <p className="text-2xl font-mono font-semibold text-gray-900">
                    {project._count.pages}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Progress</p>
                  <p className="text-2xl font-mono font-semibold text-gray-900">0%</p>
                </div>
              </div>
              
              {/* Pasek postępu (Fake na razie) */}
              <div className="w-full bg-gray-100 h-1 mt-4">
                <div className="bg-blue-600 h-1" style={{ width: '0%' }}></div>
              </div>
            </div>

            {/* Footer Karty */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">Last action: CSV Import</span>
              <Link 
                href={`/projects/${project.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
              >
                Details &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}