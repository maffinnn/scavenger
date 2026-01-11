
import React, { useState, useCallback, useEffect } from 'react';
import { Plus, X, Utensils, Search, AlertTriangle, Box, Loader2, Radio, Globe } from 'lucide-react';
import { Ingredient, Recipe, UNITS, CuisineType } from './types';
import { generateRecipesWithAI, generateRecipeImage } from './services/geminiService';
import RecipeCard from './components/RecipeCard';

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [qtyInput, setQtyInput] = useState("");
  const [unitInput, setUnitInput] = useState("pcs");
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>(CuisineType.Survival);
  
  // AI State
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Telemetry State
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [telemetryStatus, setTelemetryStatus] = useState<"SYNCING" | "ONLINE" | "RECOVERY">("SYNCING");

  // Visitor Tracking Implementation
  useEffect(() => {
    const trackVisitor = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        // Switching to api.counterapi.dev as countapi.xyz is frequently offline
        const response = await fetch(`https://api.counterapi.dev/v1/scavenger-ai-survival/global-nodes/up`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setVisitorCount(data.count || data.value);
          setTelemetryStatus("ONLINE");
        } else {
          throw new Error("API_REJECTED");
        }
      } catch (err) {
        clearTimeout(timeoutId);
        // Fallback to a "Local Session ID" if the global tracker fails
        setTelemetryStatus("RECOVERY");
        const localId = Math.floor(Math.random() * 90000) + 10000;
        setVisitorCount(localId);
      }
    };
    trackVisitor();
  }, []);

  const handleAddIngredient = () => {
    if (!nameInput.trim()) return;
    
    const newIng: Ingredient = {
      name: nameInput.trim().toLowerCase(),
      qty: parseFloat(qtyInput) || 1, 
      unit: unitInput
    };

    if (!ingredients.some(i => i.name === newIng.name)) {
      setIngredients([...ingredients, newIng]);
      setNameInput("");
      setQtyInput("");
    }
  };

  const removeIngredient = (ingName: string) => {
    setIngredients(ingredients.filter(i => i.name !== ingName));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAddIngredient();
  };

  const reset = () => {
    setGeneratedRecipes([]);
    setError("");
  };

  const handleGenerate = async () => {
    if (ingredients.length === 0) return;
    
    setLoading(true);
    setError("");
    setGeneratedRecipes([]);

    try {
      const recipes = await generateRecipesWithAI(ingredients, selectedCuisine);
      
      const recipesWithState = recipes.map(r => ({ ...r, imageUrl: null, imageLoading: true }));
      setGeneratedRecipes(recipesWithState);

      recipesWithState.forEach(async (recipe) => {
        try {
          const imgUrl = await generateRecipeImage(recipe.real_world_match || recipe.name);
          setGeneratedRecipes(prev => 
            prev.map(r => r.id === recipe.id ? { ...r, imageUrl: imgUrl, imageLoading: false } : r)
          );
        } catch (imgErr) {
          setGeneratedRecipes(prev => 
            prev.map(r => r.id === recipe.id ? { ...r, imageLoading: false } : r)
          );
        }
      });

    } catch (err: any) {
      console.error("Recipe generation failed:", err);
      setError("System breach or connectivity lost. Survival protocols offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-300 font-mono selection:bg-amber-900 selection:text-white pb-12">
      {/* Header */}
      <header className="bg-stone-900 border-b border-stone-800 p-6 sticky top-0 z-50 shadow-2xl shadow-black/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-amber-900/10 p-2.5 rounded-sm border border-amber-900/30">
               <Box className="h-7 w-7 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-[0.2em] text-stone-100 uppercase">SCAVENGER <span className="text-amber-600 text-xs align-top bg-amber-950/30 px-1 py-0.5 rounded ml-1 border border-amber-900/20">v3.0</span></h1>
              <span className="text-[10px] text-stone-500 font-bold tracking-[0.3em] block mt-1 uppercase">RESOURCE OPTIMIZATION ENGINE</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            {/* Global Telemetry Display */}
            <div className="flex flex-col items-end border-r border-stone-800 pr-6">
               <div className="flex items-center gap-2 mb-1">
                 <Globe className={`h-3 w-3 ${telemetryStatus === 'ONLINE' ? 'text-amber-600 animate-pulse' : 'text-stone-700'}`} />
                 <span className="text-[9px] text-stone-500 font-bold tracking-widest uppercase">
                   {telemetryStatus === 'RECOVERY' ? 'Local_Telemetry' : 'Global_Telemetry'}
                 </span>
               </div>
               <div className={`bg-stone-950 px-3 py-1 border rounded-sm transition-colors ${telemetryStatus === 'RECOVERY' ? 'border-stone-800' : 'border-amber-900/30'}`}>
                 <span className={`text-xs font-bold font-mono ${telemetryStatus === 'RECOVERY' ? 'text-stone-600' : 'text-amber-500'}`}>
                   {visitorCount !== null ? `NODE_${visitorCount.toString().padStart(6, '0')}` : 'SYNCING...'}
                 </span>
               </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full animate-pulse ${telemetryStatus === 'RECOVERY' ? 'bg-amber-700' : 'bg-emerald-500'}`}></div>
                <p className="text-stone-300 text-[10px] uppercase tracking-widest font-bold">
                  {telemetryStatus === 'RECOVERY' ? 'Isolated Session' : 'Mainframe Online'}
                </p>
              </div>
              <p className="text-stone-600 text-[9px] uppercase tracking-widest">SECURE CONNECTION ESTABLISHED</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-10">
        
        {/* INPUT SECTION */}
        <section className={`bg-stone-900 rounded-sm border border-stone-800 p-8 transition-all relative overflow-hidden shadow-xl ${generatedRecipes.length > 0 ? 'opacity-60 hover:opacity-100' : ''}`}>
           {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-amber-800/60"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-amber-800/60"></div>
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-amber-800/60"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-amber-800/60"></div>

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700 flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Scan Cache: Input Available Resources
            </h2>
            <div className="text-[9px] text-stone-600 uppercase font-bold bg-stone-950 px-2 py-1 rounded border border-stone-800">
              MODULE_TYPE: SUPPLY_LOADER
            </div>
          </div>

          {/* Add Ingredient Row */}
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            <div className="flex-1 group">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="RESOURCE ID (E.G. POTATOES)"
                className="w-full px-5 py-4 bg-stone-950 border border-stone-800 rounded-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:border-amber-900 focus:ring-1 focus:ring-amber-900/20 uppercase text-sm transition-all"
              />
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <input
                type="number"
                value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="QTY"
                className="w-24 px-5 py-4 bg-stone-950 border border-stone-800 rounded-sm text-stone-200 placeholder-stone-700 focus:outline-none focus:border-amber-900 uppercase text-sm"
              />
              <select 
                value={unitInput}
                onChange={(e) => setUnitInput(e.target.value)}
                className="w-28 px-3 py-4 bg-stone-950 border border-stone-800 rounded-sm text-stone-300 focus:outline-none focus:border-amber-900 uppercase text-xs font-bold tracking-widest cursor-pointer"
              >
                {UNITS.map(u => <option key={u} value={u}>{u.toUpperCase()}</option>)}
              </select>
              <button 
                onClick={handleAddIngredient}
                className="bg-stone-800 hover:bg-stone-700 border border-stone-700 text-amber-500 px-8 py-4 rounded-sm font-bold transition-all active:scale-95 group"
              >
                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </div>

          {/* Tag Cloud */}
          <div className="flex flex-wrap gap-2.5 mb-8 min-h-[100px] bg-stone-950/40 p-6 border border-stone-800/80 content-start rounded-sm">
            {ingredients.length === 0 && (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-700 gap-3 py-4">
                <Radio className="h-6 w-6 animate-pulse" />
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Waiting for local cache telemetry...</p>
              </div>
            )}
            {ingredients.map((ing, idx) => (
              <span key={idx} className="bg-stone-900/80 border border-stone-700 text-stone-400 px-4 py-2.5 text-xs font-bold uppercase flex items-center gap-3 group hover:border-amber-900/60 transition-all cursor-default shadow-sm animate-in zoom-in-95">
                <span className="text-stone-200">{ing.name}</span>
                <span className="text-amber-700 text-[10px] font-mono">
                  [{ing.qty}{ing.unit}]
                </span>
                <button 
                  onClick={() => removeIngredient(ing.name)} 
                  className="text-stone-600 hover:text-red-500 ml-1 transition-colors p-1"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-stone-800/50">
             <div>
              <label className="block text-[10px] font-bold text-stone-600 mb-3 uppercase tracking-[0.3em]">Operational Protocol</label>
              <select 
                value={selectedCuisine} 
                onChange={(e) => setSelectedCuisine(e.target.value as CuisineType)}
                className="w-full p-3 bg-stone-950 border border-stone-800 rounded-sm text-stone-400 focus:border-amber-900 outline-none uppercase text-xs font-bold tracking-widest cursor-pointer"
              >
                {Object.values(CuisineType).map(type => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-stone-600 mb-3 uppercase tracking-[0.3em]">Resource Parameters</label>
               <div className="flex items-start gap-3 text-[10px] text-stone-500 bg-stone-950 p-4 border border-stone-800 leading-relaxed italic">
                 <AlertTriangle className="h-4 w-4 text-amber-900 flex-shrink-0 mt-0.5" />
                 <span className="uppercase">Notice: Base staples (Salt, Oil, Pepper, Water, Flour) are assumed available in current sector. Optimized recipes will prioritize minimal waste.</span>
               </div>
            </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={ingredients.length === 0 || loading}
            className={`w-full mt-10 py-5 border font-bold text-[11px] tracking-[0.4em] uppercase flex items-center justify-center gap-4 transition-all duration-300 ${
              ingredients.length > 0 && !loading
                ? 'bg-amber-900/10 border-amber-900 text-amber-500 hover:bg-amber-900 hover:text-white hover:border-amber-700 shadow-[0_0_25px_-5px_rgba(245,158,11,0.2)] active:scale-[0.98]' 
                : 'bg-stone-900 border-stone-800 text-stone-700 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Calculating Yield...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Initialize Neural Generation
              </>
            )}
          </button>
        </section>

        {/* ERROR STATE */}
        {error && (
          <div className="bg-red-950/20 border border-red-900/50 p-6 text-center animate-in slide-in-from-top-4 rounded-sm shadow-lg">
            <p className="text-red-500 text-xs font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3">
              <AlertTriangle className="h-5 w-5" /> {error}
            </p>
          </div>
        )}

        {/* RESULTS SECTION */}
        {generatedRecipes.length > 0 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
            
            <div className="flex items-center justify-between border-b border-stone-800 pb-6">
              <h2 className="text-xl font-bold text-stone-100 uppercase tracking-[0.3em] flex items-center gap-3">
                <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                Neural Analysis Complete
              </h2>
              <button 
                onClick={reset} 
                className="text-[10px] text-stone-600 font-bold uppercase hover:text-amber-600 tracking-[0.3em] transition-all hover:translate-x-1"
              >
                Wipe Session_Data &gt;&gt;
              </button>
            </div>

            <div className="grid grid-cols-1 gap-10">
              {generatedRecipes.map((recipe, idx) => (
                <RecipeCard key={idx} recipe={recipe} />
              ))}
            </div>
            
            <div className="flex justify-center pt-8">
               <div className="text-[9px] text-stone-700 font-bold tracking-[0.5em] uppercase border border-stone-900 px-6 py-3 rounded-full">
                  EOF: End of Scavenger Telemetry
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
