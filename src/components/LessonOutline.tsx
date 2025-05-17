import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Lesson } from '../lib/supabase';

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
    </div>
  );
}