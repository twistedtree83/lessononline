/**
 * Document parser utilities for extracting text from various file formats
 */
import * as pdfjs from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// Configure PDF.js to use the worker file from the public directory
// This ensures the worker is accessible at the root path
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

/**
 * Extract text from a PDF file
 * @param file PDF file to parse
 * @returns Extracted text content
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
          fullText += pageText + '\n\n';
        }
        
        resolve(fullText);
      } catch (error) {
        console.error("PDF extraction error:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract text from a DOCX file
 * @param file DOCX file to parse
 * @returns Extracted text content with HTML formatting
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const result = await mammoth.convertToHtml({ arrayBuffer });
        resolve(result.value);
      } catch (error) {
        console.error("DOCX extraction error:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract text from a TXT file
 * @param file TXT file to parse
 * @returns Extracted text content
 */
export async function extractTextFromTXT(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        resolve(text);
      } catch (error) {
        console.error("TXT extraction error:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsText(file);
  });
}

/**
 * Extract text from any supported file type
 * @param file File to parse
 * @returns Extracted text content
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();
  
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return extractTextFromPDF(file);
  } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            fileName.endsWith('.docx')) {
    return extractTextFromDOCX(file);
  } else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
    throw new Error('DOC format is not directly supported. Please convert to DOCX.');
  } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
    return extractTextFromTXT(file);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
}