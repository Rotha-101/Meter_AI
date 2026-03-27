import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// We use process.env.GEMINI_API_KEY as configured in vite.config.ts
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface MeterData {
  registerCode: string;
  energyReading: string;
  serialNumber: string;
}

/**
 * Extracts specific meter readings from a base64 encoded image.
 * 
 * @param base64Image The base64 data URL of the image
 * @returns A promise that resolves to the extracted MeterData
 */
export async function extractMeterData(base64Image: string): Promise<MeterData> {
  // Extract the MIME type and the raw base64 data from the data URL
  const match = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data format. Expected base64 data URL.");
  }
  
  const mimeType = match[1];
  const base64Data = match[2];

  const prompt = `
    Analyze this electricity meter image. Act as an OCR and data extraction pipeline.
    Your task is to detect the regions of interest and extract exactly three values.
    
    1. Register Code: Look for a code like "1.8.0" or "2.8.0" usually on the digital display.
    2. Energy Reading: Look for the main large number on the display, often followed by "kWh" or "varh". Include the unit if visible.
    3. Serial Number: Look for a serial number, often prefixed with "S/N:" or similar on a sticker or printed on the casing. Extract just the number if possible, or the whole string if it's ambiguous.

    Return the extracted data strictly in the requested JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            registerCode: { 
              type: Type.STRING, 
              description: "The register code, e.g., '2.8.0'" 
            },
            energyReading: { 
              type: Type.STRING, 
              description: "The energy reading value including units, e.g., '009575310 kWh'" 
            },
            serialNumber: { 
              type: Type.STRING, 
              description: "The serial number, e.g., '253626627'" 
            }
          },
          required: ["registerCode", "energyReading", "serialNumber"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No text returned from Gemini API.");
    }

    const data = JSON.parse(response.text) as MeterData;
    return data;
  } catch (error) {
    console.error("Error extracting meter data:", error);
    throw new Error("Failed to process the image. Please try again with a clearer photo.");
  }
}
