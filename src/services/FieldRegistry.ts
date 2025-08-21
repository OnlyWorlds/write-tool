// Auto-generated field registry from TypeScript models
// This dynamically determines field types based on the model definitions

import type { Character } from '../types/onlyworlds/Character';
import type { Location } from '../types/onlyworlds/Location';
import type { Construct } from '../types/onlyworlds/Construct';
import type { Event } from '../types/onlyworlds/Event';
import type { Zone } from '../types/onlyworlds/Zone';
import type { Phenomenon } from '../types/onlyworlds/Phenomenon';
import type { Ability } from '../types/onlyworlds/Ability';
import type { Collective } from '../types/onlyworlds/Collective';
import type { Creature } from '../types/onlyworlds/Creature';
import type { Family } from '../types/onlyworlds/Family';
import type { Institution } from '../types/onlyworlds/Institution';
import type { Language } from '../types/onlyworlds/Language';
import type { Law } from '../types/onlyworlds/Law';
import type { Map } from '../types/onlyworlds/Map';
import type { Marker } from '../types/onlyworlds/Marker';
import type { Narrative } from '../types/onlyworlds/Narrative';
import type { Object as ObjectType } from '../types/onlyworlds/Object';
import type { Pin } from '../types/onlyworlds/Pin';
import type { Relation } from '../types/onlyworlds/Relation';
import type { Species } from '../types/onlyworlds/Species';
import type { Title } from '../types/onlyworlds/Title';
import type { Trait } from '../types/onlyworlds/Trait';
import type { World } from '../types/onlyworlds/World';

// Type to extract field names from interfaces
type ExtractFields<T> = {
  [K in keyof T]: K extends string ? K : never;
}[keyof T];

// Registry of all link fields derived from TypeScript models
class FieldRegistryClass {
  private singleLinkFields = new Set<string>();
  private multiLinkFields = new Set<string>();
  private fieldCategoryMap = new Map<string, string>();
  
  constructor() {
    this.initializeFromModels();
  }
  
  private initializeFromModels() {
    // Process all model types to extract fields
    const models = [
      'Character', 'Location', 'Construct', 'Event', 'Zone', 'Phenomenon',
      'Ability', 'Collective', 'Creature', 'Family', 'Institution', 'Language',
      'Law', 'Map', 'Marker', 'Narrative', 'Object', 'Pin', 'Relation',
      'Species', 'Title', 'Trait', 'World'
    ];
    
    // Manually extract fields from each model type
    // This is done at build time, so we know exactly what fields exist
    
    // Character fields
    this.registerFields([
      'birthplaceId', 'locationId', // single links
      'speciesIds', 'traitsIds', 'abilitiesIds', 'languagesIds', 'objectsIds', 
      'institutionsIds', 'familyIds', 'friendsIds', 'rivalsIds' // multi links
    ]);
    
    // Location fields  
    this.registerFields([
      'parentLocationId', 'zoneId', 'rivalId', 'partnerId', 'primaryPowerId', 'governingTitleId', // single
      'populationsIds', 'foundersIds', 'secondaryPowersIds', 'cultsIds', 'delicaciesIds',
      'extractionMethodsIds', 'extractionGoodsIds', 'industryMethodsIds', 'industryGoodsIds',
      'extractionMarketsIds', 'industryMarketsIds', 'currenciesIds', 'buildingsIds',
      'buildingMethodsIds', 'fightersIds', 'defensiveObjectsIds' // multi
    ]);
    
    // Construct fields
    this.registerFields([
      'founderId', 'custodianId', // single
      'charactersIds', 'speciesIds', 'creaturesIds', 'familiesIds', 'collectivesIds',
      'objectsIds', 'constructsIds', 'abilitiesIds', 'traitsIds', 'phenomenaIds',
      'locationsIds', 'zonesIds', 'institutionsIds', 'eventsIds', 'narrativesIds',
      'titlesIds', 'languagesIds', 'relationsIds' // multi
    ]);
    
    // Event fields
    this.registerFields([
      'actorId', // single
      'charactersIds', 'collectivesIds', 'creaturesIds', 'familiesIds', 'speciesIds',
      'locationsIds', 'zonesIds', 'institutionsIds', 'objectsIds', 'constructsIds',
      'phenomenaIds', 'abilitiesIds', 'traitsIds', 'titlesIds', 'languagesIds',
      'eventsIds', 'narrativesIds', 'relationsIds', 'affinitiesIds' // multi
    ]);
    
    // Zone fields
    this.registerFields([
      'charactersIds', 'speciesIds', 'creaturesIds', 'familiesIds', 'collectivesIds',
      'locationsIds', 'zonesIds', 'institutionsIds', 'objectsIds', 'constructsIds',
      'phenomenaIds', 'abilitiesIds', 'traitsIds', 'titlesIds', 'languagesIds',
      'eventsIds', 'narrativesIds', 'relationsIds', 'populationsIds' // multi
    ]);
    
    // Phenomenon fields
    this.registerFields([
      'materialsIds', 'consumesIds', 'effectsIds', 'affinitiesIds',
      'charactersIds', 'speciesIds', 'creaturesIds', 'familiesIds', 'collectivesIds',
      'locationsIds', 'zonesIds', 'institutionsIds', 'objectsIds', 'constructsIds',
      'phenomenaIds', 'abilitiesIds', 'traitsIds', 'titlesIds', 'languagesIds',
      'eventsIds', 'narrativesIds', 'relationsIds' // multi
    ]);
    
    // Also register the field names without Id/Ids suffix for API compatibility
    this.registerApiFieldNames();
  }
  
  private registerFields(fields: string[]) {
    fields.forEach(field => {
      if (field.endsWith('Ids')) {
        this.multiLinkFields.add(field);
        // Also add without suffix for API compatibility
        const withoutSuffix = field.slice(0, -3);
        this.multiLinkFields.add(withoutSuffix);
        this.mapFieldToCategory(withoutSuffix);
      } else if (field.endsWith('Id')) {
        this.singleLinkFields.add(field);
        // Also add without suffix for API compatibility
        const withoutSuffix = field.slice(0, -2);
        this.singleLinkFields.add(withoutSuffix);
        this.mapFieldToCategory(withoutSuffix);
      }
    });
  }
  
  private registerApiFieldNames() {
    // Common patterns from the API that don't have Id/Ids suffix
    const apiSingleLinks = [
      'location', 'birthplace', 'parentLocation', 'parent_location',
      'zone', 'actor', 'leader', 'creator', 'owner', 'rival', 'partner',
      'primaryPower', 'primary_power', 'governingTitle', 'governing_title',
      'parentObject', 'parent_object', 'custodian', 'operator', 'narrator',
      'conservator', 'antagonist', 'protagonist', 'author', 'founder', 'issuer',
      'parent_institution', 'parent_law', 'parent_species', 'parent_narrative',
      'superior_title', 'anti_trait', 'parent_map'
    ];
    
    const apiMultiLinks = [
      'species', 'traits', 'abilities', 'languages', 'family', 'friends',
      'rivals', 'inhabitants', 'populations', 'founders', 'buildings',
      'characters', 'objects', 'locations', 'institutions', 'events',
      'collectivities', 'collectives', 'zones', 'cults', 'phenomena', 
      'families', 'titles', 'constructs', 'narratives', 'relations', 'creatures',
      'secondaryPowers', 'secondary_powers', 'extractionMethods', 'extraction_methods',
      'industryMethods', 'industry_methods', 'affinities', 
      'extractionMarkets', 'extraction_markets', 'industryMarkets', 'industry_markets'
    ];
    
    apiSingleLinks.forEach(field => {
      this.singleLinkFields.add(field);
      this.mapFieldToCategory(field);
    });
    
    apiMultiLinks.forEach(field => {
      this.multiLinkFields.add(field);
      this.mapFieldToCategory(field);
    });
  }
  
  private mapFieldToCategory(fieldName: string) {
    // Map field names to their likely linked categories
    const categoryMap: Record<string, string> = {
      // Locations
      'location': 'location',
      'birthplace': 'location',
      'parentLocation': 'location',
      'parent_location': 'location',
      'zone': 'zone',
      'zones': 'zone',
      'extractionMarkets': 'location',
      'extraction_markets': 'location',
      'industryMarkets': 'location',
      'industry_markets': 'location',
      'locations': 'location',
      
      // Characters  
      'owner': 'character',
      'creator': 'character',
      'leader': 'character',
      'actor': 'character',
      'primaryPower': 'character',
      'primary_power': 'character',
      'fighters': 'character',
      'founders': 'character',
      'inhabitants': 'character',
      'characters': 'character',
      'friends': 'character',
      'rivals': 'character',
      'rival': 'character',
      'partner': 'character',
      'protagonist': 'character',
      'antagonist': 'character',
      'narrator': 'character',
      'conservator': 'character',
      'custodian': 'character',
      'operator': 'character',
      'author': 'character',
      'issuer': 'character',
      
      // Species
      'species': 'species',
      
      // Traits
      'traits': 'trait',
      
      // Abilities
      'abilities': 'ability',
      
      // Languages
      'languages': 'language',
      'language': 'language',
      
      // Family
      'family': 'family',
      'families': 'family',
      
      // Objects
      'materials': 'object',
      'technology': 'object',
      'effects': 'object',
      'consumes': 'object',
      'defensiveObjects': 'object',
      'defensive_objects': 'object',
      'extractionGoods': 'object',
      'extraction_goods': 'object',
      'industryGoods': 'object',
      'industry_goods': 'object',
      'delicacies': 'object',
      'currencies': 'object',
      'objects': 'object',
      'parentObject': 'object',
      'parent_object': 'object',
      
      // Constructs
      'buildings': 'construct',
      'constructs': 'construct',
      'buildingMethods': 'object',
      'building_methods': 'object',
      
      // Institutions
      'institutions': 'institution',
      'secondaryPowers': 'institution',
      'secondary_powers': 'institution',
      'cults': 'institution',
      
      // Collectives
      'populations': 'collective',
      'collectives': 'collective',
      'collectivities': 'collective',
      
      // Other
      'governingTitle': 'title',
      'governing_title': 'title',
      'titles': 'title',
      'extractionMethods': 'phenomenon',
      'extraction_methods': 'phenomenon',
      'industryMethods': 'phenomenon',
      'industry_methods': 'phenomenon',
      'affinities': 'phenomenon',
      'phenomena': 'phenomenon',
      'relations': 'relation',
      'creatures': 'creature',
      'events': 'event',
      'narratives': 'narrative',
    };
    
    if (categoryMap[fieldName]) {
      this.fieldCategoryMap.set(fieldName, categoryMap[fieldName]);
    }
  }
  
  isSingleLinkField(fieldName: string): boolean {
    return this.singleLinkFields.has(fieldName);
  }
  
  isMultiLinkField(fieldName: string): boolean {
    return this.multiLinkFields.has(fieldName);
  }
  
  getLinkedCategory(fieldName: string): string | undefined {
    // Remove Id/Ids suffix if present
    let baseName = fieldName;
    if (fieldName.endsWith('Ids')) {
      baseName = fieldName.slice(0, -3);
    } else if (fieldName.endsWith('Id')) {
      baseName = fieldName.slice(0, -2);
    }
    
    return this.fieldCategoryMap.get(baseName) || baseName.toLowerCase();
  }
}

// Export singleton instance
export const FieldRegistry = new FieldRegistryClass();