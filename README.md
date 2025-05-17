# Classroom App

A web application for connecting teachers and students in virtual classroom sessions.

## Features

- **Teacher Features**:
  - Create lesson plans with AI analysis
  - Start classroom sessions with auto-generated class codes
  - Monitor student participation in real-time
  - End sessions when complete

- **Student Features**:
  - Join classes using class codes
  - View lesson content during the session
  - Access past session history

## Technology Stack

- React with TypeScript
- Tailwind CSS with shadcn/ui components
- Supabase for authentication and database
- React Router for navigation
- React Dropzone for file uploads
- OpenAI for lesson content analysis

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- OpenAI API Key

### Setup

1. Clone the repository

2. Install dependencies
   ```
   npm install
   ```

3. Configure environment variables
   - Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   ```

4. Configure Supabase
   - Create a new Supabase project
   - Use the SQL migrations in the `supabase/migrations` folder to set up your database

5. Start the development server
   ```
   npm run dev
   ```

## AI Document Analysis

The application uses OpenAI to analyze uploaded lesson plans:

1. Teachers upload PDF, DOCX, or TXT files
2. The app extracts text content from the documents
3. OpenAI processes the content and structures it into:
   - Introduction
   - Body (main content)
   - Conclusion
4. The processed content is displayed for teacher review before saving

If no OpenAI API key is provided, the app falls back to basic text processing.

## Deployment

This project can be deployed on Netlify:

1. Connect your repository to Netlify
2. Configure the build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Add your Supabase and OpenAI environment variables

## Project Structure

- `/src/components`: Reusable UI components
- `/src/pages`: Page components for different routes
- `/src/lib`: Utility functions and configurations including AI service
- `/supabase`: Database migrations and edge functions