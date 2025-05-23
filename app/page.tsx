import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Edit3, Users, ShieldCheck, MessageSquareText } from 'lucide-react'; // Modern icons

export default function HomePage() {
  const features = [
    { name: 'Self-Hosted & Secure', icon: ShieldCheck, description: 'Full data ownership and control.' },
    { name: 'Advanced Markdown Editor', icon: Edit3, description: 'With real-time preview for a seamless experience.' },
    { name: 'User-Configurable AI', icon: Zap, description: 'Connect YOUR preferred LLMs (OpenAI, Ollama, etc.).' },
    { name: 'Contextual AI Chat (RAG)', icon: MessageSquareText, description: 'Chat with your notes intelligently.' },
    { name: 'Real-Time Collaboration', icon: Users, description: 'Work together on notes (Coming Soon).' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col items-center justify-center p-4 md:p-8 selection:bg-primary/30 selection:text-white">
      <main className="max-w-4xl w-full space-y-10">
        <Card className="bg-slate-800/70 border-slate-700 text-center shadow-2xl backdrop-blur-md transition-all hover:shadow-slate-600/50">
          <CardHeader className="pb-6">
            <div className="flex justify-center items-center mb-6">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                <path d="M12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor"/>
                <path d="M8.5 10.5C8.5 9.67 9.17 9 10 9C10.83 9 11.5 9.67 11.5 10.5C11.5 11.33 10.83 12 10 12C9.17 12 8.5 11.33 8.5 10.5Z" fill="currentColor"/>
              </svg>
            </div>
            <CardTitle className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-4">
              Noteworthy
            </CardTitle>
            <CardDescription className="text-xl md:text-2xl text-slate-300">
              Your Self-Hosted, AI-Powered Knowledge Hub.
              <br />
              <span className="font-semibold text-slate-200">Take control of your notes, your data, and your AI.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-12 px-6 md:px-10">
            <section>
              <h2 className="text-3xl font-semibold text-slate-100 mb-8">Key Features</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {features.map((feature) => (
                  <div key={feature.name} className="flex items-start space-x-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-600/50 transition-colors">
                    <feature.icon className="w-8 h-8 text-primary shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100">{feature.name}</h3>
                      <p className="text-slate-300 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <p className="text-slate-300 text-lg leading-relaxed max-w-2xl mx-auto">
                Noteworthy is a next-generation, self-hosted note-taking application designed for privacy-conscious individuals and teams who want to leverage the power of AI on their own terms.
              </p>
            </section>

            <footer className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 pt-8 pb-4">
              <Button asChild size="lg" className="px-10 py-3 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-150 ease-in-out">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-10 py-3 text-lg border-slate-500 text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-400 font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-150 ease-in-out">
                <Link href="/register">Register</Link>
              </Button>
            </footer>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}