import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Loader2 } from "lucide-react";

const GIPHY_API_KEY = "GlVGYHkr3WSBnllca54iNt0yFbjz7L65";
const GIPHY_BASE = "https://api.giphy.com/v1/gifs";

interface GifResult {
  id: string;
  title: string;
  preview: string;
  original: string;
  width: number;
  height: number;
}

interface GifPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (gifUrl: string) => void;
}

async function searchGifs(query: string, offset = 0): Promise<GifResult[]> {
  const endpoint = query.trim()
    ? `${GIPHY_BASE}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&offset=${offset}&rating=pg-13&lang=pt`
    : `${GIPHY_BASE}/trending?api_key=${GIPHY_API_KEY}&limit=20&offset=${offset}&rating=pg-13`;

  const res = await fetch(endpoint);
  if (!res.ok) return [];
  const json = await res.json();

  return (json.data || []).map((g: any) => ({
    id: g.id,
    title: g.title || "",
    preview: g.images?.fixed_width_small?.url || g.images?.fixed_width?.url || "",
    original: g.images?.original?.url || "",
    width: parseInt(g.images?.original?.width || "0", 10),
    height: parseInt(g.images?.original?.height || "0", 10),
  }));
}

export function GifPicker({ open, onClose, onSelect }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Fetch results
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    searchGifs(debouncedQuery).then((gifs) => {
      if (!cancelled) {
        setResults(gifs);
        setLoading(false);
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      }
    });
    return () => { cancelled = true; };
  }, [debouncedQuery, open]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleSelect = useCallback((gif: GifResult) => {
    onSelect(gif.original);
    onClose();
  }, [onSelect, onClose]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        className="absolute bottom-full left-0 right-0 mb-2 mx-2 z-30"
      >
        <div className="glass rounded-xl overflow-hidden border border-border shadow-lg flex flex-col" style={{ maxHeight: "360px" }}>
          {/* Header */}
          <div className="flex items-center gap-2 p-2.5 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar GIFs..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-1 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Results grid */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-2" style={{ minHeight: "200px" }}>
            {loading ? (
              <div className="flex items-center justify-center h-full py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center h-full py-8 text-muted-foreground text-sm">
                {debouncedQuery ? "Nenhum GIF encontrado" : "Carregando GIFs populares..."}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {results.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => handleSelect(gif)}
                    className="relative rounded-lg overflow-hidden aspect-square hover:ring-2 hover:ring-primary transition-all group"
                  >
                    <img
                      src={gif.preview}
                      alt={gif.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Giphy attribution */}
          <div className="px-2.5 py-1.5 border-t border-border flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground">Powered by GIPHY</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
