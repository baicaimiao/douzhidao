import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { SYSTEM_INSTRUCTION } from "../constants";

let chatInstance: Chat | null = null;
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Initialize or reset the chat with a specific instruction and model
export const initChat = (
  systemInstruction: string = SYSTEM_INSTRUCTION, 
  model: string = 'gemini-3-flash-preview'
): Chat => {
  chatInstance = ai.chats.create({
    model: model,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
      topK: 40,
      thinkingConfig: { thinkingBudget: 0 }
    },
  });
  return chatInstance;
};

export const getChatInstance = (): Chat => {
  if (!chatInstance) {
    // If accessed before explicitly initialized, use default
    return initChat();
  }
  return chatInstance;
};

export const resetChat = () => {
  chatInstance = null;
};

export async function* sendMessageStream(message: string) {
  const chat = getChatInstance();
  
  try {
    const resultStream = await chat.sendMessageStream({ message });

    for await (const chunk of resultStream) {
      const responseChunk = chunk as GenerateContentResponse;
      if (responseChunk.text) {
        yield responseChunk.text;
      }
    }
  } catch (error) {
    console.error("Error in Gemini stream:", error);
    throw error;
  }
}
