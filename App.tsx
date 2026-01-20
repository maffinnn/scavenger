
import React, { useState, useEffect } from 'react';
import { Plus, X, Utensils, Search, Box, Loader2, Radio, Globe, Video, Download, Play, ShieldAlert, AlertCircle, Map } from 'lucide-react';
import { Ingredient, Recipe, UNITS, CuisineType } from './types';
import { generateRecipesWithAI, generateRecipeImage } from './services/geminiService';
import { GoogleGenAI } from "@google/genai";
import RecipeCard from './components/RecipeCard';

export default function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [qtyInput, setQtyInput] = useState("");
  const [unitInput, setUnitInput] = useState("pcs");
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>(CuisineType.Survival);
  
  // Validation State
  const [validationError, setValidationError] = useState("");

  // AI State
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Telemetry State
  const [visitorCount, setVisitorCount] = useState<number | null>(null);
  const [telemetryStatus, setTelemetryStatus] = useState<"SYNCING" | "ONLINE" | "RECOVERY">("SYNCING");

  useEffect(() => {
    const trackVisitor = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
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
        setTelemetryStatus("RECOVERY");
        const localId = Math.floor(Math.random() * 90000) + 10000;
        setVisitorCount(localId);
      }
    };
    trackVisitor();
  }, []);

  const validateInput = (value: string) => {
    if (!value) return { valid: true, msg: "" };
    
    // 1. English Only check (Alphabetic + spaces)
    const englishRegex = /^[A-Za-z\s]+$/;
    if (!englishRegex.test(value)) {
      return { valid: false, msg: "CRITICAL: ENGLISH ALPHABETIC CHARACTERS ONLY." };
    }

    // 2. List detection (Checking for commas or common list markers)
    if (value.includes(",") || value.includes(";") || value.includes("&")) {
       return { valid: false, msg: "INVALID ENTRY: MULTIPLE RESOURCES DETECTED. ENTER ONE AT A TIME." };
    }

    // 3. Word count check
    const wordCount = value.trim().split(/\s+/).length;
    if (wordCount > 4) {
      return { valid: false, msg: "INVALID ENTRY: INPUT TOO COMPLEX. ENTER A SINGLE RESOURCE NAME." };
    }

    return { valid: true, msg: "" };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNameInput(value);
    const validation = validateInput(value);
    setValidationError(validation.msg);
  };

  const handleAddIngredient = () => {
    if (!nameInput.trim()) return;
    
    const validation = validateInput(nameInput);
    if (!validation.valid) {
      setValidationError(validation.msg);
      return;
    }

    const newIng: Ingredient = {
      name: nameInput.trim().toLowerCase(),
      qty: parseFloat(qtyInput) || 1, 
      unit: unitInput
    };

    if (!ingredients.some(i => i.name === newIng.name)) {
      setIngredients([...ingredients, newIng]);
      setNameInput("");
      setQtyInput("");
      setValidationError("");
    } else {
      setValidationError("RESOURCE ALREADY REGISTERED IN CACHE.");
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
      setError("System breach or connectivity lost. Survival protocols offline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-300 font-mono selection:bg-amber-900 selection:text-white pb-12">
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
            <div className="bg-stone-950 px-3 py-1 border border-amber-900/30 rounded-sm">
                 <span className="text-xs font-bold text-amber-500">
                   NODE_{visitorCount !== null ? visitorCount.toString().padStart(6, '0') : 'SYNC...'}
                 </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-10">
        {/* INPUT SECTION */}
        <section className={`bg-stone-900 rounded-sm border border-stone-800 p-8 transition-all relative overflow-hidden shadow-xl ${generatedRecipes.length > 0 ? 'opacity-60 hover:opacity-100' : ''}`}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700 flex items-center gap-2">
              <Utensils className="h-4 w-4" /> Scan Cache: Resource Input
            </h2>
            <div className="text-[9px] text-stone-600 uppercase font-bold bg-stone-950 px-2 py-1 rounded border border-stone-800">
              SINGLE_ENTRY_MODE: ENABLED
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mb-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={nameInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="RESOURCE NAME (E.G. POTATOES)"
                className={`w-full px-5 py-4 bg-stone-950 border rounded-sm text-stone-200 placeholder-stone-700 focus:outline-none uppercase text-sm transition-colors ${
                  validationError ? 'border-red-900 focus:border-red-600' : 'border-stone-800 focus:border-amber-900'
                }`}
              />
            </div>
            <div className="flex gap-3">
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
                disabled={!!validationError}
                className={`px-8 py-4 rounded-sm font-bold transition-all border ${
                  validationError ? 'bg-stone-950 border-stone-900 text-stone-800 cursor-not-allowed' : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-amber-500'
                }`}
              >
                <Plus />
              </button>
            </div>
          </div>

          {/* Validation Feedback */}
          <div className="min-h-[24px] mb-6">
            {validationError && (
              <p className="text-[10px] text-red-500 font-bold flex items-center gap-2 animate-pulse uppercase tracking-wider">
                <AlertCircle className="h-3 w-3" /> {validationError}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 mb-8 min-h-[100px] bg-stone-950/40 p-6 border border-stone-800/80 rounded-sm">
            {ingredients.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-stone-700 py-4">
                <Radio className="h-6 w-6 animate-pulse mb-2" />
                <p className="text-[10px] uppercase tracking-widest font-bold">Waiting for input...</p>
              </div>
            ) : (
              ingredients.map((ing, idx) => (
                <span key={idx} className="bg-stone-900/80 border border-stone-700 text-stone-400 px-4 py-2.5 text-xs font-bold uppercase flex items-center gap-3 animate-in zoom-in-95">
                  <span className="text-stone-200">{ing.name}</span>
                  <span className="text-amber-700 text-[10px] font-mono">[{ing.qty}{ing.unit}]</span>
                  <button onClick={() => removeIngredient(ing.name)} className="text-stone-600 hover:text-red-500 transition-colors"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))
            )}
          </div>

          {/* Cuisine Selection */}
          <div className="mb-8 space-y-4">
             <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-600 flex items-center gap-2">
               <Map className="h-3 w-3" /> Operational Sector Selection
             </h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
               {Object.values(CuisineType).map((cuisine) => (
                 <button
                   key={cuisine}
                   onClick={() => setSelectedCuisine(cuisine)}
                   className={`px-3 py-3 text-[9px] font-bold uppercase tracking-wider border transition-all duration-300 flex flex-col items-center justify-center gap-1.5 min-h-[64px] ${
                     selectedCuisine === cuisine 
                       ? 'bg-amber-900/10 border-amber-600 text-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.1)]' 
                       : 'bg-stone-950 border-stone-800 text-stone-600 hover:border-stone-700 hover:text-stone-400'
                   }`}
                 >
                   {selectedCuisine === cuisine && <Radio className="h-3 w-3 animate-pulse" />}
                   <span className="text-center">{cuisine}</span>
                 </button>
               ))}
             </div>
          </div>

          <button 
            onClick={handleGenerate}
            disabled={ingredients.length === 0 || loading}
            className={`w-full py-5 border font-bold text-[11px] tracking-[0.4em] uppercase flex items-center justify-center gap-4 transition-all duration-300 ${
              ingredients.length > 0 && !loading
                ? 'bg-amber-900/10 border-amber-900 text-amber-500 hover:bg-amber-900 hover:text-white' 
                : 'bg-stone-900 border-stone-800 text-stone-700 cursor-not-allowed'
            }`}
          >
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" />CALCULATING PROTOCOLS...</> : <><Search className="h-5 w-5" />EXECUTE RESOURCE ANALYSIS</>}
          </button>
        </section>

        {/* RESULTS SECTION */}
        {generatedRecipes.length > 0 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center justify-between border-b border-stone-800 pb-6">
              <h2 className="text-xl font-bold text-stone-100 uppercase tracking-[0.3em] flex items-center gap-3">
                Yield Analysis Complete
              </h2>
              <button onClick={reset} className="text-[10px] text-stone-600 font-bold uppercase hover:text-amber-600 tracking-[0.3em]">Wipe Data &gt;&gt;</button>
            </div>
            <div className="grid grid-cols-1 gap-10">
              {generatedRecipes.map((recipe, idx) => <RecipeCard key={idx} recipe={recipe} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
