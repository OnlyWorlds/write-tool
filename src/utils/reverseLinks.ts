import type { Element } from '../types/world';

// Maps field names to friendly labels with enhanced context
const FIELD_LABELS: Record<string, string> = {
  // Location references
  location: 'Currently at',
  locationId: 'Currently at',
  birthplace: 'Birthplace of',
  birthplaceId: 'Birthplace of',
  parentLocation: 'Contains location',
  parent_location: 'Contains location',
  parentLocationId: 'Contains location',
  parent_location_id: 'Contains location',
  zone: 'Zone contains',
  zoneId: 'Zone contains',
  zones: 'Has zones',
  zoneIds: 'Has zones',
  
  // Character relationships
  members: 'Has member',
  memberIds: 'Has member',
  inhabitants: 'Home to',
  inhabitantIds: 'Home to',
  populations: 'Populated by',
  populationIds: 'Populated by',
  species: 'Species of',
  speciesId: 'Species of',
  speciesIds: 'Species of',
  parent: 'Parent of',
  parentId: 'Parent of',
  children: 'Child of',
  childIds: 'Child of',
  family: 'Family member',
  familyIds: 'Family member',
  friends: 'Friend of',
  friendsIds: 'Friend of',
  rivals: 'Rival of',
  rivalsIds: 'Rival of',
  
  // Ownership and creation
  creator: 'Created',
  creatorId: 'Created',
  owner: 'Owns',
  ownerId: 'Owns',
  leader: 'Leads',
  leaderId: 'Leads',
  ruler: 'Rules',
  rulerId: 'Rules',
  
  // Objects and items
  items: 'Contains item',
  itemIds: 'Contains item',
  objects: 'Has object',
  objectsIds: 'Has object',
  materials: 'Uses material',
  materialIds: 'Uses material',
  technology: 'Uses technology',
  technologyIds: 'Uses technology',
  
  // Groups and institutions
  institutions: 'Has institution',
  institutionIds: 'Has institution',
  institutionsIds: 'Has institution',
  faction: 'Faction member',
  factionId: 'Faction member',
  cults: 'Has cult',
  cultIds: 'Has cult',
  
  // Events and activities
  participants: 'Participant in',
  participantIds: 'Participant in',
  events: 'Related event',
  eventIds: 'Related event',
  
  // Combat and conflict
  allies: 'Allied with',
  allyIds: 'Allied with',
  enemies: 'Enemy of',
  enemyIds: 'Enemy of',
  fighters: 'Fighter in',
  fighterIds: 'Fighter in',
  
  // Abilities and traits
  abilities: 'Has ability',
  abilitiesIds: 'Has ability',
  traits: 'Has trait',
  traitsIds: 'Has trait',
  languages: 'Speaks language',
  languagesIds: 'Speaks language',
  
  // Titles and power
  primaryPower: 'Primary power',
  primary_power: 'Primary power',
  primaryPowerId: 'Primary power',
  primary_power_id: 'Primary power',
  secondaryPowers: 'Secondary power',
  secondary_powers: 'Secondary power',
  secondaryPowerIds: 'Secondary power',
  secondary_power_ids: 'Secondary power',
  governingTitle: 'Governing title',
  governing_title: 'Governing title',
  governingTitleId: 'Governing title',
  governing_title_id: 'Governing title',
  
  // Other relationships
  religion: 'Worshipped by',
  religionId: 'Worshipped by',
  homeworld: 'Homeworld of',
  homeworldId: 'Homeworld of',
  actor: 'Actor in',
  actorId: 'Actor in',
  partner: 'Partner of',
  partnerId: 'Partner of',
  rival: 'Rival to',
  rivalId: 'Rival to',
};

// Get a friendly label for a field name
export function getFieldLabel(fieldName: string): string {
  return FIELD_LABELS[fieldName] || fieldName.replace(/_/g, ' ').replace(/Id$/, '');
}

// Calculate which elements reference the given element
export function calculateReverseLinks(
  elementId: string, 
  elements: Map<string, Element>
): Map<string, Element[]> {
  const reverseLinks = new Map<string, Element[]>();
  
  // Scan all elements for references to current element
  elements.forEach(element => {
    // Skip self-references
    if (element.id === elementId) return;
    
    // Skip pins and markers
    if (element.category === 'pin' || element.category === 'marker') return;
    
    // Check each field that could be a link or array of links
    Object.entries(element).forEach(([fieldName, value]) => {
      // Skip system fields
      if (['id', 'created_at', 'updated_at', 'name', 'description', 'image_url', 'tags', 'category', 'type', 'subtype', 'is_public'].includes(fieldName)) {
        return;
      }
      
      // Check if single link reference
      if (typeof value === 'string' && value === elementId) {
        if (!reverseLinks.has(fieldName)) {
          reverseLinks.set(fieldName, []);
        }
        reverseLinks.get(fieldName)!.push(element);
      }
      
      // Check if array of links
      if (Array.isArray(value) && value.includes(elementId)) {
        if (!reverseLinks.has(fieldName)) {
          reverseLinks.set(fieldName, []);
        }
        reverseLinks.get(fieldName)!.push(element);
      }
    });
  });
  
  // Sort elements within each group by name
  reverseLinks.forEach((elements, fieldName) => {
    reverseLinks.set(fieldName, elements.sort((a, b) => a.name.localeCompare(b.name)));
  });
  
  return reverseLinks;
}

// Group reverse links by friendly labels (merge similar relationships)
export function groupReverseLinks(reverseLinks: Map<string, Element[]>): Map<string, { elements: Element[], fields: string[] }> {
  const grouped = new Map<string, { elements: Element[], fields: string[] }>();
  
  reverseLinks.forEach((elements, fieldName) => {
    const label = getFieldLabel(fieldName);
    
    if (!grouped.has(label)) {
      grouped.set(label, { elements: [], fields: [] });
    }
    
    const group = grouped.get(label)!;
    group.fields.push(fieldName);
    
    // Add elements that aren't already in the group
    elements.forEach(element => {
      if (!group.elements.find(el => el.id === element.id)) {
        group.elements.push(element);
      }
    });
  });
  
  // Sort elements within each group
  grouped.forEach((group, label) => {
    group.elements.sort((a, b) => a.name.localeCompare(b.name));
  });
  
  return grouped;
}