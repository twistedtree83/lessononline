import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader } from 'lucide-react';
import { Button } from './ui/button';

type FileUploadProps = {
  onFileUpload: (file: File) => void;
  isProcessing?: boolean;
};

export function FileUpload({ onFileUpload, isProcessing = false }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      onFileUpload(acceptedFiles[0]);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: isProcessing,
  });

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}
        ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      
      {selectedFile ? (
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4 bg-blue-50 p-3 rounded-md">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-500 mr-2" />
              <div className="text-left">
                <p className="text-sm font-medium truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            {!isProcessing && (
              <button 
                onClick={removeFile}
                className="text-gray-500 hover:text-red-500 focus:outline-none"
                aria-label="Remove file"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {isProcessing ? (
            <div className="flex items-center text-blue-600">
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              <span>Analyzing document...</span>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Click or drag to replace this file</p>
          )}
        </div>
      ) : (
        <>
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-900">
            {isDragActive ? 'Drop the file here...' : 'Drag & drop a lesson plan file, or click to select'}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Supports PDF, DOC, DOCX, and TXT formats (Max 10MB)
          </p>
          <Button 
            type="button"
            variant="outline"
            className="mt-4"
            onClick={(e) => e.stopPropagation()}
            disabled={isProcessing}
          >
            Browse Files
          </Button>
        </>
      )}
    </div>
  );
}