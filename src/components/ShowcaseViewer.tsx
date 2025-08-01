import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ApiService, type ShowcaseRetrieveResponse } from '../services/ApiService';
import { CategoryIcon } from '../utils/categoryIcons';
import { FieldRenderer } from './FieldRenderers';
import type { Element } from '../types/world';

interface ShowcaseViewerProps {
  showcaseId?: string;
}

export function ShowcaseViewer({ showcaseId }: ShowcaseViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showcase, setShowcase] = useState<ShowcaseRetrieveResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!showcaseId) {
      navigate('/');
      return;
    }

    loadShowcase();
  }, [showcaseId]);

  const loadShowcase = async () => {
    if (!showcaseId) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await ApiService.retrieveShowcase(showcaseId);
      if (data) {
        setShowcase(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load showcase';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-text-light mb-2">
            Loading showcase...
          </h2>
        </div>
      </div>
    );
  }

  if (error || !showcase) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-text-light mb-2">
            {error || 'Showcase not found'}
          </h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const element = showcase.element_data;
  const hiddenFields = new Set(showcase.showcase_config.hidden_fields || []);
  
  // Get all fields except system fields and name
  const fields = Object.entries(element).filter(([key]) => 
    !['id', 'created_at', 'updated_at', 'name'].includes(key)
  );
  
  // Base fields that get different styling
  const baseFields = ['description', 'supertype', 'subtype', 'image_url'];

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-white to-secondary rounded-lg shadow-lg border border-border">
        {/* Header */}
        <div className="relative border-b border-border bg-sidebar-dark shadow-md">
          <div className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <CategoryIcon 
                  category={element.category || ''} 
                  className="text-[48px] text-accent/80"
                />
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {element.name}
                  </h1>
                  <p className="text-sm text-gray-400 mt-1">
                    {element.category}
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-400">
                Published {new Date(showcase.metadata.published_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="px-6 pb-3">
            <div className="text-xs text-gray-500">
              From world: {showcase.metadata.world_name} • Views: {showcase.metadata.view_count}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="px-4 pb-6 pt-0 bg-white">
          {/* Base fields section */}
          <div className="pt-6 pb-4 border-b border-border/50">
            {fields.filter(([fieldName]) => baseFields.includes(fieldName)).map(([fieldName, value]) => {
              // Skip hidden or empty fields
              if (hiddenFields.has(fieldName) || !value || (Array.isArray(value) && value.length === 0)) {
                return null;
              }
              
              return (
                <div key={fieldName} className="mb-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex-1 py-3 px-4">
                    <div className="flex items-start">
                      <label className="block w-40 flex-shrink-0 text-base text-gray-700 font-medium">
                        {fieldName.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      <div className="flex-1 text-slate-800 font-medium">
                        <FieldRenderer
                          fieldName={fieldName}
                          value={value}
                          elementCategory={element.category}
                          mode="view"
                          className="text-base leading-relaxed"
                          linkedElements={showcase.linked_elements}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Other fields section */}
          <div className="pt-6 space-y-3">
            {fields.filter(([fieldName]) => !baseFields.includes(fieldName)).map(([fieldName, value]) => {
              // Skip hidden or empty fields
              if (hiddenFields.has(fieldName) || !value || (Array.isArray(value) && value.length === 0)) {
                return null;
              }
              
              return (
                <div key={fieldName} className="rounded-lg bg-gray-50 border border-gray-200">
                  <div className="flex-1 py-3 px-4">
                    <div className="flex items-start">
                      <label className="block w-40 flex-shrink-0 text-base text-gray-700 font-medium">
                        {fieldName.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      <div className="flex-1 text-slate-800 font-medium">
                        <FieldRenderer
                          fieldName={fieldName}
                          value={value}
                          elementCategory={element.category}
                          mode="view"
                          className="text-base leading-relaxed"
                          linkedElements={showcase.linked_elements}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}