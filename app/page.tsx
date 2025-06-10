import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Edit3,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const features = [
    {
      name: "Self-Hosted & Secure",
      icon: ShieldCheck,
      description: "Full data ownership and control.",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      name: "Advanced Markdown Editor",
      icon: Edit3,
      description: "With real-time preview for a seamless experience.",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      name: "User-Configurable AI",
      icon: Zap,
      description: "Connect YOUR preferred LLMs (OpenAI, Ollama, etc.).",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      name: "Contextual AI Chat (RAG)",
      icon: MessageSquareText,
      description: "Chat with your notes intelligently.",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      name: "Real-Time Collaboration",
      icon: Users,
      description: "Work together on notes (Coming Soon).",
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex flex-col items-center justify-center p-4 md:p-8 selection:bg-primary/20 relative overflow-hidden">
      {/* Subtle animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/2 rounded-full blur-3xl animate-bounce-subtle"></div>
      </div>

      <main className="max-w-6xl w-full space-y-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-8 animate-fade-in-down">
          <div className="flex justify-center items-center mb-8">
            <div className="relative animate-bounce-subtle">
              <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-xl">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-primary animate-pulse" />
            </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground tracking-tight">
              Noteworthy
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Your Self-Hosted, AI-Powered Knowledge Hub.
              <br />
              <span className="font-semibold text-foreground">
                Take control of your notes, your data, and your AI.
              </span>
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-8">
            <Button
              asChild
              size="lg"
              className="group animate-slide-in-left px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Link href="/login" className="flex items-center">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="animate-slide-in-right px-8 py-3 rounded-xl border-2 hover:bg-secondary/50 transition-all duration-200"
            >
              <Link href="/register">Create Account</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <Card className="bg-card/50 backdrop-blur-sm border text-center shadow-lg animate-scale-in hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-8">
            <CardTitle className="text-3xl font-semibold text-foreground mb-4 flex items-center justify-center gap-3">
              <Star className="w-8 h-8 text-primary" />
              Why Choose Noteworthy?
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the next generation of note-taking with powerful
              features designed for modern knowledge workers.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-12 px-6 md:px-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
              {features.map((feature, index) => (
                <div
                  key={feature.name}
                  className={`group p-6 bg-secondary/30 hover:bg-secondary/50 rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 cursor-pointer animate-fade-in-up hover:shadow-lg hover:-translate-y-1`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r ${feature.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                        {feature.name}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed group-hover:text-foreground transition-colors">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced description section */}
            <div className="bg-gradient-to-r from-secondary/30 to-secondary/20 rounded-2xl p-8 border border-border backdrop-blur-sm animate-fade-in-up">
              <p className="text-muted-foreground text-lg leading-relaxed max-w-4xl mx-auto">
                <span className="text-primary font-semibold">Noteworthy</span>{" "}
                is a next-generation, self-hosted note-taking application
                designed for privacy-conscious individuals and teams who want to
                leverage the power of AI on their own terms.
                <span className="text-foreground font-medium">
                  {" "}
                  Build your personal knowledge graph
                </span>
                ,
                <span className="text-foreground font-medium">
                  {" "}
                  connect with AI models
                </span>
                , and
                <span className="text-foreground font-medium">
                  {" "}
                  collaborate seamlessly
                </span>{" "}
                - all while maintaining complete control over your data.
              </p>
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-3 gap-6 py-8 animate-fade-in-up">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">100%</div>
                <div className="text-muted-foreground text-sm">
                  Privacy Control
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">∞</div>
                <div className="text-muted-foreground text-sm">
                  Notes Capacity
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-muted-foreground text-sm">
                  AI Assistant
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
