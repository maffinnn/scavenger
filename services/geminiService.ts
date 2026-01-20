
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Ingredient, Recipe, Language } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateRecipesWithAI = async (ingredients: Ingredient[], cuisine: string, lang: Language = Language.EN): Promise<Recipe[]> => {
  const ai = getAIClient();
  const ingredientList = ingredients.map(i => `${i.qty} ${i.unit} of ${i.name}`).join(', ');

  const langInstruction = lang === Language.ZH 
    ? "所有输出文本（名称、步骤、配料、难度等）必须使用简体中文。请确保食谱名称和描述是标准且通俗易懂的。"
    : "All output text MUST be in English. Ensure recipe names and descriptions are standard, clear, and appetizing.";

  const prompt = `
    Role: You are a professional culinary assistant.
    Context: The user has limited resources: [${ingredientList}]. 
    Assume they also have basic staples (salt, pepper, oil, water, flour, sugar, butter, soy sauce).
    
    Task: Generate 3 distinct, high-quality recipes based on these available resources. 
    The names of the dishes should be standard, professional, and recognizable culinary names (e.g., "Homemade Tomato Pasta" instead of "Red Scavenger Mash").
    
    Cuisine Bias: ${cuisine} style.
    Language Instruction: ${langInstruction}

    Return strictly valid JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recipes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                name: { type: Type.STRING, description: "Standard, appetizing name of the dish" },
                real_world_match: { type: Type.STRING, description: "The common name this dish is known by globally" },
                cuisine: { type: Type.STRING },
                time: { type: Type.STRING, description: "Time to prepare" },
                difficulty: { type: Type.STRING, description: "Easy, Medium, or Hard" },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
                missing: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      reason: { type: Type.STRING },
                      sub: { type: Type.STRING }
                    }
                  }
                }
              },
              required: ["id", "name", "real_world_match", "cuisine", "time", "difficulty", "ingredients", "instructions"]
            }
          }
        },
        required: ["recipes"]
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response content received from AI.");
  
  const parsed = JSON.parse(text);
  return parsed.recipes;
};

export const generateRecipeImage = async (dishName: string): Promise<string | null> => {
  const ai = getAIClient();
  const prompt = `Professional food photography of ${dishName}, highly appetizing, elegant plating, high resolution, 4k, cinematic lighting, shallow depth of field, neutral background.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Image generation error:", error);
  }
  return null;
};
