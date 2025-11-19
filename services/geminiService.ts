import { GoogleGenAI } from "@google/genai";
import { AgentConfig } from "../types";

export const runGeminiAgent = async (
  apiKey: string,
  agent: AgentConfig,
  inputText: string
): Promise<{ output: string; tokens: number }> => {
  if (!apiKey) {
    throw new Error("API Key is required.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Use the model specified in the agent config, or default to 2.5-flash
    const modelId = agent.model || 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model: modelId,
      contents: [
        {
          role: 'user',
          parts: [
            { text: agent.system_prompt }, 
            { text: `${agent.user_prompt}\n\n---Document Content---\n${inputText}` }
          ]
        }
      ],
      config: {
        temperature: agent.temperature,
        topP: agent.top_p,
        maxOutputTokens: agent.max_tokens,
      }
    });

    const outputText = response.text || "No response generated.";
    const estimatedTokens = Math.ceil((agent.system_prompt.length + agent.user_prompt.length + inputText.length + outputText.length) / 4);

    return {
      output: outputText,
      tokens: estimatedTokens
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return {
      output: `Error executing agent ${agent.name}: ${error.message || 'Unknown error'}`,
      tokens: 0
    };
  }
};

export const runGeminiVisionOCR = async (
  apiKey: string,
  model: string,
  base64Images: string[]
): Promise<string> => {
  if (!apiKey) {
      throw new Error("API Key is required for OCR.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  try {
      // Construct the parts: Text prompt + multiple images
      const parts: any[] = [
        { text: "You are a high-precision OCR engine. Transcribe the text in these document pages exactly as it appears. Maintain the original structure. If there are tables, format them as Markdown tables. Do not add conversational text, just the transcription." }
      ];

      // Add all images
      base64Images.forEach(b64 => {
        parts.push({
            inlineData: {
                mimeType: "image/png",
                data: b64
            }
        });
      });

      const response = await ai.models.generateContent({
          model: model,
          contents: { parts }
      });
      
      return response.text || "No text extracted.";
  } catch (error: any) {
      console.error("OCR Error:", error);
      throw new Error(`OCR Failed: ${error.message}`);
  }
};

export const refineTextWithAI = async (
  apiKey: string,
  text: string,
  prompt: string,
  config: { model: string; maxTokens: number }
): Promise<string> => {
  if (!apiKey) throw new Error("API Key required");
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: config.model || 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${prompt}\n\n---Input Text---\n${text}` }]
        }
      ],
      config: {
        maxOutputTokens: config.maxTokens || 2000,
        temperature: 0.3
      }
    });
    return response.text || text;
  } catch (e) {
    console.error(e);
    throw e;
  }
};