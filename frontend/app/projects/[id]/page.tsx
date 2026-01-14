"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

interface Page {
  id: string;
  url: string;
  title: string | null;
  status: string;
}

interface ProjectDetails {
  id: string;
  name: string;
  createdAt: string;
  pages: Page[];
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await axios.get(`${apiUrl}/projects/${params.id}`);
        setProject(res.data);
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  const handleAnalyze = async () => {
    if (!project) return;
    setAnalyzing(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      await axios.post(`${apiUrl}/projects/${project.id}/analyze`);
      alert("Analysis started! Refresh the page in a few seconds to see progress.");
    } catch (error) {
      console.error("Error starting analysis:", error);
      alert("Failed to start analysis");
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading project data...</div>;
  if (!project) return <div className="p-8 text-red-500">Project not found.</div>;

  return (
    <main className="p-8">
      {/* Header / Breadcrumbs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/" className="hover:text-blue-600">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Project Details</span>
        </div>
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            <p className="mt-1 text-gray-500">
              Created: {new Date(project.createdAt).toLocaleDateString()} • Total Pages: {project.pages.length}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
              <button 
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-gray-800 text-white px-6 py-2.5 hover:bg-gray-900 font-medium transition-colors disabled:opacity-50"
            >
                {analyzing ? "Queueing..." : "Analyze Structure"}
            </button>
             <button className="bg-blue-600 text-white px-6 py-2.5 hover:bg-blue-700 font-medium transition-colors">
               Export to AEM
             </button>
          </div>
        </div>
      </div>

      {/* Pages Table */}
      <div className="bg-white border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title (CSV)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {project.pages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-mono truncate max-w-md">
                  {page.url}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {page.title || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold 
                    ${page.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {page.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                        href={`/projects/${project.id}/inspect/${page.id}`}
                        className="text-blue-600 hover:text-blue-900 font-bold"
                    >
                        INSPECT &rarr;
                    </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}