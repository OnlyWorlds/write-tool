import { useMemo } from 'react';

interface WritingStatsProps {
  content: string;
  className?: string;
}

export function WritingStats({ content, className = '' }: WritingStatsProps) {
  const stats = useMemo(() => {
    // Remove markdown syntax for more accurate word count
    const plainText = content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]*`/g, '') // Remove inline code
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Convert links to text
      .replace(/[#*_~>\-]/g, '') // Remove markdown symbols
      .trim();

    const words = plainText.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    const charCount = plainText.length;
    const charCountWithSpaces = content.length;

    return {
      wordCount,
      charCount,
      charCountWithSpaces,
    };
  }, [content]);

  return (
    <div className={`flex items-center gap-4 text-sm text-slate-600 ${className}`}>
      <span className="flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="font-medium">{stats.wordCount.toLocaleString()}</span> words
      </span>
      
      <span className="text-slate-500">
        {stats.charCount.toLocaleString()} characters
      </span>
    </div>
  );
}