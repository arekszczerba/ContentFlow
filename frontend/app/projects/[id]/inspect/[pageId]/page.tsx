"use client";

import { useEffect, useState, useMemo  } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

const HEURISTIC_PATTERNS: Record<string, string[]> = {
  "Hero Banner": ["hero", "banner", "jumbotron", "featured-image", "cover"],
  "Article Title": ["entry-title", "post-title", "page-title", "headline", "h1"],
  "Article Body": ["entry-content", "post-content", "article-body", "rich-text"],
  "Sidebar Widget": ["widget", "sidebar", "aside", "module", "secondary"],
  "Navigation": ["nav", "menu", "breadcrumbs", "header"],
  "Footer": ["footer", "colophon", "site-info"],
  "Image Gallery": ["gallery", "slider", "carousel", "wp-block-gallery"],
  "Author Box": ["author", "bio", "meta"],
};

interface SelectedElement {
  tagName: string;
  className: string;
  id: string;
  text: string;
  src?: string;
  href?: string;
}

interface PageData {
  id: string;
  url: string;
  title: string;
  status: string;
  detectedComponents: { classes: string[] };
}

export default function InspectorPage() {
  const params = useParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);

   const suggestion = useMemo(() => {
    if (!selectedElement) return null;

    const classStr = selectedElement.className.toLowerCase();
    const idStr = selectedElement.id.toLowerCase();
    const tagStr = selectedElement.tagName.toLowerCase();

    // Sprawdzamy każdy wzorzec
    for (const [type, keywords] of Object.entries(HEURISTIC_PATTERNS)) {
      // Sprawdź czy któreś słowo kluczowe występuje w klasie, ID lub tagu
      const match = keywords.some(keyword => 
        classStr.includes(keyword) || 
        idStr.includes(keyword) || 
        (tagStr === keyword && keyword !== 'h1') // Wyjątek dla h1
      );

      if (match) return type;
    }

    // Fallbacki po tagach HTML
    if (tagStr === 'h1') return "Article Title";
    if (tagStr === 'nav') return "Navigation";
    if (tagStr === 'aside') return "Sidebar Widget";
    if (tagStr === 'footer') return "Footer";

    return null;
  }, [selectedElement]);

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await axios.get(`${apiUrl}/projects/${params.id}`);
        const foundPage = res.data.pages.find((p: any) => p.id === params.pageId);
        setPage(foundPage);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id && params.pageId) {
      fetchPageData();
    }
  }, [params.id, params.pageId]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CF_ELEMENT_CLICK') {
        console.log("Odebrano z Iframe:", event.data.payload);
        setSelectedElement(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loading) return <div className="p-8">Loading Inspector...</div>;
  if (!page) return <div className="p-8 text-red-500">Page not found.</div>;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const proxyUrl = `${apiUrl}/projects/proxy?url=${encodeURIComponent(page.url)}`;

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Top Bar (bez zmian) */}
      <div className="h-14 border-b border-gray-200 flex items-center px-4 justify-between shrink-0 bg-white">
        <div className="flex items-center gap-4">
          <Link href={`/projects/${params.id}`} className="text-sm text-gray-500 hover:text-gray-900 font-medium">&larr; Back</Link>
          <div className="h-4 w-px bg-gray-300"></div>
          <h1 className="text-sm font-bold text-gray-900 truncate max-w-xl">{page.url}</h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Iframe */}
        <div className="flex-1 bg-gray-100 relative">
          <iframe src={proxyUrl} className="w-full h-full border-none" sandbox="allow-same-origin allow-scripts" />
        </div>

        {/* Right: Inspector Panel */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto p-0 shrink-0 flex flex-col">
          
          {/* Header Panelu */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inspector</h2>
          </div>

          <div className="p-6 flex-1">
            {selectedElement ? (
              <div className="space-y-6">
                
                {/* --- 3. SUGESTIA HEURYSTYCZNA --- */}
                {suggestion && (
                  <div className="bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
                    <div className="text-xl">💡</div>
                    <div>
                      <p className="text-xs font-bold text-blue-800 uppercase mb-1">Smart Suggestion</p>
                      <p className="text-sm text-blue-900">
                        This looks like a <span className="font-bold underline">{suggestion}</span>.
                      </p>
                      <button className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 hover:bg-blue-700 font-medium">
                        Confirm & Map
                      </button>
                    </div>
                  </div>
                )}

                {/* Technical Details */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase mb-2">Selected Node</label>
                  <div className="font-mono text-sm bg-gray-50 p-3 border border-gray-200 text-gray-700 break-all">
                    <span className="text-purple-600 font-bold">{selectedElement.tagName}</span>
                    {selectedElement.id && <span className="text-blue-600">#{selectedElement.id}</span>}
                    {selectedElement.className && <span className="text-orange-600">.{selectedElement.className.split(' ').join('.')}</span>}
                  </div>
                </div>

                {/* Content Preview */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase mb-2">Content Preview</label>
                  <div className="p-3 bg-white border border-gray-200 text-sm text-gray-600 italic max-h-32 overflow-y-auto">
                    "{selectedElement.text.trim() || 'Empty content'}"
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Manual Mapping Form (Placeholder) */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase mb-2">Map to Canonical Field</label>
                  <select className="block w-full border border-gray-300 p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Select type...</option>
                    <option value="title">Article Title</option>
                    <option value="body">Body Text</option>
                    <option value="image">Main Image</option>
                    <option value="widget">Sidebar Widget</option>
                  </select>
                </div>

                <button className="w-full bg-gray-900 text-white py-3 text-sm font-bold hover:bg-black transition-colors">
                  SAVE RULE
                </button>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                <div className="text-4xl mb-4">👆</div>
                <p className="text-sm font-medium text-gray-900">Select an element</p>
                <p className="text-xs text-gray-500 mt-1">Click on the preview to inspect</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}