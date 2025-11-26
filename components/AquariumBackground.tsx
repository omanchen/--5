
import React, { useEffect, useState, useMemo } from 'react';

// Enhanced Goldfish with Gradients for a "Gorgeous" Look
const GoldfishSVG = ({ color, id, opacity = 0.9 }: { color: string, id: string | number, opacity?: number }) => (
  <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-2xl" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>
    <defs>
      <linearGradient id={`fish-grad-${id}`} x1="0%" y1="0%" x2="100%" y2="50%">
        <stop offset="0%" stopColor={color} stopOpacity={opacity} />
        <stop offset="40%" stopColor={color} stopOpacity={opacity * 0.9} />
        <stop offset="50%" stopColor="white" stopOpacity={opacity * 0.6} /> 
        <stop offset="60%" stopColor={color} stopOpacity={opacity * 0.9} />
        <stop offset="100%" stopColor={color} stopOpacity={opacity * 0.7} />
      </linearGradient>
    </defs>
    
    {/* Body with shiny gradient */}
    <path d="M75,30 Q65,10 35,15 T5,30 T35,45 T75,30 Z" fill={`url(#fish-grad-${id})`} />
    
    {/* Tail - Flowing and semi-transparent */}
    <path d="M75,30 Q85,10 98,2 T92,30 T98,58 Q85,50 75,30" fill={color} fillOpacity={opacity * 0.6} />
    
    {/* Fins - Delicate lines */}
    <path d="M40,15 Q45,2 55,8" fill="none" stroke={color} strokeWidth="2" opacity={opacity} />
    <path d="M40,45 Q45,58 55,52" fill="none" stroke={color} strokeWidth="2" opacity={opacity} />
    <path d="M50,30 Q55,30 60,30" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" opacity={0.5} />
    
    {/* Eye - Distinct */}
    <circle cx="20" cy="25" r="3.5" fill="black" opacity={opacity} />
    <circle cx="21" cy="24" r="1.5" fill="white" opacity={1} />
    
    {/* Sparkles / Scales */}
    <circle cx="30" cy="28" r="1" fill="white" opacity="0.6" />
    <circle cx="45" cy="32" r="1" fill="white" opacity="0.5" />
    <circle cx="60" cy="25" r="0.8" fill="white" opacity="0.4" />
  </svg>
);

// Expanded Vibrant Palette (Jewel Tones & Neon)
const VIBRANT_COLORS = [
  '#FF0000', // Bright Red
  '#FF8C00', // Dark Orange
  '#FFD700', // Gold
  '#ADFF2F', // Green Yellow
  '#00FA9A', // Medium Spring Green
  '#00FFFF', // Cyan
  '#1E90FF', // Dodger Blue
  '#9370DB', // Medium Purple
  '#FF1493', // Deep Pink
  '#FF69B4', // Hot Pink
  '#ffffff', // Silver/White
  '#FF4500', // Orange Red
];

interface FishData {
  id: number;
  color: string;
  top: number;      // % position from top
  size: number;     // pixel width
  duration: number; // seconds to cross screen
  delay: number;    // initial animation delay
  direction: 'left' | 'right';
  opacity: number;
  zIndex: number;
}

export const AquariumBackground: React.FC = () => {
  const [bubbles, setBubbles] = useState<Array<{ id: number; left: number; size: number; speed: number }>>([]);

  // Generate a school of fish only once on mount
  const schoolOfFish = useMemo(() => {
    const fish: FishData[] = [];
    const count = 15; // Increased count for "Colorful" feel
    
    for (let i = 0; i < count; i++) {
      const isRight = Math.random() > 0.5;
      const size = Math.random() * 90 + 50; // 50px to 140px (slightly larger)
      // Speed variation
      const duration = (Math.random() * 25 + 20) * (150 / size); 
      
      fish.push({
        id: i,
        color: VIBRANT_COLORS[Math.floor(Math.random() * VIBRANT_COLORS.length)],
        top: Math.random() * 85 + 5, // 5% to 90%
        size: size,
        duration: duration,
        delay: -Math.random() * duration, // Start at random point in animation
        direction: isRight ? 'right' : 'left',
        opacity: Math.random() * 0.3 + 0.7, // 0.7 to 1.0 (more visible)
        zIndex: Math.floor(size),
      });
    }
    return fish;
  }, []);

  // Generate bubbles occasionally
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(prev => {
        const newBubble = {
          id: Date.now(),
          left: Math.random() * 100,
          size: Math.random() * 10 + 2, // Varied sizes
          speed: Math.random() * 8 + 8,
        };
        // Keep last 20 bubbles
        return [...prev.slice(-19), newBubble];
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden">
      
      {/* 
        NEW: Dynamic Rainbow Gradient Background 
        Replacing the old dark ocean gradient with a vibrant 7-color animation.
      */}
      <div 
        className="absolute inset-0 animate-rainbow-bg bg-[length:600%_600%]"
        style={{
          backgroundImage: `linear-gradient(
            300deg, 
            #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8f00ff, 
            #ff0000
          )`
        }}
      />
      
      {/* Overlay for Water Texture - Keeping it subtle */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/water.png')] mix-blend-overlay"></div>
      
      {/* Additional Glow Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10 mix-blend-screen pointer-events-none"></div>

      {/* Moving Light Rays */}
      <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-[spin_120s_linear_infinite] opacity-20 pointer-events-none">
         <div className="w-full h-full bg-[conic-gradient(from_0deg,transparent_0deg,white_5deg,transparent_10deg,white_25deg,transparent_45deg)] filter blur-[80px]"></div>
      </div>

      {/* Bubbles - Increased opacity for visibility on bright bg */}
      {bubbles.map(b => (
        <div
          key={b.id}
          className="absolute rounded-full bg-white/30 backdrop-blur-[2px] border border-white/50"
          style={{
            left: `${b.left}%`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            bottom: '-50px',
            animation: `rise ${b.speed}s linear forwards`,
            boxShadow: 'inset 0 0 4px rgba(255,255,255,0.6)'
          }}
        />
      ))}

      {/* School of Colorful Fish */}
      {schoolOfFish.map((fish) => (
        <div 
          key={fish.id}
          className="absolute pointer-events-none"
          style={{
            top: `${fish.top}%`,
            width: `${fish.size}px`,
            left: fish.direction === 'right' ? '-200px' : '100%', 
            zIndex: fish.zIndex,
            opacity: fish.opacity,
            animation: `${fish.direction === 'right' ? 'swimRight' : 'swimLeft'} ${fish.duration}s linear infinite`,
            animationDelay: `${fish.delay}s`,
            filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.3))`
          }}
        >
          <GoldfishSVG color={fish.color} id={fish.id} opacity={fish.opacity} />
        </div>
      ))}

      {/* Seaweed / Plants Bottom - Darker silhouette for contrast against rainbow */}
      <div className="absolute bottom-0 w-full h-32 flex justify-around opacity-60 pointer-events-none">
         {[...Array(20)].map((_, i) => (
           <div 
             key={i} 
             className={`w-4 md:w-8 rounded-t-full origin-bottom animate-[sway_6s_ease-in-out_infinite] bg-gradient-to-t from-indigo-900 to-teal-800`}
             style={{ 
               height: `${Math.random() * 120 + 30}px`,
               animationDelay: `${Math.random() * 5}s`,
               animationDuration: `${Math.random() * 3 + 5}s`,
               transform: `scaleX(${Math.random() * 0.5 + 0.5})`
             }} 
           />
         ))}
      </div>

      <style>{`
        @keyframes rainbow-bg {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-rainbow-bg {
          animation: rainbow-bg 30s ease infinite;
        }
        @keyframes rise {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(-110vh) translateX(20px); opacity: 0; }
        }
        @keyframes swimRight {
          0% { transform: translateX(0) scaleX(1) translateY(0); }
          25% { transform: translateX(calc(25vw + 100px)) scaleX(1) translateY(20px); }
          75% { transform: translateX(calc(75vw + 300px)) scaleX(1) translateY(-20px); }
          100% { transform: translateX(calc(100vw + 400px)) scaleX(1) translateY(0); }
        }
        @keyframes swimLeft {
          0% { transform: translateX(0) scaleX(-1) translateY(0); }
          25% { transform: translateX(calc(-25vw - 100px)) scaleX(-1) translateY(-20px); }
          75% { transform: translateX(calc(-75vw - 300px)) scaleX(-1) translateY(20px); }
          100% { transform: translateX(calc(-100vw - 400px)) scaleX(-1) translateY(0); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-5deg); }
          50% { transform: rotate(5deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
