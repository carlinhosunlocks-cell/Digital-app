
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from "../types";

// Helper to get response from Gemini
export const getGeminiChatResponse = async (history: ChatMessage[], newMessage: string): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey });
    
    // Construct simplified history context
    let promptContext = "Você é o assistente virtual da Digital Equipamentos. Ajude o cliente com dúvidas técnicas básicas, agendamento de manutenção ou status de ordens. Seja breve e profissional.\n\nHistórico:\n";
    
    history.forEach(msg => {
      promptContext += `${msg.sender === 'user' ? 'Cliente' : 'Assistente'}: ${msg.text}\n`;
    });
    
    promptContext += `Cliente: ${newMessage}\nAssistente:`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: promptContext,
    });

    return response.text || "Desculpe, não consegui processar sua solicitação no momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Estamos enfrentando dificuldades técnicas. Por favor, tente novamente mais tarde.";
  }
};
