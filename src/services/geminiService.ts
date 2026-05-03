import { GoogleGenAI, Type } from "@google/genai";
import { ProjectData, RoomDesignData, DesignReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes("429") || error?.status === 429 || error?.code === 429;
      const isForbidden = error?.message?.includes("403") || error?.status === 403;
      
      // Retry on rate limits (429) OR transient forbidden errors (403 can sometimes be transient in preview environments)
      if ((isRateLimit || isForbidden) && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 3000 + Math.random() * 1000;
        console.warn(`Gemini API Error (${isRateLimit ? '429' : '403'}). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function analyzeRoomLayout(
  project: ProjectData,
  room: RoomDesignData
): Promise<DesignReport> {
  return withRetry(async () => {
    const prompt = `
      You are an elite Interior Architect and Historical Preservation Consultant. 
      Property Identity: ${project.projectName}
      Architectural Heritage/Age: ${project.propertyAge}
      
      Room Specification: ${room.type}
      Design Aesthetic: ${room.style} (Ensure the logic strictly follows this architectural style)
      Existing Furnishings to Incorporate: ${room.existingFurniture}
      Fixed Architectural Features: ${room.architecturalFeatures || 'None specified. Rely on Floor Plan.'}
      User Preferences & Functional requirements: ${JSON.stringify(room.specificAnswers)}
      ${room.technicalBrief ? `Additional Technical Brief: ${room.technicalBrief}` : ''}

      CRITICAL ARCHITECTURAL CONSTRAINTS:
      1. The 'Floor Plan' image is the SOLE AUTHORITY for structural bounds. 
      2. ARCHITECTURAL SYMBOL AUDIT (MAXIMUM PRECISION): 
         - STEP 01: Trace each continuous thick wall line.
         - STEP 02: IGNORE ALL DIMENSION STRINGS. These are thin lines with numbers (e.g. '3450', '2100', '1200') that sit parallel to walls. They are MEASUREMENTS, NOT windows. If you see a number, it is NOT an opening.
         - STEP 03: IGNORE LEADER LINES & ARROWS. These are markings, not windows.
         - STEP 04: Identify WINDOWS only as structural breaks in the thick perimeter wall. 
         - STEP 05: COUNT PRIORITY: If the user-provided "Fixed Architectural Features" or "Extra Details" mentions a specific count (e.g., "2 windows"), you MUST use that number even if you think you see more.
         - STEP 06: DO NOT COUNT RADIATORS AS WINDOWS. Radiators are the 1m units placed UNDER the windows.
         - WARNING: Most floor plans have blue dimension lines. They look like windows to untrained eyes. YOU MUST BE TRAINED: Numbers = Dimensions = NOT windows.
      3. WINDOWS & RADIATORS: Windows are NOT full-length.
      4. FORBIDDEN: Do not invent architecture. If a wall is solid in the plan, it is solid in the render.
      5. SPATIAL FLOW: Furniture MUST be placed relative to ACTUAL wall openings. 

      SCENE CONSISTENCY (TOTAL INVARIANT):
      You MUST generate a 'visualIdentity' which acts as a "Fixed Stage Manifest".
      - It MUST explicitly state: "ARCHITECTURAL TRUTH: [X] Windows, [Y] Doors".
      - It must list every item: (e.g. "Item A: 3-seater sofa in Navy Mohair").
      - Both 'renderPrompt' and 'secondaryRenderPrompt' MUST start with: "Architectural interior of a room with exactly [X] windows and [Y] doors...".
      - Consistency Invariant: Both prompts MUST describe identical window/door placement.

      Task:
      1. Structural & Scale Analysis: Identify DOORS, WINDOWS, and FIXED FEATURES. Ignore dimension lines.
      2. Propose a precise furniture layout that fits within these bounds.
      3. Define the 'visualIdentity'.
      4. Generate TWO Photorealistic Rendering Prompts:
         - Both prompts MUST start with: "Hyper-realistic architectural view of a room with [X] windows and [Y] doors...".
         - Both prompts MUST use the exact same 'visualIdentity'.
      
      Ensure both prompts describe the camera position relative to the provided floor plan (e.g., "View from North corner looking towards the South fireplace").

      Focus on period-accurate details (e.g., if French Chateau, suggest Versailles parquet, boiserie, or specific era-appropriate moldings).
    `;

    const parts: any[] = [];
    
    if (project.floorPlanImage) {
      parts.push({
        inlineData: {
          data: project.floorPlanImage.split(',')[1],
          mimeType: "image/png"
        }
      });
      parts.push({ text: "[IDENTIFIER: Floor Plan] - CRITICAL: Analyze this image for all doors, windows, and structural boundaries. This is the only source for room shape." });
    }

    // Add Reference Images if available
    if (room.referenceImages && room.referenceImages.length > 0) {
      room.referenceImages.forEach((img, idx) => {
        const partsArr = img.split(",");
        if (partsArr.length > 1) {
          parts.push({
            inlineData: {
              data: partsArr[1],
              mimeType: "image/png",
            }
          });
          parts.push({ text: `[IDENTIFIER: Reference Image ${idx + 1}] - Visual cue for style/furniture.` });
        }
      });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            layoutDescription: { 
              type: Type.STRING,
              description: "A detailed structural and spatial analysis followed by the layout proposal."
            },
            structuralAudit: {
              type: Type.OBJECT,
              properties: {
                doors: { type: Type.NUMBER },
                windows: { type: Type.NUMBER },
                radiators: { type: Type.NUMBER },
                other: { type: Type.STRING }
              },
              required: ["doors", "windows", "radiators", "other"]
            },
            materialList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.STRING },
                  dimensions: { type: Type.STRING }
                },
                required: ["name", "quantity", "dimensions"]
              }
            },
            wallColors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  hex: { type: Type.STRING },
                  brand: { type: Type.STRING }
                },
                required: ["name", "hex", "brand"]
              }
            },
            visualIdentity: { 
              type: Type.STRING,
              description: "The shared DNA for all renders: specific furniture items, materials, and lighting."
            },
            renderPrompt: { type: Type.STRING },
            secondaryRenderPrompt: { type: Type.STRING }
          },
          required: ["layoutDescription", "structuralAudit", "materialList", "wallColors", "visualIdentity", "renderPrompt", "secondaryRenderPrompt"]
        }
      }
    });

    let text = response.text || "{}";
    // Clean up potential markdown wrapper
    if (text.includes("```")) {
      text = text.replace(/```[a-z]*\n?/g, "").replace(/\n?```/g, "");
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Detailed architectural analysis could not be parsed. Please try again.");
    }
  });
}

export async function generateRoomRender(prompt: string, floorPlanImage?: string): Promise<string> {
  return withRetry(async () => {
    const parts: any[] = [];
    
    if (floorPlanImage) {
      const base64Data = floorPlanImage.includes(',') ? floorPlanImage.split(',')[1] : floorPlanImage;
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/png"
        }
      });
      parts.push({ text: "GROUND TRUTH FLOOR PLAN: Use this image as the absolute architectural map. Respect the window and door counts exactly. If the plan shows 2 windows, the render MUST show 2 windows. Dimension lines (thin lines with numbers) are NOT windows." });
    }

    parts.push({ 
      text: `A world-class, photorealistic 8K architectural interior photograph. 
      SCENE: ${prompt}. 
      STYLE: Ultra-high-end, cinematic lighting, sharp textures. 
      ARCHITECTURE GROUND TRUTH: You MUST strictly match the window and door counts from the scene description. If it says "2 windows", you show 2 windows. Do not add generic windows to solid walls. The placement must match the floor plan layout.` 
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("Unable to create visual render at this time.");
  });
}
