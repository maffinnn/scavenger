
import React, { useState } from 'react';
import { Clock, Flame, AlertTriangle, Utensils, ArrowRight, MonitorPlay, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Recipe, Language } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  language: Language;
}

const LOCALIZED_LABELS = {
  [Language.EN]: {
    rendering: "Rendering Visuals...",
    corrupted: "Visual Corrupted",
    unknown: "UNKNOWN",
    steps: "Extract Steps",
    close: "Close Data",
    scan: "Scan Visuals",
    protocols: "Execution Protocols",
    deficit: "CRITICAL DEFICIT",
    sub: "SUB"
  },
  [Language.ZH]: {
    rendering: "正在渲染视觉效果...",
    corrupted: "视觉数据损坏",
    unknown: "未知",
    steps: "提取步骤",
    close: "关闭数据",
    scan: "扫描影像",
    protocols: "执行协议",
    deficit: "关键缺口",
    sub: "替代"
  }
};

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, language }) => {
  const [expanded, setExpanded] = useState(false);
  const isOptimal = !recipe.missing || recipe.missing.length === 0;
  const labels = LOCALIZED_LABELS[language];

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    (recipe.real_world_match || recipe.name) + " recipe tutorial"
  )}`;

  return (
    <div className={`bg-stone-900 rounded-sm overflow-hidden border transition-all duration-300 ${isOptimal ? 'border-emerald-900/30 hover:border-emerald-800/60' : 'border-amber-900/30 hover:border-amber-800/60'}`}>
      
      {/* Recipe Image Slot */}
      <div className="w-full h-56 bg-stone-950 relative border-b border-stone-800 group overflow-hidden">
        {recipe.imageLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-700 bg-stone-950/50">
            <Loader2 className="h-8 w-8 animate-spin mb-2 text-amber-900" />
            <span className="text-[10px] uppercase tracking-widest animate-pulse font-bold">{labels.rendering}</span>
          </div>
        ) : recipe.imageUrl ? (
          <img 
            src={recipe.imageUrl} 
            alt={recipe.name} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-700">
             <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
             <span className="text-[10px] uppercase tracking-widest">{labels.corrupted}</span>
          </div>
        )}
        
        <div className={`absolute top-0 left-0 bottom-0 w-1 ${isOptimal ? 'bg-emerald-600' : 'bg-amber-600'} z-10`} />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-stone-950 to-transparent pointer-events-none" />
      </div>

      <div className="p-6 relative">
        <div className="flex justify-between items-start mb-4">
          <div className="pl-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-stone-600 uppercase mb-1 block">
              {recipe.cuisine} // {recipe.real_world_match ? recipe.real_world_match.toUpperCase() : labels.unknown}
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-stone-100 uppercase tracking-tight font-mono leading-tight">{recipe.name}</h3>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-950/20 px-2 py-1 border border-amber-900/20 rounded-sm">
              <Clock className="h-3 w-3" /> {recipe.time}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-950 px-2 py-1 border border-stone-800 rounded-sm">
              <Flame className="h-3 w-3" /> {recipe.difficulty}
            </div>
          </div>
        </div>

        {recipe.missing && recipe.missing.length > 0 && (
          <div className="mb-4 space-y-2 pl-3">
            {recipe.missing.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 text-[10px] px-3 py-2 border border-red-900/30 bg-red-950/20 text-red-400">
                 <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                 <span className="font-mono uppercase tracking-wide">
                   <span className="font-bold">{labels.deficit} [{item.name.toUpperCase()}]:</span> {item.reason || "Missing"}
                   {item.sub && <span className="text-stone-500 ml-1"> >> {labels.sub}: {item.sub.toUpperCase()}</span>}
                 </span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-8 pl-3">
          {recipe.ingredients.map((ing, i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-wide bg-stone-950 text-stone-400 px-2 py-1 border border-stone-800 hover:border-amber-900 transition-colors">
              {ing}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pl-3">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex-1 flex items-center justify-center gap-2 bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-stone-100 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border border-stone-800 active:scale-95"
          >
            {expanded ? labels.close : labels.steps}
            <ArrowRight className={`h-3 w-3 transition-transform ${expanded ? '-rotate-90' : 'rotate-90'}`} />
          </button>
          
          <a 
            href={searchUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-stone-950 hover:bg-amber-900/10 text-amber-700 hover:text-amber-500 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border border-amber-900/30 active:scale-95"
          >
            <MonitorPlay className="h-3 w-3" />
            {labels.scan}
          </a>
        </div>
      </div>

      {expanded && (
        <div className="bg-stone-950/80 p-8 border-t border-stone-800 animate-in slide-in-from-top-2">
          <h4 className="font-bold text-amber-700 text-[10px] uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
             <Utensils className="h-3 w-3" /> {labels.protocols}
          </h4>
          <ol className="space-y-6">
            {recipe.instructions.map((step, idx) => (
              <li key={idx} className="flex gap-4 text-stone-400 text-sm font-mono leading-relaxed group">
                <span className="flex-shrink-0 w-8 h-8 bg-stone-900 text-stone-600 group-hover:text-amber-600 border border-stone-800 group-hover:border-amber-900 flex items-center justify-center text-[11px] font-bold transition-all duration-300">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className="pt-1.5 transition-colors duration-300 group-hover:text-stone-200">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default RecipeCard;
