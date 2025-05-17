import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

type ClassCodeDisplayProps = {
  classCode: string;
};

export function ClassCodeDisplay({ classCode }: ClassCodeDisplayProps) {
  return (
    <Card className="bg-primary/10 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="text-center">Class Code</CardTitle>
        <CardDescription className="text-center">Share this code with your students</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div className="text-4xl font-bold tracking-widest bg-white py-4 px-6 rounded-lg border-2 border-primary/20">
            {classCode}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}