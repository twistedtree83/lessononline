// src/lib/pdfWorkerShim.ts
import * as pdfjs from 'pdfjs-dist/build/pdf';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?worker'; // <-- magic ?worker

pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();
// If you also use react-pdf:
// import { pdfjs as reactPdfjs } from 'react-pdf';
// reactPdfjs.GlobalWorkerOptions.workerPort = new PdfWorker();