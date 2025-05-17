// Supabase Edge Function for AI-powered document analysis
// This would be the more secure way to handle OpenAI API calls in production

import { createClient } from 'npm:@supabase/supabase-js';
import OpenAI from 'npm:openai';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", 
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Initialize OpenAI client - in production, API key would be an environment variable
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')
});

// Create a Supabase client
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

interface AnalysisRequest {
  text: string;
}

interface LessonContent {
  introduction: string;
  body: string;
  conclusion: string;
  painPoints: string;
  vocabularyNotes: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request
    const { text } = await req.json() as AnalysisRequest;

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text content is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Call OpenAI to analyze the document
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        { 
          role: "system", 
          content: "You are an expert educational content analyzer. Format the response as proper HTML with p, ul, li, h3 tags as appropriate."
        },
        { 
          role: "user", 
          content: `Extract and organize this lesson plan into five sections:
            1. Introduction
            2. Body (main content)
            3. Conclusion
            4. Pain Points: Identify potential challenges or difficulties students might face in understanding this content. 
               Include complex concepts, confusing explanations, or areas requiring prerequisite knowledge.
               Also analyze potential misconceptions students might develop.
            5. Vocabulary Notes: List key vocabulary terms or jargon in the lesson that students might find difficult,
               with brief explanations that a teacher could use to help students understand.
            
            Here is the content:
            ${text.slice(0, 15000)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Return the analyzed lesson content
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});