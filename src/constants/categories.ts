export const ONLYWORLDS_CATEGORIES = [
  'event',
  'character',
  'object',
  'location',
  'family',
  'creature',
  'institution',
  'trait',
  'species',
  'zone',
  'ability',
  'collective',
  'title',
  'language',
  'phenomenon',
  'law',
  'relation',
  'construct',
  'narrative',
  'map'
  // 'marker' removed - not needed in sidebar
  // 'pin' removed - not needed in this tool
  // 'world' removed - World is not an element type, it's a container
] as const;

export type OnlyWorldsCategory = typeof ONLYWORLDS_CATEGORIES[number];

export const CATEGORY_ICONS: Record<OnlyWorldsCategory, string> = {
  character: 'person_4',
  object: 'webhook',
  location: 'castle',
  family: 'supervisor_account',
  creature: 'bug_report',
  institution: 'business',
  trait: 'flaky',
  species: 'crib',
  zone: 'architecture',
  ability: 'auto_fix_normal',
  collective: 'groups_3',
  title: 'military_tech',
  language: 'edit_road',
  phenomenon: 'thunderstorm',
  law: 'gpp_bad',
  relation: 'link',
  event: 'saved_search',
  construct: 'api',
  narrative: 'menu_book',
  map: 'map'
};

export const CATEGORY_DISPLAY_NAMES: Record<OnlyWorldsCategory, string> = {
  character: 'Character',
  object: 'Object',
  location: 'Location',
  family: 'Family',
  creature: 'Creature',
  institution: 'Institution',
  trait: 'Trait',
  species: 'Species',
  zone: 'Zone',
  ability: 'Ability',
  collective: 'Collective',
  title: 'Title',
  language: 'Language',
  phenomenon: 'Phenomenon',
  law: 'Law',
  relation: 'Relation',
  event: 'Event',
  construct: 'Construct',
  narrative: 'Narrative',
  map: 'Map'
};