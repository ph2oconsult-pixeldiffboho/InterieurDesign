import { GoogleGenAI, Type } from "@google/genai";
import { ProjectData, RoomDesignData, DesignReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  if (!dataUrl.startsWith('data:')) {
    return { mimeType: 'image/jpeg', data: dataUrl };
  }
  
  const parts = dataUrl.split(',');
  const prefix = parts[0];
  const data = parts.slice(1).join(',');
  
  const mimeTypeMatch = prefix.match(/^data:([^;]+)/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';
  
  return { mimeType, data };
}

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

      SHARED VISUAL IDENTITY:
      You MUST generate a 'visualIdentity' which acts as a "Mood & Material Manifest" shared by both renders.
      - It MUST list specific furniture items (e.g. "Item A: 3-seater sofa in Navy Mohair").
      - It MUST specify materials, finishes, lighting character, and palette.
      - It MAY note window/door counts as a soft target, but understand that the rendering model
        is NOT geometrically faithful — these renders are atmosphere studies, not blueprints.
      - Both 'renderPrompt' and 'secondaryRenderPrompt' MUST share the same materials, palette,
        and period detailing so the two images feel like the same room from different moods.

      Task:
      1. Structural & Scale Analysis (LITERAL): Identify DOORS, WINDOWS, RADIATORS, and FIXED FEATURES
         from the floor plan. This goes into 'structuralAudit' and IS the dimensional source of truth.
         Ignore dimension lines (thin lines with numbers parallel to walls). User-provided counts in
         "Fixed Architectural Features" override your inference.
      2. Propose a furniture layout that fits within these bounds. This goes into 'layoutDescription'.
      3. Define a 'visualIdentity' that captures mood, palette, materials, and period detailing.
      4. Generate TWO Rendering Prompts that emphasize ATMOSPHERE, MATERIAL, and PERIOD CHARACTER.
         The renders are mood studies; do not over-constrain them with geometry the image model
         cannot reliably honor. Describe two complementary moods of the same room (e.g., morning
         light vs. evening lamplight) sharing the same materials and palette.

      Focus on period-accurate details (Versailles parquet, boiserie, era-appropriate moldings, etc.).
    `;

    const parts: any[] = [];
    
    if (project.floorPlanImage) {
      const { mimeType, data } = parseDataUrl(project.floorPlanImage);
      parts.push({
        inlineData: {
          data,
          mimeType
        }
      });
      parts.push({ text: "[IDENTIFIER: Floor Plan] - CRITICAL: Analyze this image for all doors, windows, and structural boundaries. This is the only source for room shape. Estimate room dimensions and ceiling height based on architectural standards unless specified." });
    }

    // Add Reference Images if available
    if (room.referenceImages && room.referenceImages.length > 0) {
      room.referenceImages.forEach((img, idx) => {
        const { mimeType, data } = parseDataUrl(img);
        if (data) {
          parts.push({
            inlineData: {
              data,
              mimeType,
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
                other: { type: Type.STRING },
                dimensionsAndCeilingHeight: { type: Type.STRING, description: "Estimated room dimensions and ceiling height." },
                restrictions: { type: Type.STRING, description: "Key restrictions or constraints identified." }
              },
              required: ["doors", "windows", "radiators", "other", "dimensionsAndCeilingHeight", "restrictions"]
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
      const parsed = JSON.parse(text);
      if (!parsed.renderPrompt || !parsed.secondaryRenderPrompt) {
        throw new Error("Render prompts missing from analysis. Please try again.");
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Detailed architectural analysis could not be parsed. Please try again.");
    }
  });
}

export async function refineRoomLayout(
  project: ProjectData,
  room: RoomDesignData,
  previousReport: DesignReport,
  feedback: string
): Promise<DesignReport> {
  return withRetry(async () => {
    const prompt = `
      You are an elite Interior Architect and Historical Preservation Consultant. 
      You previously drafted a Design Report for this room. The client has provided feedback that requires adjusting the design and regenerating the mood studies.

      Property Identity: ${project.projectName}
      Architectural Heritage/Age: ${project.propertyAge}
      Room Specification: ${room.type}
      Design Aesthetic: ${room.style}
      
      CLIENT FEEDBACK:
      "${feedback}"
      
      PREVIOUS DESIGN REPORT (For Context):
      ${JSON.stringify({
        layoutDescription: previousReport.layoutDescription,
        materialList: previousReport.materialList,
        wallColors: previousReport.wallColors,
        visualIdentity: previousReport.visualIdentity
      }, null, 2)}

      Task:
      1. Review the CLIENT FEEDBACK and adjust the design accordingly. If they mention spatial issues (e.g., room is too narrow for cupboards on both walls), revise the layout. If they want a palette change, update the materials and wall colors.
      2. Provide a new 'layoutDescription' incorporating the feedback.
      3. Provide a new 'materialList' and new 'wallColors' if the feedback affects them. Otherwise, carry over the old ones or lightly adapt them.
      4. Define a refined 'visualIdentity' that captures the updated mood, palette, materials, and period detailing.
      5. Generate TWO new Rendering Prompts ('renderPrompt' and 'secondaryRenderPrompt') reflecting the new design. Ensure they emphasize ATMOSPHERE, MATERIAL, and PERIOD CHARACTER and align with the new 'visualIdentity'.

      Note: The structural audit (doors, windows, radiators, dimensions constraints) remains the same unless the user explicitly corrects a count. Maintain the 'structuralAudit' from the previous report, adapting only if the feedback dictates a re-interpretation of the space.
      Previous Structural Audit: ${JSON.stringify(previousReport.structuralAudit)}
    `;

    const parts: any[] = [];
    
    if (project.floorPlanImage) {
      const { mimeType, data } = parseDataUrl(project.floorPlanImage);
      parts.push({
        inlineData: {
          data,
          mimeType
        }
      });
      parts.push({ text: "[IDENTIFIER: Floor Plan] - Reference for structural boundaries." });
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
            layoutDescription: { type: Type.STRING },
            structuralAudit: {
              type: Type.OBJECT,
              properties: {
                doors: { type: Type.NUMBER },
                windows: { type: Type.NUMBER },
                radiators: { type: Type.NUMBER },
                other: { type: Type.STRING },
                dimensionsAndCeilingHeight: { type: Type.STRING },
                restrictions: { type: Type.STRING }
              },
              required: ["doors", "windows", "radiators", "other", "dimensionsAndCeilingHeight", "restrictions"]
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
            visualIdentity: { type: Type.STRING },
            renderPrompt: { type: Type.STRING },
            secondaryRenderPrompt: { type: Type.STRING }
          },
          required: ["layoutDescription", "structuralAudit", "materialList", "wallColors", "visualIdentity", "renderPrompt", "secondaryRenderPrompt"]
        }
      }
    });

    let text = response.text || "{}";
    if (text.includes("\`\`\`")) {
      text = text.replace(/\`\`\`[a-z]*\n?/g, "").replace(/\n?\`\`\`/g, "");
    }
    
    try {
      const parsed = JSON.parse(text);
      return parsed;
    } catch (e) {
      console.error("Failed to parse Gemini response:", text);
      throw new Error("Could not parse refined design. Please try again.");
    }
  });
}

export async function generateRoomRender(prompt: string, floorPlanImage?: string): Promise<string> {
  return withRetry(async () => {
    const parts: any[] = [];
    
    if (floorPlanImage) {
      const { mimeType, data } = parseDataUrl(floorPlanImage);
      parts.push({
        inlineData: {
          data,
          mimeType
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
    const responseParts = candidates?.[0]?.content?.parts;
    if (responseParts) {
      for (const part of responseParts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }

    throw new Error("Unable to create visual render at this time.");
  });
}
