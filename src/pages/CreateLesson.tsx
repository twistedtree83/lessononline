import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileUpload } from '../components/FileUpload';
import { supabase, User, mockDatabase } from '../lib/supabase';
import { ArrowLeft, Save, Loader, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { extractTextFromFile } from '../lib/documentParser';
import { aiAnalyzeLesson } from '../lib/aiService';

type CreateLessonProps = {
  user: User;
};

export default function CreateLesson({ user }: CreateLessonProps) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lessonContent, setLessonContent] = useState({
    introduction: '',
    body: '',
    conclusion: ''
  });
  const [apiKeyMissing, setApiKeyMissing] = useState(!import.meta.env.VITE_OPENAI_API_KEY);
  const navigate = useNavigate();

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    await analyzeFile(uploadedFile);
  };

  const analyzeFile = async (fileToAnalyze: File) => {
    setAnalyzing(true);
    const toastId = toast.loading('Analyzing your lesson plan...');
    
    try {
      // Extract text from the document
      const extractedText = await extractTextFromFile(fileToAnalyze);
      
      // Send the text to the AI for analysis
      const analysis = await aiAnalyzeLesson(extractedText);
      
      setLessonContent(analysis);
      toast.dismiss(toastId);
      toast.success('Document analyzed successfully!');
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(`Error analyzing file: ${error.message || 'Unknown error'}`);
      console.error('Error analyzing file:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a lesson title');
      return;
    }
    
    if (!lessonContent.introduction && !lessonContent.body && !lessonContent.conclusion) {
      toast.error('Please upload and analyze a lesson plan');
      return;
    }
    
    setLoading(true);
    
    try {
      // In real app use Supabase, but for demo use mock database
      const { data, error } = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
        ? await supabase
            .from('lessons')
            .insert([
              { 
                title, 
                content: lessonContent,
                teacher_id: user.id
              }
            ])
            .select()
            .single()
        : mockDatabase.createLesson({
            title,
            content: lessonContent,
            teacher_id: user.id
          });
        
      if (error) throw error;
      
      toast.success('Lesson saved successfully!');
      navigate('/teacher');
    } catch (error) {
      toast.error('Failed to save lesson');
      console.error('Error saving lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/teacher')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Lesson</h1>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Lesson Title
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter lesson title"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload Lesson Plan
                  </label>
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 mr-2 text-blue-500" />
                    <span className="text-sm text-gray-600">Upload a document and our AI will analyze the content</span>
                  </div>
                  
                  {apiKeyMissing && (
                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
                      <p className="text-sm text-amber-700">
                        OpenAI API key not detected. Analysis will use basic text processing instead of AI.
                      </p>
                    </div>
                  )}
                  
                  <FileUpload onFileUpload={handleFileUpload} isProcessing={analyzing} />
                  {file && !analyzing && (
                    <div className="flex items-center mt-2">
                      <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                      <span className="text-sm text-gray-600">Document processed and ready to review</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          {(lessonContent.introduction || lessonContent.body || lessonContent.conclusion) && (
            <Card>
              <CardHeader>
                <CardTitle>Lesson Outline Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Introduction</h3>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lessonContent.introduction }} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Body</h3>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lessonContent.body }} />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Conclusion</h3>
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lessonContent.conclusion }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={loading || analyzing || !title.trim() || (!lessonContent.introduction && !lessonContent.body && !lessonContent.conclusion)}
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Lesson
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}