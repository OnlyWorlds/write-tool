import type { Element } from '../types/world';

// Maps field names to friendly labels
const FIELD_LABELS: Record<string, string> = {
  location: 'Located in',
  locationId: 'Located in',
  birthplace: 'Born in',
  birthplaceId: 'Born in',
  members: 'Member of',
  memberIds: 'Member of',
  inhabitants: 'Inhabits',
  inhabitantIds: 'Inhabits',
  species: 'Species of',
  speciesId: 'Species of',
  speciesIds: 'Species of',
  parent: 'Parent of',
  parentId: 'Parent of',
  children: 'Child of',
  childIds: 'Child of',
  creator: 'Created by',
  creatorId: 'Created by',
  owner: 'Owned by',
  ownerId: 'Owned by',
  items: 'Contains',
  itemIds: 'Contains',
  participants: 'Participates in',
  participantIds: 'Participates in',
  allies: 'Allied with',
  allyIds: 'Allied with',
  enemies: 'Enemy of',
  enemyIds: 'Enemy of',
  religion: 'Worshipped by',
  religionId: 'Worshipped by',
  faction: 'Member of faction',
  factionId: 'Member of faction',
  homeworld: 'Homeworld of',
  homeworldId: 'Homeworld of',
  ruler: 'Rules over',
  rulerId: 'Rules over',
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