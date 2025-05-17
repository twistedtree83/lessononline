// src/lib/pdfWorkerShim.ts
import * as pdfjs from 'pdfjs-dist/build/pdf';

// Set the worker URL to use the CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
// If you also use react-pdf:
// import { pdfjs as reactPdfjs } from 'react-pdf';
// reactPdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;