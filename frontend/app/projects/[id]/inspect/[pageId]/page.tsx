"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";

// --- 1. SŁOWNIK HEURYSTYKI ---
const HEURISTIC_PATTERNS: Record<string, string[]> = {
  "HERO_BANNER": ["hero", "banner", "jumbotron", "featured-image", "cover"],
  "HEADER": ["entry-title", "post-title", "page-title", "headline", "h1"],
  "RICH_TEXT": ["entry-content", "post-content", "article-body", "rich-text", "text-module"],
  "CTA": ["widget", "sidebar", "aside", "module", "secondary", "cta", "button"],
  "IMAGE_GALLERY": ["gallery", "slider", "carousel", "wp-block-gallery"],
  "FOOTER": ["footer", "colophon", "site-info"],
  "NAVIGATION": ["nav", "menu", "breadcrumbs", "header"],
};

// --- TYPY ---
interface SelectedElement {
  tagName: string;
  className: string;
  id: string;
  text: string;
}

interface PageData {
  id: string;
  url: string;
  title: string;
  status: string;
}

interface ComponentPattern {
  id: string;
  selector: string;
  isLayout: boolean;
  componentType: string;
}

export default function InspectorPage() {
  const params = useParams();
  
  // --- STANY ---
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Lista zapisanych wzorców (żebyś widział co już oznaczyłeś)
  const [patterns, setPatterns] = useState<ComponentPattern[]>([]);

  // --- 2. POBIERANIE DANYCH ---
  
  // Pobierz dane strony
  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await axios.get(`${apiUrl}/projects/${params.id}`);
        const foundPage = res.data.pages.find((p: any) => p.id === params.pageId);
        setPage(foundPage);
      } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    if (params.id) fetchPageData();
  }, [params.id, params.pageId]);

  // Pobierz istniejące wzorce (Patterns)
  useEffect(() => {
    if (params.id) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      axios.get(`${apiUrl}/projects/${params.id}/patterns`)
        .then(res => setPatterns(res.data))
        .catch(console.error);
    }
  }, [params.id, saving]); // Odśwież jak zapiszemy

  // --- 3. LOGIKA IFRAME ---
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'CF_ELEMENT_CLICK') {
        setSelectedElement(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const iframe = document.querySelector('iframe');
    
    // Funkcja wysyłająca wiadomość
    const sendPatterns = () => {
      if (iframe && iframe.contentWindow && patterns.length > 0) {
        iframe.contentWindow.postMessage({
          type: 'CF_UPDATE_OVERLAYS',
          payload: patterns
        }, '*');
      }
    };

    // Wysyłamy od razu (jeśli iframe gotowy)
    sendPatterns();

    // I wysyłamy ponownie po załadowaniu iframe'a (dla pewności)
    if (iframe) {
      iframe.onload = sendPatterns;
    }
  }, [patterns]);

  // --- 4. HEURYSTYKA (SUGESTIE) ---
  const suggestion = useMemo(() => {
    if (!selectedElement) return null;
    const classStr = selectedElement.className.toLowerCase();
    const idStr = selectedElement.id.toLowerCase();
    const tagStr = selectedElement.tagName.toLowerCase();

    for (const [type, keywords] of Object.entries(HEURISTIC_PATTERNS)) {
      const match = keywords.some(keyword => 
        classStr.includes(keyword) || idStr.includes(keyword) || (tagStr === keyword && keyword !== 'h1')
      );
      if (match) return type;
    }
    if (tagStr === 'h1') return "HEADER";
    if (tagStr === 'nav') return "NAVIGATION";
    if (tagStr === 'aside') return "CTA";
    if (tagStr === 'footer') return "FOOTER";
    return null;
  }, [selectedElement]);

  // --- 5. ZAPISYWANIE WZORCA (LAYOUT vs COMPONENT) ---
  const handleSavePattern = async (isLayout: boolean, type: string = 'UNKNOWN') => {
    if (!selectedElement) return;
    setSaving(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      // Budowanie selektora
      let selector = selectedElement.tagName.toLowerCase();
      if (selectedElement.className) {
        selector += `.${selectedElement.className.split(' ')[0]}`;
      }

      await axios.post(`${apiUrl}/projects/${params.id}/patterns`, {
        selector,
        isLayout,
        componentType: type
      });

      alert(isLayout ? "✅ Marked as Layout (Unwrap)" : `✅ Marked as Component: ${type}`);
      
    } catch (error) {
      console.error(error);
      alert("❌ Error saving pattern");
    } finally {
      setSaving(false);
    }
  };

  // --- RENDER ---
  if (loading) return <div className="p-8">Loading...</div>;
  if (!page) return <div className="p-8 text-red-500">Page not found.</div>;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const proxyUrl = `${apiUrl}/projects/proxy?url=${encodeURIComponent(page.url)}`;

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Top Bar */}
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
          
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Inspector</h2>
          </div>

          <div className="p-6 flex-1">
            {selectedElement ? (
              <div className="space-y-6">
                
                {/* SUGESTIA */}
                {suggestion && (
                  <div className="bg-blue-50 border border-blue-200 p-4 flex items-start gap-3">
                    <div className="text-xl">💡</div>
                    <div>
                      <p className="text-xs font-bold text-blue-800 uppercase mb-1">Suggestion</p>
                      <p className="text-sm text-blue-900">
                        Looks like a <span className="font-bold underline">{suggestion}</span>.
                      </p>
                    </div>
                  </div>
                )}

                {/* SZCZEGÓŁY ELEMENTU */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 uppercase mb-2">Selected Node</label>
                  <div className="font-mono text-sm bg-gray-50 p-3 border border-gray-200 text-gray-700 break-all">
                    <span className="text-purple-600 font-bold">{selectedElement.tagName}</span>
                    {selectedElement.id && <span className="text-blue-600">#{selectedElement.id}</span>}
                    {selectedElement.className && <span className="text-orange-600">.{selectedElement.className.split(' ').join('.')}</span>}
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* --- PANEL DECYZYJNY (LAYOUT vs COMPONENT) --- */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Decision: What is this?
                  </h3>

                  <div className="space-y-3">
                    {/* OPCJA 1: LAYOUT */}
                    <div className="p-3 border border-yellow-200 bg-yellow-50 rounded-sm">
                      <p className="text-xs text-yellow-800 mb-2 font-medium">
                        Is this just a wrapper? (Grid, Container, Row)
                      </p>
                      <button 
                        onClick={() => handleSavePattern(true)}
                        disabled={saving}
                        className="w-full py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 text-xs font-bold uppercase transition-colors"
                      >
                        🚧 Mark as Layout (Unwrap)
                      </button>
                    </div>

                    <div className="flex items-center justify-center text-xs text-gray-400 font-medium">
                      — OR —
                    </div>

                    {/* OPCJA 2: KOMPONENT */}
                    <div className="p-3 border border-green-200 bg-green-50 rounded-sm">
                      <p className="text-xs text-green-800 mb-2 font-medium">
                        Is this a content block?
                      </p>
                      
                      <select 
                        id="compType"
                        defaultValue={suggestion || "RICH_TEXT"} // Domyślnie podpowiadamy sugestię
                        className="block w-full mb-2 p-2 text-xs border border-green-300 outline-none bg-white"
                      >
                        <option value="RICH_TEXT">Rich Text</option>
                        <option value="IMAGE">Image</option>
                        <option value="IMAGE_TEXT">Image + Text</option>
                        <option value="HERO_BANNER">Hero Banner</option>
                        <option value="CTA">CTA Box</option>
                        <option value="HEADER">Header / Title</option>
                        <option value="QUOTE">Quote</option>
                        <option value="TABLE">Table</option>
                      </select>

                      <button 
                        onClick={() => {
                          const type = (document.getElementById('compType') as HTMLSelectElement).value;
                          handleSavePattern(false, type);
                        }}
                        disabled={saving}
                        className="w-full py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase transition-colors"
                      >
                        📦 Define Component
                      </button>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100 my-6" />

                {/* LISTA ZAPISANYCH WZORCÓW */}
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Known Patterns</h3>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {patterns.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No patterns defined yet.</p>
                    ) : (
                      patterns.map(p => (
                        <div key={p.id} className={`flex justify-between items-center p-2 text-xs border ${p.isLayout ? 'bg-yellow-50 border-yellow-100' : 'bg-green-50 border-green-100'}`}>
                          <code className="text-gray-600 truncate max-w-[140px]">{p.selector}</code>
                          <span className={`font-bold ${p.isLayout ? 'text-yellow-700' : 'text-green-700'}`}>
                            {p.isLayout ? 'LAYOUT' : p.componentType}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

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