
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGameCommentary = async (score: number, level: number, status: 'WON' | 'GAME_OVER') => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The player just ${status.toLowerCase().replace('_', ' ')} a game of Pac-Man. 
      Final Score: ${score}. Level reached: ${level}.
      Provide a brief, retro-gaming-themed commentary (max 30 words) in the style of an 80s arcade announcer.`,
      config: {
        temperature: 0.8,
      }
    });
    return response.text || "GAME OVER. INSERT COIN TO PLAY AGAIN.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return status === 'WON' ? "YOU ARE THE PAC-MASTER!" : "GAME OVER. TRY AGAIN?";
  }
};

export const getStrategyTip = async () => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Give a short, witty, and actually useful pro-tip for playing Pac-Man. Max 20 words.",
      config: {
        temperature: 0.9,
      }
    });
    return response.text || "Keep moving, don't get cornered!";
  } catch (error) {
    return "The ghosts have patterns. Learn them.";
  }
};
