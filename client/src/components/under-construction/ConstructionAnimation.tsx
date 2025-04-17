import { useEffect, useState } from "react";
import { Bot, Construction, Hammer, HardHat, Ruler, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import RobiIcon from "@/components/RobiIcon";

interface ConstructionAnimationProps {
  className?: string;
  title?: string;
  message?: string;
}

export default function ConstructionAnimation({
  className,
  title = "Under Construction",
  message = "This page is coming soon! Our team is working on it."
}: ConstructionAnimationProps) {
  const [animationStep, setAnimationStep] = useState(0);
  
  // Animation tools and their positions
  const tools = [
    { component: <HardHat className="text-yellow-500" />, position: "top-0 left-[20%] -rotate-12" },
    { component: <Wrench className="text-blue-500" />, position: "top-[15%] right-[25%] rotate-45" },
    { component: <Hammer className="text-red-500" />, position: "bottom-[20%] left-[25%] -rotate-12" },
    { component: <Ruler className="text-green-500" />, position: "bottom-[10%] right-[20%] rotate-90" },
    { component: <Construction className="text-primary" />, position: "bottom-[30%] left-[10%] rotate-12" },
  ];

  // Progress animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationStep((prev) => (prev + 1) % (tools.length + 1));
    }, 800);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-4">
          {title}
        </h2>
        <p className="text-gray-600 max-w-md">{message}</p>
      </div>
      
      {/* Construction animation container */}
      <div className="relative w-64 h-64 mb-8">
        {/* Circular progress track */}
        <div className="absolute inset-0 rounded-full border-4 border-dashed border-gray-200 animate-spin-slow"></div>
        
        {/* Center robot */}
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-slate-100 rounded-full p-4 animate-bounce-slow">
            <RobiIcon size={64} />
          </div>
        </div>
        
        {/* Tools animating in */}
        {tools.map((tool, index) => (
          <div 
            key={index}
            className={cn(
              "absolute w-10 h-10 flex items-center justify-center z-0 transition-all duration-500",
              tool.position,
              {
                "opacity-100 scale-100": animationStep >= index + 1,
                "opacity-0 scale-0": animationStep < index + 1
              }
            )}
          >
            {tool.component}
          </div>
        ))}
      </div>
      
      {/* Progress message */}
      <div className="text-center">
        <p className="text-gray-500 italic">
          Loading progress: {Math.min(100, Math.round((animationStep / tools.length) * 100))}%
        </p>
      </div>
    </div>
  );
}