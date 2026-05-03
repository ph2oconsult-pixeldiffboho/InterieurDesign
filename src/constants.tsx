import React from 'react';
import { RoomType, StyleType } from './types';

export const APP_VERSION = '1.2.0';

export const ROOM_TYPES: RoomType[] = [
  'Kitchen', 'Dining Room', 'Lounge Room', 'Pantry', 'Butler\'s Pantry', 
  'Laundry Room', 'Boot Room', 'Bedroom', 'Bathroom', 'En-suite'
];

export const STYLES: { id: StyleType; name: string; description: string }[] = [
  { id: 'modern', name: 'Modern', description: 'Clean lines, minimalism, and functional elegance.' },
  { id: 'classic_european', name: 'Classic European', description: 'Timeless sophistication with ornate details and rich textures.' },
  { id: 'hamptons', name: 'Hamptons', description: 'Breezy, coastal luxury with white-washed tones and natural light.' },
  { id: 'french_country', name: 'French Country', description: 'Rustic charm combined with elegant, weathered finishes.' },
  { id: 'french_chateau', name: 'French Chateau', description: 'Opulent, grand, and historically inspired luxury.' },
  { id: 'english_townhouse', name: 'English Townhouse', description: 'Stately, structured, and sophisticated urban heritage.' }
];

export const PROPERTY_PERIODS = [
  { id: '18th_century', name: '18th Century / Georgian', description: 'Symmetry, classic proportions, and grand ceiling heights.' },
  { id: 'regency', name: 'Regency', description: 'Elegant, light-filled spaces with neoclassical influence.' },
  { id: 'victorian', name: 'Victorian', description: 'Ornate moldings, rich textures, and dramatic focal points.' },
  { id: 'edwardian', name: 'Edwardian / Arts & Crafts', description: 'Wider halls, garden connections, and handcrafted details.' },
  { id: 'pre_war', name: 'Pre-War (1910-1940)', description: 'Solid construction, refined masonry, and traditional layouts.' },
  { id: 'post_war', name: 'Post-War (1945-1970)', description: 'Expanding footprints, utilitarian flow, and mid-century modernism.' },
  { id: 'contemporary', name: '21st Century Contemporary', description: 'Open-plan living, sustainable materials, and smart integration.' }
];

export const ROOM_SPECIFIC_QUESTIONS: Record<RoomType, { id: string; label: string; type: 'text' | 'select' | 'multiselect'; options?: string[] }[]> = {
  'Kitchen': [
    { id: 'cooking_style', label: 'Primary Culinary Function', type: 'select', options: ['Gourmet / Professional', 'Family Social Hub', 'Quick Prep / High Utility', 'Showpiece / Minimal Use'] },
    { id: 'cabinetry_finish', label: 'Cabinetry Heritage', type: 'select', options: ['Hand-painted Shaker', 'Classic In-set frame', 'Minimalist handle-less', 'Period-accurate raised panel'] },
    { id: 'island_preference', label: 'Island Logic', type: 'select', options: ['Grand Chef\'s Table', 'Practical Prep Station', 'Traditional Butcher Block', 'No Island / Traditional Kitchen Table'] }
  ],
  'Dining Room': [
    { id: 'lighting_vibe', label: 'Illumination Logic', type: 'select', options: ['Grand Period Chandelier', 'Minimalist Linear Pendant', 'Wall Sconces Only', 'Atmospheric Candelabra focus'] },
    { id: 'hosting', label: 'Atmosphere', type: 'select', options: ['Formal State Dinner', 'Sunday Roasts / Family', 'Intimate Bistro', 'Library/Dining Combo'] }
  ],
  'Lounge Room': [
    { id: 'focal_point', label: 'Visual Anchor', type: 'select', options: ['Heritage Marble Fireplace', 'Large Scale Period Windows', 'Media/Cinema Wall', 'Art Gallery focus'] },
    { id: 'seating_logic', label: 'Conversation Layout', type: 'select', options: ['Symmetrical / Formal', 'Conversational L-shape', 'Clustered intimate items', 'Minimalist linear'] }
  ],
  'Bedroom': [
    { id: 'serenity_level', label: 'Mood Direction', type: 'select', options: ['Hotel Suite Luxury', 'Heritage Sanctuary', 'Dark & Moody / Library', 'Bright & Ethereal'] },
    { id: 'wardrobe', label: 'Storage Philosophy', type: 'select', options: ['Built-in architectural seamless', 'Freestanding Antique Wardrobes', 'Concealed Walk-in', 'Open Boutique Display'] }
  ],
  'Bathroom': [
    { id: 'spa_focus', label: 'Wellbeing Element', type: 'select', options: ['Clawfoot Statement Tub', 'Double Heritage Rain-shower', 'Hammam/Steam Room', 'Console Sinks'] },
    { id: 'tiling', label: 'Surfacing Heritage', type: 'select', options: ['Subway Classic', 'Checkered Marble', 'Zellige Hand-cut', 'Full Slab Stone'] }
  ],
  'Laundry Room': [{ id: 'efficiency', label: 'Secondary Function', type: 'select', options: ['Pet Wash station', 'Mudroom integration', 'Drying room focus', 'Compact concealed'] }],
  'Boot Room': [{ id: 'seating', label: 'Seating & Bench', type: 'select', options: ['Built-in Oak Bench', 'Heritage Settle', 'Boot Rack only', 'Heated floors'] }],
  'Pantry': [{ id: 'display', label: 'Showcase or Secret?', type: 'select', options: ['Glass display cabinetry', 'Hidden behind panels', 'Open shelving', 'Walk-in cellar style'] }],
  'Butler\'s Pantry': [{ id: 'appliances', label: 'Secondary Gear', type: 'text' }],
  'En-suite': [{ id: 'double_vanity', label: 'Space Requirement', type: 'select', options: ['His & Hers Double', 'Single Large Luxe', 'Period Pedestal Sinks'] }]
};
