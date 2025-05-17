import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';
import { Button } from './ui/button';

type UnderstandingResponse = 'understood' | 'not-understood' | null;

type StudentUnderstandingCheckProps = {
  checkId: string;
  question: string;
  onRespond: (checkId: string, response: UnderstandingResponse) => void;
  disabled?: boolean;
};

export function StudentUnderstandingCheck({ 
  checkId, 
  question, 
  onRespond, 
  disabled = false 
}: StudentUnderstandingCheckProps) {
  const [response, setResponse] = useState<UnderstandingResponse>(null);

  const handleResponse = (value: UnderstandingResponse) => {
    setResponse(value);
    onRespond(checkId, value);
  };

  return (
    <Card className="border-primary/20 bg-primary/5 animate-pulse mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-primary">
          <HelpCircle className="h-5 w-5 mr-2" />
          Teacher Check
        </CardTitle>
        <CardDescription>{question}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center space-x-4">
          <Button
            variant={response === 'understood' ? 'default' : 'outline'}
            className={response === 'understood' ? 'bg-green-600 hover:bg-green-700' : ''}
            onClick={() => handleResponse('understood')}
            disabled={disabled}
          >
            <ThumbsUp className="h-5 w-5 mr-2" />
            I understand
          </Button>
          <Button
            variant={response === 'not-understood' ? 'default' : 'outline'}
            className={response === 'not-understood' ? 'bg-amber-600 hover:bg-amber-700' : ''}
            onClick={() => handleResponse('not-understood')}
            disabled={disabled}
          >
            <ThumbsDown className="h-5 w-5 mr-2" />
            I'm confused
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type TeacherUnderstandingControlProps = {
  onSendCheck: () => void;
  responses: {
    understood: number;
    notUnderstood: number;
    total: number;
  };
  loading?: boolean;
};

export function TeacherUnderstandingControl({
  onSendCheck,
  responses,
  loading = false
}: TeacherUnderstandingControlProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <HelpCircle className="h-5 w-5 mr-2" />
          Understanding Check
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button 
            onClick={onSendCheck} 
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send "Do you understand?" to students'}
          </Button>
          
          {(responses.understood > 0 || responses.notUnderstood > 0) && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Responses: {responses.understood + responses.notUnderstood} of {responses.total}</p>
              
              <div className="flex items-center">
                <ThumbsUp className="h-4 w-4 text-green-600 mr-2" />
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-green-600 h-4 rounded-full" 
                    style={{ 
                      width: `${responses.total ? (responses.understood / responses.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium">{responses.understood}</span>
              </div>
              
              <div className="flex items-center">
                <ThumbsDown className="h-4 w-4 text-amber-600 mr-2" />
                <div className="flex-1 bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-amber-600 h-4 rounded-full" 
                    style={{ 
                      width: `${responses.total ? (responses.notUnderstood / responses.total) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="ml-2 text-sm font-medium">{responses.notUnderstood}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}