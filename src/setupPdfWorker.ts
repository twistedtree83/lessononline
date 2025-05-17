import * as pdfjs from 'pdfjs-dist/build/pdf';
import workerUrl from './pdfWorker';

// Set the worker URL for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// If you add react-pdf in the future, uncomment these lines:
// import { pdfjs as reactPdfjs } from 'react-pdf';
// reactPdfjs.GlobalWorkerOptions.workerSrc = workerUrl;