"use client";

import { useState } from "react";
import UploadForm from "@/components/UploadForm";
import ProjectList from "@/components/ProjectGrid";


export default function Home() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <main className="p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">Overview of all migration processes.</p>
        </div>
      </div>

      <UploadForm onUploadSuccess={handleRefresh} />
      
      <ProjectList refreshTrigger={refreshKey} />
    </main>
  );
}