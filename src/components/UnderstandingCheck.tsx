import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { UnderstandingPoll, UnderstandingResponse } from '../lib/socket';

type UnderstandingCheckProps = {
  poll: UnderstandingPoll;
  onRespond: (understood: boolean) => void;
  userResponse?: boolean;
};

export function UnderstandingCheck({ poll, onRespond, userResponse }: UnderstandingCheckProps) {
  // If the user has already responded, show their response
  if (userResponse !== undefined) {
    return (
      <Card className={userResponse ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{poll.question}</CardTitle>
          <CardDescription>Your response has been recorded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center">
            {userResponse ? (
              <div className="flex items-center text-green-600">
                <ThumbsUp className="h-8 w-8 mr-2" />
                <span className="text-lg font-medium">I understand</span>
              </div>
            ) : (
              <div className="flex items-center text-amber-600">
                <ThumbsDown className="h-8 w-8 mr-2" />
                <span className="text-lg font-medium">I need help</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Otherwise, show the response options
  return (
    <Card className="border-blue-200 bg-blue-50 animate-pulse">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{poll.question}</CardTitle>
        <CardDescription>Please respond to your teacher's question</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center space-x-4">
          <Button 
            onClick={() => onRespond(true)}
            className="bg-green-600 hover:bg-green-700 flex items-center"
          >
            <ThumbsUp className="h-5 w-5 mr-2" />
            I understand
          </Button>
          <Button 
            onClick={() => onRespond(false)}
            className="bg-amber-600 hover:bg-amber-700 flex items-center"
          >
            <ThumbsDown className="h-5 w-5 mr-2" />
            I need help
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type UnderstandingResultsProps = {
  responses: UnderstandingResponse[];
  totalStudents: number;
};

export function UnderstandingResults({ responses, totalStudents }: UnderstandingResultsProps) {
  const understoodCount = responses.filter(r => r.understood).length;
  const notUnderstoodCount = responses.length - understoodCount;
  const notRespondedCount = totalStudents - responses.length;
  
  const understoodPercentage = totalStudents > 0 ? Math.round((understoodCount / totalStudents) * 100) : 0;
  const notUnderstoodPercentage = totalStudents > 0 ? Math.round((notUnderstoodCount / totalStudents) * 100) : 0;
  const notRespondedPercentage = totalStudents > 0 ? Math.round((notRespondedCount / totalStudents) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Understanding Check Results</CardTitle>
        <CardDescription>
          {responses.length} of {totalStudents} students have responded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-32 text-green-600 flex items-center">
              <ThumbsUp className="h-5 w-5 mr-2" />
              <span>Understood:</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div 
                className="bg-green-600 h-4 rounded-full" 
                style={{ width: `${understoodPercentage}%` }}
              ></div>
            </div>
            <div className="ml-4 w-16 text-right">
              {understoodCount} ({understoodPercentage}%)
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-32 text-amber-600 flex items-center">
              <ThumbsDown className="h-5 w-5 mr-2" />
              <span>Need help:</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div 
                className="bg-amber-600 h-4 rounded-full" 
                style={{ width: `${notUnderstoodPercentage}%` }}
              ></div>
            </div>
            <div className="ml-4 w-16 text-right">
              {notUnderstoodCount} ({notUnderstoodPercentage}%)
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="w-32 text-gray-600 flex items-center">
              <span>No response:</span>
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gray-400 h-4 rounded-full" 
                style={{ width: `${notRespondedPercentage}%` }}
              ></div>
            </div>
            <div className="ml-4 w-16 text-right">
              {notRespondedCount} ({notRespondedPercentage}%)
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}