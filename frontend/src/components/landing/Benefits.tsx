import { Sparkles, Users, Target, Zap } from "lucide-react";

export default function Benefits() {
  return (
    <section className="py-24 lg:py-32" id="benefits">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Why Choose Pixel
          </div>
          <h2 className="text-4xl lg:text-6xl font-bold bg-gradient-to-r from-violet-600 via-violet-500 to-violet-400 bg-clip-text text-transparent mb-6">
            Benefits That Matter
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Experience the future of studying with our integrated AI-powered
            platform.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Feature Card */}
          <div className="lg:col-span-2 group">
            <div className="relative bg-gradient-to-br from-violet-400 via-violet-500 to-violet-600 rounded-3xl lg:rounded-[2rem] p-8 lg:p-12 text-violet-900 overflow-hidden transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-300 rounded-full opacity-20 -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-700 rounded-full opacity-10 translate-y-12 -translate-x-12" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-violet-300 rounded-xl">
                    <Zap className="w-6 h-6 text-violet-800" />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wide">
                    Unified Study Platform
                  </span>
                </div>
                <p className="text-3xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                  Say goodbye to scattered tools.{" "}
                  <span className="font-[Caveat] text-white">Pixel</span> brings
                  note-taking, question generation, and{" "}
                  <span className="font-[Caveat] text-white">revision</span>{" "}
                  under one roof.
                </p>
              </div>
            </div>
          </div>

          {/* Collaboration Card */}
          <div className="group">
            <div className="relative bg-white border border-violet-200 rounded-3xl p-8 text-gray-800 h-full transform transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:border-violet-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-violet-100 to-violet-200 rounded-full opacity-50 -translate-y-10 translate-x-10" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-violet-100 rounded-xl">
                    <Users className="w-6 h-6 text-violet-600" />
                  </div>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                  Collaborative Learning
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Share notes, flashcards, and quizzes with classmates. Learn
                  together, grow together.
                </p>
              </div>
            </div>
          </div>

          {/* Long-Term Engagement Card */}
          <div className="group">
            <div className="relative bg-gradient-to-br from-violet-700 via-violet-600 to-violet-500 rounded-3xl p-8 text-white h-full transform transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-violet-400 rounded-full opacity-20 -translate-y-12 -translate-x-12" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-violet-500 rounded-xl">
                    <Target className="w-6 h-6 text-violet-900" />
                  </div>
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold mb-4">
                  Long-Term Success
                </h3>
                <p className="text-violet-100 leading-relaxed">
                  Pixel isn't just about passing exams—it's about building
                  knowledge for life and long-term academic growth.
                </p>
              </div>
            </div>
          </div>

          {/* AI-Powered Card */}
          <div className="lg:col-span-2 group">
            <div className="relative bg-gradient-to-br from-violet-100 via-violet-200 to-violet-300 border border-violet-200 rounded-3xl lg:rounded-[2rem] p-8 lg:p-12 text-gray-800 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:border-violet-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-200 to-violet-300 rounded-full opacity-30 -translate-y-20 translate-x-20" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <p className="text-lg text-gray-600 mb-2">
                      How does Pixel help?
                    </p>
                    <div className="flex items-center gap-2 text-sm text-violet-600 font-medium">
                      <Sparkles className="w-4 h-4" />
                      Smart Technology
                    </div>
                  </div>
                </div>

                <h3 className="text-4xl lg:text-6xl xl:text-7xl font-bold text-transparent bg-gradient-to-r from-violet-600 via-violet-500 to-violet-400 bg-clip-text leading-tight">
                  AI-Powered Personalization
                </h3>

                <div className="mt-6 flex flex-wrap gap-3">
                  {[
                    "Smart Question Generation",
                    "Adaptive Quizzes",
                    "Personalized Study Plans",
                  ].map((feature) => (
                    <div
                      key={feature}
                      className="px-4 py-2 bg-white border border-violet-200 rounded-full text-sm text-gray-600"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
