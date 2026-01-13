"use client";

import { useState } from "react";
import axios from "axios";

interface UploadFormProps {
  onUploadSuccess: () => void;
}

export default function UploadForm({ onUploadSuccess }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (!projectName.trim()) {
      setMessage("Enter Roject name.");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectName", projectName);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      await axios.post(`${apiUrl}/projects/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("File uploaded successfully!");
      setFile(null);
      setProjectName("");
      (document.getElementById("fileInput") as HTMLInputElement).value = "";
      
      onUploadSuccess();
    } catch (error) {
      console.error(error);
      setMessage("Error during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 mb-8">
      <h2 className="text-xl font-bold mb-6 text-gray-800">New Migration Project</h2>
      <form onSubmit={handleUpload} className="flex flex-col gap-6">
         <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
              Project name
            </label>
            <input
              id="projectName"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g Migration Project"
              className="block w-full text-sm text-gray-900 border border-gray-300 p-3 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select CSV file
          </label>

          <div className="flex w-full items-stretch"> 
            
            <input
              id="fileInput"
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="flex-1 min-w-0 block w-full text-sm text-gray-900 border border-gray-300 border-r-0 bg-gray-50
                file:mr-4 file:py-3 file:px-6
                file:border-0 file:border-r file:border-gray-200
                file:text-sm file:font-semibold
                file:bg-gray-100 file:text-gray-700
                file:rounded-none
                hover:file:bg-gray-200 cursor-pointer focus:outline-none"
            />
            
            <button
              type="submit"
              disabled={!file || !projectName || uploading}
              className="shrink-0 bg-blue-600 text-white px-8 py-2 border border-blue-600 hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors whitespace-nowrap"
            >
              {uploading ? "Creating..." : "Import CSV"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">Supported format: .csv (UTF-8)</p>
        </div>
        
      </form>
      {message && <p className="mt-3 text-sm font-medium text-gray-600">{message}</p>}
    </div>
  );
}