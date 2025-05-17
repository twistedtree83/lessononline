import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Lesson } from '../lib/supabase';
import { AlertTriangle, BookOpen, Brain, GraduationCap } from 'lucide-react';

type LessonOutlineProps = {
  lesson: Lesson;
};

export function LessonOutline({ lesson }: LessonOutlineProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Introduction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {lesson.content.introduction ? (
              <div dangerouslySetInnerHTML={{ __html: lesson.content.introduction }} />
            ) : (
              <p className="text-gray-500 italic">No introduction available</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Body</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {lesson.content.body ? (
              <div dangerouslySetInnerHTML={{ __html: lesson.content.body }} />
            ) : (
              <p className="text-gray-500 italic">No body content available</p>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Conclusion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            {lesson.content.conclusion ? (
              <div dangerouslySetInnerHTML={{ __html: lesson.content.conclusion }} />
            ) : (
              <p className="text-gray-500 italic">No conclusion available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {lesson.content.painPoints && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-amber-800">
              <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
              Potential Pain Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-amber-900">
              <div dangerouslySetInnerHTML={{ __html: lesson.content.painPoints }} />
            </div>
          </CardContent>
        </Card>
      )}

      {lesson.content.vocabularyNotes && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-blue-800">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Vocabulary Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-blue-900">
              <div dangerouslySetInnerHTML={{ __html: lesson.content.vocabularyNotes }} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}