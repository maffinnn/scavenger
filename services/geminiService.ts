
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Ingredient, Recipe } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateRecipesWithAI = async (ingredients: Ingredient[], cuisine: string): Promise<Recipe[]> => {
  const ai = getAIClient();
  const ingredientList = ingredients.map(i => `${i.qty} ${i.unit} of ${i.name}`).join(', ');

  const prompt = `
    Role: You are a survivalist AI cooking assistant named "Scavenger".
    Context: The user has limited resources: [${ingredientList}]. 
    Assume they also have basic staples (salt, pepper, oil, water, flour, sugar).
    
    Task: Generate 3 distinct recipes based STRICTLY on these available resources. 
    If they don't have enough ingredients for a "real" meal, invent a creative survival dish using what they have.
    The names of the dishes should sound slightly dire or utilitarian (e.g., "Rationed Protein Stew", "Sector 7 Stir-fry").
    
    CRITICAL ADDITION: For each recipe, identify the closest REAL WORLD recipe name. Provide this for visual reference.
    
    Cuisine Bias: ${cuisine} style.

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
                name: { type: Type.STRING, description: "Dire survivalist name of the dish" },
                real_world_match: { type: Type.STRING, description: "Common real-world name of this dish" },
                cuisine: { type: Type.STRING },
                time: { type: Type.STRING, description: "Time to prepare, e.g. 15m" },
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
  const prompt = `Professional food photography of ${dishName}, appetizing but in a survivalist/rustic setting, high resolution, 4k, cinematic lighting, shallow depth of field.`;

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
