import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ApiService, type ShowcaseRetrieveResponse } from '../services/ApiService';
import { CategoryIcon } from '../utils/categoryIcons';
import { FieldRenderer } from './FieldRenderers';
import type { Element } from '../types/world';
import { useThemeStore } from '../stores/uiStore';

interface ShowcaseViewerProps {
  showcaseId?: string;
}

export function ShowcaseViewer({ showcaseId }: ShowcaseViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showcase, setShowcase] = useState<ShowcaseRetrieveResponse | null>(null);
  const navigate = useNavigate();
  const { initializeTheme } = useThemeStore();

  // Initialize theme on mount (important for standalone showcase pages)
  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

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

  // Get all fields except system fields, name, and category
  const fields = Object.entries(element).filter(([key]) =>
    !['id', 'created_at', 'updated_at', 'name', 'category'].includes(key)
  );
  
  // Base fields that get different styling
  const baseFields = ['description', 'supertype', 'subtype', 'image_url'];

  const handleCopyJSON = async () => {
    try {
      const json = JSON.stringify(element, null, 2);
      await navigator.clipboard.writeText(json);
      toast.success('JSON copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy JSON');
    }
  };

  return (
    <div className="flex-1 p-6 max-w-4xl mx-auto bg-slate-900 min-h-screen">
      <div className="bg-slate-800 rounded-xl shadow-2xl border border-blue-500/30 overflow-hidden">
        {/* Header */}
        <div className="relative border-b border-blue-500/30 bg-slate-800/80 shadow-xl">
          <div className="p-8 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-400/30 shadow-lg">
                  <CategoryIcon
                    category={element.category || ''}
                    className="text-[56px] text-blue-400"
                  />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
                    {element.name}
                  </h1>
                  <p className="text-base text-blue-300/80 font-medium capitalize">
                    {element.category}
                  </p>
                </div>
              </div>
              <div className="text-sm text-blue-200/60 bg-blue-950/40 px-4 py-2 rounded-lg border border-blue-500/20">
                Published {new Date(showcase.metadata.published_at).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="px-8 pb-4">
            <div className="text-sm text-blue-200/50 flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
                {showcase.metadata.view_count} views
              </span>
              <span className="text-blue-400/40">•</span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {showcase.metadata.world_name}
              </span>
              <span className="text-blue-400/40">•</span>
              <button
                onClick={handleCopyJSON}
                className="flex items-center gap-1.5 text-blue-300 hover:text-blue-200 hover:bg-blue-500/10 px-2 py-1 rounded transition-all"
                title="Copy element JSON"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy data
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 pt-2 bg-slate-900">
          {/* Base fields section */}
          <div className="pt-6 pb-4 border-b border-blue-500/20">
            {fields.filter(([fieldName]) => baseFields.includes(fieldName)).map(([fieldName, value]) => {
              // Skip hidden or empty fields
              if (hiddenFields.has(fieldName) || !value || (Array.isArray(value) && value.length === 0)) {
                return null;
              }

              return (
                <div key={fieldName} className="mb-4 rounded-xl bg-slate-700/40 border border-blue-500/20 shadow-lg hover:shadow-blue-500/10 transition-all">
                  <div className="flex-1 py-4 px-5">
                    <div className="flex items-start">
                      <label className="block w-40 flex-shrink-0 text-base text-blue-200 font-semibold">
                        {fieldName.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      <div className="flex-1 text-slate-100 font-normal">
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
          <div className="pt-6 space-y-4">
            {fields.filter(([fieldName]) => !baseFields.includes(fieldName)).map(([fieldName, value]) => {
              // Skip hidden or empty fields
              if (hiddenFields.has(fieldName) || !value || (Array.isArray(value) && value.length === 0)) {
                return null;
              }

              return (
                <div key={fieldName} className="rounded-xl bg-slate-700/30 border border-blue-500/20 shadow-md hover:shadow-blue-500/10 transition-all">
                  <div className="flex-1 py-4 px-5">
                    <div className="flex items-start">
                      <label className="block w-40 flex-shrink-0 text-base text-blue-200/90 font-semibold">
                        {fieldName.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      <div className="flex-1 text-slate-100 font-normal">
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