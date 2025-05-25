import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Zap,
  Edit3,
  Users,
  ShieldCheck,
  MessageSquareText,
  ArrowRight,
  Sparkles,
  Star,
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      name: 'Self-Hosted & Secure',
      icon: ShieldCheck,
      description: 'Full data ownership and control.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Advanced Markdown Editor',
      icon: Edit3,
      description: 'With real-time preview for a seamless experience.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      name: 'User-Configurable AI',
      icon: Zap,
      description: 'Connect YOUR preferred LLMs (OpenAI, Ollama, etc.).',
      gradient: 'from-yellow-500 to-orange-500',
    },
    {
      name: 'Contextual AI Chat (RAG)',
      icon: MessageSquareText,
      description: 'Chat with your notes intelligently.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Real-Time Collaboration',
      icon: Users,
      description: 'Work together on notes (Coming Soon).',
      gradient: 'from-indigo-500 to-purple-500',
    },
  ];

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white flex flex-col items-center justify-center p-4 md:p-8 selection:bg-primary/30 selection:text-white relative overflow-hidden'>
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-1/2 -right-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-soft'></div>
        <div className='absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse-soft delay-1000'></div>
        <div className='absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-float'></div>
      </div>

      <main className='max-w-6xl w-full space-y-12 relative z-10'>
        {/* Hero Section */}
        <div className='text-center space-y-8 animate-slide-in-top'>
          <div className='flex justify-center items-center mb-8'>
            <div className='relative animate-float'>
              <svg
                width='80'
                height='80'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
                className='text-primary drop-shadow-lg'
              >
                <path
                  d='M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z'
                  fill='currentColor'
                />
                <path d='M12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z' fill='currentColor' />
                <path
                  d='M8.5 10.5C8.5 9.67 9.17 9 10 9C10.83 9 11.5 9.67 11.5 10.5C11.5 11.33 10.83 12 10 12C9.17 12 8.5 11.33 8.5 10.5Z'
                  fill='currentColor'
                />
              </svg>
              <Sparkles className='absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse' />
            </div>
          </div>

          <div className='space-y-6'>
            <h1 className='text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-6 animate-shimmer bg-size-200'>
              Noteworthy
            </h1>
            <p className='text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed'>
              Your Self-Hosted, AI-Powered Knowledge Hub.
              <br />
              <span className='font-semibold text-slate-200 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
                Take control of your notes, your data, and your AI.
              </span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className='flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 pt-8'>
            <Button asChild variant='default' size='lg' className='group animate-slide-in-left'>
              <Link href='/login' className='flex items-center'>
                Get Started
                <ArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform' />
              </Link>
            </Button>
            <Button asChild variant='outline' size='lg' className='animate-slide-in-right'>
              <Link href='/register'>Create Account</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <Card className='bg-slate-800/40 backdrop-blur-md border-slate-700/50 text-center shadow-2xl animate-fade-in-scale card-hover'>
          <CardHeader className='pb-8'>
            <CardTitle className='text-3xl font-semibold text-slate-100 mb-4 flex items-center justify-center gap-3'>
              <Star className='w-8 h-8 text-yellow-400' />
              Why Choose Noteworthy?
            </CardTitle>
            <CardDescription className='text-lg text-slate-300 max-w-2xl mx-auto'>
              Experience the next generation of note-taking with powerful features designed for
              modern knowledge workers.
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-12 px-6 md:px-10'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left'>
              {features.map((feature, index) => (
                <div
                  key={feature.name}
                  className={`group p-6 bg-gradient-to-br ${feature.gradient}/10 hover:${feature.gradient}/20 rounded-xl border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300 cursor-pointer animate-slide-in-bottom card-hover`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className='flex items-start space-x-4'>
                    <div
                      className={`p-3 rounded-lg bg-gradient-to-r ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className='w-6 h-6 text-white' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='text-lg font-semibold text-slate-100 group-hover:text-white transition-colors mb-2'>
                        {feature.name}
                      </h3>
                      <p className='text-slate-300 text-sm leading-relaxed group-hover:text-slate-200 transition-colors'>
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced description section */}
            <div className='bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-8 border border-slate-600/30 backdrop-blur-sm animate-slide-in-bottom'>
              <p className='text-slate-300 text-lg leading-relaxed max-w-4xl mx-auto'>
                <span className='text-purple-400 font-semibold'>Noteworthy</span> is a
                next-generation, self-hosted note-taking application designed for privacy-conscious
                individuals and teams who want to leverage the power of AI on their own terms.
                <span className='text-pink-400 font-medium'>
                  {' '}
                  Build your personal knowledge graph
                </span>
                ,<span className='text-blue-400 font-medium'> connect with AI models</span>, and
                <span className='text-green-400 font-medium'> collaborate seamlessly</span> - all
                while maintaining complete control over your data.
              </p>
            </div>

            {/* Stats or testimonials could go here */}
            <div className='grid grid-cols-3 gap-6 py-8 animate-slide-in-bottom'>
              <div className='text-center'>
                <div className='text-3xl font-bold text-purple-400 mb-2'>100%</div>
                <div className='text-slate-400 text-sm'>Privacy Control</div>
              </div>
              <div className='text-center'>
                <div className='text-3xl font-bold text-pink-400 mb-2'>∞</div>
                <div className='text-slate-400 text-sm'>Notes Capacity</div>
              </div>
              <div className='text-center'>
                <div className='text-3xl font-bold text-blue-400 mb-2'>24/7</div>
                <div className='text-slate-400 text-sm'>AI Assistant</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
