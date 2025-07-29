import React from 'react';
import { CATEGORY_ICONS, OnlyWorldsCategory } from '../constants/categories';

// Material Icon component using Google Fonts
export const MaterialIcon = ({ 
  icon, 
  className = "text-base", 
  variant = "outlined" 
}: { 
  icon: string; 
  className?: string; 
  variant?: "filled" | "outlined" | "round";
}) => {
  const iconClass = variant === "filled" ? "material-icons" : 
                    variant === "round" ? "material-icons-round" : 
                    "material-icons-outlined";
  
  return (
    <span className={`${iconClass} ${className}`} style={{ fontSize: 'inherit' }}>
      {icon}
    </span>
  );
};

// Icon mapping for categories
const categoryIconMap: Record<string, string> = {
  // Main categories with correct Material Icons names
  character: 'person',
  characters: 'person',
  object: 'hub', // webhook icon
  objects: 'hub',
  location: 'castle',
  locations: 'castle',
  family: 'supervisor_account',
  families: 'supervisor_account',
  creature: 'bug_report',
  creatures: 'bug_report',
  institution: 'business',
  institutions: 'business',
  trait: 'ac_unit', // flaky/snowflake icon
  traits: 'ac_unit',
  species: 'child_care', // crib icon
  zone: 'architecture',
  zones: 'architecture',
  ability: 'auto_fix_high', // auto fix icon
  abilities: 'auto_fix_high',
  collective: 'groups',
  collectives: 'groups',
  title: 'military_tech',
  titles: 'military_tech',
  language: 'translate',
  languages: 'translate',
  phenomenon: 'thunderstorm',
  phenomena: 'thunderstorm',
  law: 'gavel', // law/gavel icon
  laws: 'gavel',
  relation: 'link',
  relations: 'link',
  event: 'event',
  events: 'event',
  construct: 'api',
  constructs: 'api',
  marker: 'place',
  markers: 'place',
  pin: 'push_pin',
  pins: 'push_pin',
  narrative: 'menu_book',
  narratives: 'menu_book',
  map: 'map',
  maps: 'map',
  world: 'public',
  worlds: 'public',
};

export const CategoryIcon = ({ 
  category, 
  className = "w-4 h-4" 
}: { 
  category: string; 
  className?: string;
}) => {
  const iconName = categoryIconMap[category.toLowerCase()] || 'category';
  
  return (
    <MaterialIcon 
      icon={iconName} 
      className={className} 
      variant="outlined"
    />
  );
};

// Export a function to get the icon name from the central constants
export const getCategoryIconName = (category: string): string => {
  return CATEGORY_ICONS[category as OnlyWorldsCategory] || 'star';
};