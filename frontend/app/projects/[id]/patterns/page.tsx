"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

interface BlockPattern {
  id: string;
  fingerprint: string;
  structure: string;
  exampleHtml: string;
  frequency: number;
  canonicalType: string;
}

export default function PatternsPage() {
  const params = useParams();
  const [patterns, setPatterns] = useState<BlockPattern[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stan dla Modala
  const [selectedPattern, setSelectedPattern] = useState<BlockPattern | null>(null);
  const [saving, setSaving] = useState(false);

  // Pobieranie danych
  const fetchPatterns = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await axios.get(`${apiUrl}/projects/${params.id}/patterns`);
      setPatterns(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) fetchPatterns();
  }, [params.id]);

  // Funkcja zapisu decyzji
  const handleSaveDecision = async (type: string) => {
    if (!selectedPattern) return;
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      await axios.patch(`${apiUrl}/projects/patterns/${selectedPattern.id}`, {
        canonicalType: type
      });
      
      // Zamknij modal i odśwież listę
      setSelectedPattern(null);
      fetchPatterns();
    } catch (error) {
      console.error(error);
      alert("Error saving decision");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading Library...</div>;

  return (
    <main className="p-8 bg-gray-50 min-h-screen relative">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/projects/${params.id}`} className="text-sm text-gray-500 hover:text-blue-600 mb-2 block">&larr; Back to Project</Link>
        <h1 className="text-3xl font-bold text-gray-900">Block Library</h1>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6">
        {patterns.map((pattern) => (
          <div key={pattern.id} className={`bg-white border shadow-sm flex flex-col md:flex-row ${pattern.canonicalType !== 'UNKNOWN' ? 'border-l-4 border-l-green-500' : 'border-gray-200'}`}>
            
            {/* Info */}
            <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 text-xs font-bold rounded uppercase ${pattern.canonicalType === 'CONTAINER' ? 'bg-yellow-100 text-yellow-800' : pattern.canonicalType !== 'UNKNOWN' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                  {pattern.canonicalType === 'CONTAINER' ? 'LAYOUT (WRAPPER)' : pattern.canonicalType}
                </span>
                <span className="text-xs font-mono text-gray-400">ID: {pattern.fingerprint.substring(0,6)}</span>
              </div>
              
              <div className="mb-4">
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Structure</p>
                <code className="text-sm text-purple-700 font-mono bg-purple-50 p-1 rounded block break-all">
                  {pattern.structure}
                </code>
              </div>

              <p className="text-2xl font-bold text-gray-900 mb-6">
                {pattern.frequency} <span className="text-sm font-normal text-gray-500">pages</span>
              </p>

              <button 
                onClick={() => setSelectedPattern(pattern)}
                className="w-full py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-colors"
              >
                Edit Mapping
              </button>
            </div>

            {/* Preview */}
            <div className="p-6 md:w-2/3">
              <p className="text-xs text-gray-400 uppercase font-bold mb-2">HTML Preview</p>
              <div className="bg-gray-900 text-gray-300 p-4 rounded text-xs font-mono overflow-x-auto h-48 whitespace-pre-wrap">
                {pattern.exampleHtml}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL DECYZYJNY --- */}
      {selectedPattern && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Define Pattern</h3>
              <button onClick={() => setSelectedPattern(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                Structure: <code className="text-purple-600 bg-purple-50 px-1">{selectedPattern.structure}</code>
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Opcja 1: Layout */}
                <button 
                  onClick={() => handleSaveDecision('CONTAINER')}
                  disabled={saving}
                  className="p-4 border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 text-left transition-colors group"
                >
                  <span className="block text-yellow-800 font-bold mb-1 group-hover:underline">🚧 Mark as Layout</span>
                  <span className="text-xs text-yellow-700">
                    This is just a wrapper (Grid, Row, Container). The system should <strong>drill down</strong> and analyze its children.
                  </span>
                </button>

                {/* Opcja 2: Komponent */}
                <div className="p-4 border border-green-300 bg-green-50">
                  <span className="block text-green-800 font-bold mb-2">📦 Map as Component</span>
                  <select 
                    id="modalCompType"
                    className="w-full p-2 border border-green-300 text-sm bg-white mb-3"
                  >
                    <option value="HEADER">Header / Title</option>
                    <option value="RICH_TEXT">Rich Text</option>
                    <option value="IMAGE">Image</option>
                    <option value="HERO_BANNER">Hero Banner</option>
                    <option value="CTA">CTA / Buttons</option>
                    <option value="RELATED_ARTICLES">Related Articles</option>
                    <option value="FOOTER">Footer</option>
                  </select>
                  <button 
                    onClick={() => {
                      const val = (document.getElementById('modalCompType') as HTMLSelectElement).value;
                      handleSaveDecision(val);
                    }}
                    disabled={saving}
                    className="w-full py-2 bg-green-600 text-white text-sm font-bold hover:bg-green-700"
                  >
                    Confirm Component
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                 <button 
                   onClick={() => handleSaveDecision('UNKNOWN')}
                   className="text-xs text-gray-400 hover:text-red-500 underline"
                 >
                   Reset / Ignore
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}