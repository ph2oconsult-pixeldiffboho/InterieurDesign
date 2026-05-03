import { GoogleGenAI, Type } from "@google/genai";
import { ProjectData, RoomDesignData, DesignReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeRoomLayout(
  project: ProjectData,
  room: RoomDesignData
): Promise<DesignReport> {
  const prompt = `
    You are an elite Interior Architect and Historical Preservation Consultant. 
    Property Identity: ${project.projectName}
    Architectural Heritage/Age: ${project.propertyAge}
    
    Room Specification: ${room.type}
    Design Aesthetic: ${room.style} (Ensure the logic strictly follows this architectural style)
    Existing Furnishings to Incorporate: ${room.existingFurniture}
    User Preferences & Functional requirements: ${JSON.stringify(room.specificAnswers)}
    ${room.technicalBrief ? `Additional Technical Brief: ${room.technicalBrief}` : ''}

    Task:
    1. Assess the room layout. If a floor plan is provided, analyze spatial flow, door placements, and light sources.
    2. Analyze any provided reference images for specific furniture pieces, textures, or style cues.
    3. Propose a "World Class" layout optimized for the chosen ${room.style} style.
    4. Generate a Bill of Materials (BOM) including furniture, core materials (flooring, moldings, paneling), and lighting.
    5. Propose a color palette that respects the property age and style.
    6. Generate a Photorealistic Rendering Prompt for a high-end 3D visualization.

    Focus on period-accurate details (e.g., if French Chateau, suggest Versailles parquet, boiserie, or specific era-appropriate moldings).
  `;

  const parts: any[] = [{ text: prompt }];
  if (project.floorPlanImage) {
    parts.push({
      inlineData: {
        data: project.floorPlanImage.split(',')[1],
        mimeType: "image/png"
      }
    });
  }

  // Add Reference Images if available
  if (room.referenceImages && room.referenceImages.length > 0) {
    room.referenceImages.forEach((img) => {
      const partsArr = img.split(",");
      if (partsArr.length > 1) {
        parts.push({
          inlineData: {
            data: partsArr[1],
            mimeType: "image/png",
          },
        });
      }
    });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          layoutDescription: { type: Type.STRING },
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
          renderPrompt: { type: Type.STRING }
        },
        required: ["layoutDescription", "materialList", "wallColors", "renderPrompt"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateRoomRender(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: { 
      parts: [{ 
        text: `A world-class, 4K professional architectural interior photography of a ${prompt}. Style is ultra-high-end, realistic daylighting, cinematic depth, 8k resolution, trending on Architectural Digest.` 
      }] 
    },
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
}
