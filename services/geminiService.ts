import { GoogleGenAI, Type, Schema } from "@google/genai";
import { LevelTheme } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const levelSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A creative name for the level theme." },
    description: { type: Type.STRING, description: "A short, one-sentence exciting backstory." },
    backgroundColor: { type: Type.STRING, description: "Hex color for the very back background (sky/void)." },
    groundColor: { type: Type.STRING, description: "Hex color for the ground platform." },
    playerColor: { type: Type.STRING, description: "Hex color for the player character." },
    obstacleColor: { type: Type.STRING, description: "Hex color for obstacles." },
    skyColor: { type: Type.STRING, description: "Hex color for a gradient overlay or sun/moon accent." },
    gravity: { type: Type.NUMBER, description: "Physics gravity value. Low (0.4) for space, High (0.9) for heavy worlds. Default around 0.6." },
    speed: { type: Type.NUMBER, description: "Base game speed. 5 is slow, 12 is fast. Default around 8." },
    jumpStrength: { type: Type.NUMBER, description: "Jump power. 10 is weak, 20 is super jump. Default around 15." },
  },
  required: ["name", "description", "backgroundColor", "groundColor", "playerColor", "obstacleColor", "skyColor", "gravity", "speed", "jumpStrength"],
};

export const generateLevelTheme = async (prompt: string): Promise<LevelTheme> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a game level design based on this theme: "${prompt}". 
      Make sure the colors have good contrast so the player is visible against the background. 
      Return purely JSON data.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: levelSchema,
        systemInstruction: "You are a master game designer specializing in color theory and game physics."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as LevelTheme;
  } catch (error) {
    console.error("Gemini Level Gen Error:", error);
    // Fallback theme if API fails or key is missing
    return {
      name: "Fallback Zone",
      description: "Connection failed, running in simulation mode.",
      backgroundColor: "#111827",
      groundColor: "#374151",
      playerColor: "#3B82F6",
      obstacleColor: "#EF4444",
      skyColor: "#1F2937",
      gravity: 0.6,
      speed: 8,
      jumpStrength: 15
    };
  }
};