import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Element } from '../types/world';

export interface ExportOptions {
  elementName: string;
  includeImages?: boolean;
  quality?: number;
}

/**
 * Export an element to PDF
 */
export async function exportElementToPdf(
  elementId: string, 
  options: ExportOptions
): Promise<void> {
  const element = document.getElementById(`showcase-${elementId}`);
  if (!element) {
    throw new Error('Element not found for export');
  }

  try {
    // Configure html2canvas options
    const canvas = await html2canvas(element, {
      scale: options.quality || 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      imageTimeout: 15000,
      ignoreElements: (el) => {
        // Ignore elements with data-exclude-from-export attribute
        return el.hasAttribute('data-exclude-from-export');
      }
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions to fit the page
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate scaling to fit within page margins
    const margin = 10; // 10mm margin
    const maxWidth = pdfWidth - (2 * margin);
    const maxHeight = pdfHeight - (2 * margin);
    
    let imgWidth = imgProps.width;
    let imgHeight = imgProps.height;
    
    // Scale down if necessary
    const widthRatio = maxWidth / imgWidth;
    const heightRatio = maxHeight / imgHeight;
    const ratio = Math.min(widthRatio, heightRatio, 1); // Don't scale up
    
    imgWidth *= ratio;
    imgHeight *= ratio;
    
    // Center the image
    const x = (pdfWidth - imgWidth) / 2;
    const y = margin;
    
    // Add image to PDF
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    
    // Add metadata
    pdf.setProperties({
      title: `${options.elementName} - OnlyWorlds Export`,
      subject: 'OnlyWorlds Element Export',
      author: 'OnlyWorlds Browse Tool',
      creator: 'OnlyWorlds Browse Tool'
    });
    
    // Save the PDF
    const fileName = `${options.elementName.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
}

/**
 * Check if PDF export is supported in the current browser
 */
export function isPdfExportSupported(): boolean {
  try {
    // Check for required APIs in browser environment
    if (typeof window === 'undefined') return false;
    if (typeof document === 'undefined') return false;
    if (typeof HTMLCanvasElement === 'undefined') return false;
    
    // Check for specific methods by trying to access them
    return !!(
      typeof document.getElementById === 'function' &&
      typeof HTMLCanvasElement.prototype.toDataURL === 'function' &&
      window.URL &&
      typeof window.URL.createObjectURL === 'function'
    );
  } catch {
    return false;
  }
}