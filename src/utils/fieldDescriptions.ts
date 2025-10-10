// Field descriptions from OnlyWorlds specification
// Source: https://onlyworlds.github.io/docs/specification/

export interface FieldDescription {
  name: string;
  description: string;
  category?: string; // If specific to a category
}

// Base fields common to all elements
const baseFieldDescriptions: Record<string, string> = {
  id: "Unique identifier (UUIDv7 format)",
  name: "Display name",
  world: "World this element belongs to",
  description: "Text description",
  supertype: "Primary classification",
  subtype: "Secondary classification within supertype",
  image_url: "Link to representative image",
  created_at: "Timestamp when element was created",
  updated_at: "Timestamp of last modification",
};

// Character-specific fields
const characterFieldDescriptions: Record<string, string> = {
  physicality: "Character's visible physical features and body attributes",
  height: "Approximate or exact height using world LENGTH units",
  weight: "Approximate or exact weight using world MASS units",
  species: "Species the character might belong to",
  traits: "Traits for notable behavioral, physical, or systemic characteristics",
  abilities: "Abilities the character might perform, control, or invoke",
  background: "History, upbringing, or formative experiences of the character",
  motivations: "Core desires, goals, or values that drive the character's choices",
  birth_date: "Moment of birth in world's TIME units",
  birthplace: "Location where the character was born",
  languages: "Languages the character can communicate in",
  reputation: "Summary of character's current condition or role",
  location: "Character's present physical location",
  objects: "Key objects owned by or linked to the character",
  institutions: "Institutions the character is affiliated with",
  charisma: "Ability to attract, inspire, and influence others",
  coercion: "Capacity to dominate or intimidate",
  competence: "Skill in planning and managing complex situations",
  compassion: "Willingness to empathize with others",
  creativity: "Ability to generate novel ideas",
  courage: "Readiness to face danger or adversity",
  family: "Families the character belongs to",
  friends: "Characters considered close allies",
  rivals: "Characters in active opposition",
  level: "Progression rank in a game system",
  hit_points: "Total character health",
  str: "Physical force and carrying capacity",
  dex: "Agility, coordination, and reflexes",
  con: "Endurance and strain resistance",
  int: "Reasoning, memory, and learning",
  wis: "Intuition, awareness, and judgment",
  cha: "Persuasiveness and personal magnetism",
};

// Location-specific fields
const locationFieldDescriptions: Record<string, string> = {
  climate: "Weather patterns and environmental conditions",
  terrain: "Physical geography and landscape features",
  population: "Number or description of inhabitants",
  government: "Political system or ruling authority",
  economy: "Primary economic activities and resources",
  culture: "Customs, traditions, and social practices",
  parent_location: "Larger location this place is within",
  sub_locations: "Smaller locations contained within",
  residents: "Characters who live here",
  founders: "Characters who established this location",
  buildings: "Structures or landmarks within",
  events: "Historical events that occurred here",
};

// Object-specific fields
const objectFieldDescriptions: Record<string, string> = {
  material: "Physical substance the object is made from",
  rarity: "How common or rare the object is",
  value: "Monetary or cultural worth",
  weight_obj: "Physical mass of the object",
  creator: "Who made or crafted this object",
  owner: "Current possessor of the object",
  powers: "Special abilities or properties",
  history: "Notable past events involving this object",
};

// Event-specific fields
const eventFieldDescriptions: Record<string, string> = {
  date: "When the event occurred",
  duration: "How long the event lasted",
  participants: "Characters involved in the event",
  location_event: "Where the event took place",
  causes: "What led to this event",
  consequences: "Results or aftermath of the event",
  type_event: "Category or nature of the event",
};

// Institution-specific fields
const institutionFieldDescriptions: Record<string, string> = {
  leader: "Head or governing authority",
  members: "Characters affiliated with the institution",
  headquarters: "Primary location of operations",
  founded: "When the institution was established",
  purpose: "Goals or mission of the institution",
  resources: "Assets and capabilities",
  influence: "Political or social power",
};

// Ability-specific fields
const abilityFieldDescriptions: Record<string, string> = {
  power_level: "Relative strength or potency",
  cost: "Resources or requirements to use",
  effect: "What the ability does",
  range: "Distance or area of effect",
  duration_ability: "How long the ability lasts",
  prerequisites: "Requirements to learn or use",
};

// Narrative-specific fields
const narrativeFieldDescriptions: Record<string, string> = {
  body: "Main story content",
  summary: "Brief overview of the narrative",
  pov_character: "Character from whose perspective the story is told",
  timeline_events: "Sequence of events in the narrative",
  themes: "Central ideas or messages",
};

// Combine all field descriptions by category
const categoryFieldDescriptions: Record<string, Record<string, string>> = {
  character: characterFieldDescriptions,
  location: locationFieldDescriptions,
  object: objectFieldDescriptions,
  event: eventFieldDescriptions,
  institution: institutionFieldDescriptions,
  ability: abilityFieldDescriptions,
  narrative: narrativeFieldDescriptions,
};

/**
 * Get the description for a specific field
 * @param fieldName The name of the field (e.g., "birthplace", "location")
 * @param category Optional element category for category-specific descriptions
 * @returns The field description or null if not found
 */
export function getFieldDescription(fieldName: string, category?: string): string | null {
  // Normalize field name (remove _id suffix if present, lowercase)
  const normalizedFieldName = fieldName
    .replace(/_ids?$/, '')
    .toLowerCase();

  // Check base fields first
  if (baseFieldDescriptions[normalizedFieldName]) {
    return baseFieldDescriptions[normalizedFieldName];
  }

  // Check category-specific fields if category provided
  if (category) {
    const categoryFields = categoryFieldDescriptions[category.toLowerCase()];
    if (categoryFields && categoryFields[normalizedFieldName]) {
      return categoryFields[normalizedFieldName];
    }
  }

  // Search all category fields as fallback
  for (const categoryFields of Object.values(categoryFieldDescriptions)) {
    if (categoryFields[normalizedFieldName]) {
      return categoryFields[normalizedFieldName];
    }
  }

  return null;
}

/**
 * Get all field descriptions for a specific category
 * @param category The element category
 * @returns Object with field names as keys and descriptions as values
 */
export function getCategoryFieldDescriptions(category: string): Record<string, string> {
  const categoryLower = category.toLowerCase();
  return {
    ...baseFieldDescriptions,
    ...(categoryFieldDescriptions[categoryLower] || {}),
  };
}
