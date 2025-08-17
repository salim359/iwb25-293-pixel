import { Progress } from "@/components/ui/progress";

export default function Loading(props: {
  progress?: number;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
      {/* Main Container with Subtle Background */}
      <div className="relative">
        {/* Outer Glow Ring */}
        <div className="absolute inset-0 w-32 h-32 bg-gradient-to-r from-purple-200/30 to-violet-300/30 rounded-full blur-xl animate-pulse"></div>

        {/* Inner Ring with Rotation */}
        <div className="relative w-24 h-24 mx-auto">
          <div className="absolute inset-0 w-full h-full border-4 border-purple-200/20 rounded-full"></div>
          <div className="absolute inset-0 w-full h-full border-t-4 border-purple-500 rounded-full animate-spin"></div>

          {/* Mascot Character Container */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative group">
              {/* Character with Enhanced Animation */}
              <div className="text-4xl transition-transform mt-3 duration-700 ease-in-out group-hover:scale-110 animate-bounce">
                💜
              </div>

              {/* Sparkle Effects */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-ping opacity-75"></div>
              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping animation-delay-300 opacity-60"></div>
            </div>
          </div>
        </div>

        {/* Floating Particles */}
        <div className="absolute -top-4 -left-4 w-1 h-1 bg-violet-400 rounded-full animate-bounce animation-delay-100 opacity-70"></div>
        <div className="absolute -top-6 right-8 w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce animation-delay-500 opacity-60"></div>
        <div className="absolute -bottom-2 -right-6 w-1 h-1 bg-purple-500 rounded-full animate-bounce animation-delay-700 opacity-50"></div>
      </div>

      {/* Loading Message */}
      {props.message && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 font-medium">{props.message}</p>
        </div>
      )}

      {/* Progress Bar */}
      {props.progress && (
        <div className="w-32 mt-8">
          <Progress value={props.progress} />
        </div>
      )}
    </div>
  );
}
