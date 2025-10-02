import type { Element } from '../types/world';

/**
 * Exports world data to OnlyWorlds JSON format
 * Format matches the standard OnlyWorlds import/export specification
 */

export interface WorldMetadata {
  api_key: string;
  name: string;
  description?: string;
  version?: string;
  image_url?: string;
  time_format_names?: string[];
  time_format_equivalents?: string[];
  time_basic_unit?: string;
  time_current?: string;
  time_range_min?: string;
  time_range_max?: string;
}

export interface OnlyWorldsExport {
  World: WorldMetadata;
  [category: string]: any; // Element type arrays
}

/**
 * Capitalizes the first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Export all world elements to OnlyWorlds JSON format
 */
export function exportWorldToJson(
  elements: Map<string, Element>,
  metadata: WorldMetadata | null,
  worldKey: string
): OnlyWorldsExport {
  // Build the World object
  const worldData: WorldMetadata = {
    api_key: worldKey,
    name: metadata?.name || 'Untitled World',
    description: metadata?.description || '',
    version: metadata?.version || '1.0.0',
    image_url: metadata?.image_url || 'default_image_url',
    time_format_names: metadata?.time_format_names || [
      'Eon', 'Era', 'Period', 'Epoch', 'Age', 'Year', 'Month', 'Day', 'Hour', 'Minute', 'Second'
    ],
    time_format_equivalents: metadata?.time_format_equivalents || [
      'Eon', 'Era', 'Period', 'Epoch', 'Age', 'Year', 'Month', 'Day', 'Hour', 'Minute', 'Second'
    ],
    time_basic_unit: metadata?.time_basic_unit || 'Year',
    time_current: metadata?.time_current || '0',
    time_range_min: metadata?.time_range_min || '0',
    time_range_max: metadata?.time_range_max || '1000',
  };

  // All OnlyWorlds element types (22 total)
  const elementTypes = [
    'character', 'object', 'location', 'family', 'creature', 'institution',
    'trait', 'species', 'zone', 'ability', 'collective', 'title',
    'language', 'phenomenon', 'law', 'relation', 'event', 'construct',
    'narrative', 'map', 'pin', 'marker'
  ];

  // Organize elements by category
  const exportData: OnlyWorldsExport = { World: worldData };

  elementTypes.forEach(type => {
    const capitalizedType = capitalize(type);
    const elementsOfType = Array.from(elements.values()).filter(
      el => el.category?.toLowerCase() === type.toLowerCase()
    );
    exportData[capitalizedType] = elementsOfType;
  });

  return exportData;
}

/**
 * Copy world data to clipboard as JSON
 */
export async function copyWorldToClipboard(
  elements: Map<string, Element>,
  metadata: WorldMetadata | null,
  worldKey: string
): Promise<void> {
  const exportData = exportWorldToJson(elements, metadata, worldKey);
  const jsonString = JSON.stringify(exportData, null, 2);
  await navigator.clipboard.writeText(jsonString);
}

/**
 * Download world data as JSON file
 */
export function downloadWorldJson(
  elements: Map<string, Element>,
  metadata: WorldMetadata | null,
  worldKey: string
): void {
  const exportData = exportWorldToJson(elements, metadata, worldKey);
  const jsonString = JSON.stringify(exportData, null, 2);

  // Create blob and download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const filename = `${metadata?.name || 'world'}_${new Date().toISOString().split('T')[0]}.json`;
  link.href = url;
  link.download = filename.replace(/\s+/g, '_'); // Replace spaces with underscores
  link.click();

  // Clean up
  URL.revokeObjectURL(url);
}
