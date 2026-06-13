import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Zap, RotateCcw } from 'lucide-react';
import { PRIZES } from '../data';
import { Prize } from '../types';

interface WheelOfFortuneProps {
  onSpinComplete: (prize: Prize) => void;
}

// Light synthesizer for mechanical physical click ticks of the wheel pointer
function playTickSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {
    // Safe ignore if auto-play constraint blocks audio
  }
}

export default function WheelOfFortune({ onSpinComplete }: WheelOfFortuneProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);

  // References for animation
  const requestRef = useRef<number | null>(null);

  // Clean-up animation on unmount
  useEffect(() => {
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  const startSpin = () => {
    if (isSpinning || hasSpun) return;
    
    setIsSpinning(true);
    
    // Balanced premium marketing weights matching index entries in data.ts
    // 0 -> Free Beer
    // 1 -> 10% OFF
    // 2 -> 15% OFF
    // 3 -> Free Shipping
    // 4 -> Surprise Gift
    // 5 -> Try Again
    const rand = Math.random() * 100;
    let chosenIdx = 5; // Default Try Again
    
    if (rand < 22) {
      chosenIdx = 0; // Free Beer (22%)
    } else if (rand < 47) {
      chosenIdx = 1; // 10% OFF (25%)
    } else if (rand < 62) {
      chosenIdx = 2; // 15% OFF (15%)
    } else if (rand < 77) {
      chosenIdx = 3; // Free Shipping (15%)
    } else if (rand < 92) {
      chosenIdx = 4; // Surprise Gift (15%)
    } else {
      chosenIdx = 5; // Try Again (8%)
    }

    const prize = PRIZES[chosenIdx];
    setSelectedPrize(prize);

    // Exact mathematical rotation formula
    // Segment 'idx' center is located at (idx * 60 + 300) degrees in Cartesian space.
    // To align this center with the static vertical TOP pointer needle, 
    // the required clockwise rotation target is segment stop angle:
    const targetBaseStopAngle = 330 - chosenIdx * 60;

    // Spin at least 7 complete loops (2520 degrees) to build speed and ultimate tension
    const baseRotation = rotationDegrees - (rotationDegrees % 360);
    const finalStopDegrees = baseRotation + 360 * 7 + targetBaseStopAngle;

    setRotationDegrees(finalStopDegrees);

    // Dynamic mechanical tick sound fx matching physical deceleration speeds
    let elapsed = 0;
    let nextTickInterval = 35; // initial high speed ticks
    
    const playDeceleratingTicks = () => {
      if (elapsed > 5800) return; // cut ticks off when wheel nearly stops
      playTickSound();
      
      elapsed += nextTickInterval;
      nextTickInterval = 35 + Math.pow(elapsed / 680, 3.1); // exponential slowing spacing
      
      setTimeout(playDeceleratingTicks, nextTickInterval);
    };
    
    playDeceleratingTicks();

    // Settle perfectly at exactly 6.5s (transition matches timeline)
    setTimeout(() => {
      setIsSpinning(false);
      setHasSpun(true);
      
      // Highlight the result and advance to show coupon
      setTimeout(() => {
        onSpinComplete(prize);
      }, 1600);
    }, 6500);
  };

  return (
    <div className="flex flex-col flex-1 px-4 py-4 pb-8 items-center justify-center bg-brazil-yellow/5">
      {/* Visual top design bar */}
      <div className="relative mb-5 bg-gradient-to-r from-transparent via-brazil-blue/20 to-transparent h-1 w-full" />

      {/* Step Tracker */}
      <div className="flex items-center justify-between w-full px-1 mb-5">
        <span className="text-xs font-black text-brazil-blue font-mono">PASSO 3 DE 3</span>
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-2 rounded-full bg-brazil-green" />
          <div className="w-10 h-2 rounded-full bg-brazil-green" />
          <div className="w-10 h-2 rounded-full bg-brazil-blue animate-pulse" />
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-black uppercase text-brazil-blue tracking-tight font-display">
          ROLETA PREMIUM CHURRASCO 🎰
        </h2>
        <p className="text-xs text-stone-600 font-semibold mt-1 max-w-sm mx-auto leading-relaxed">
          Tudo validado! Agora é a hora da verdade. Toque no botão central <strong className="text-bbq-red font-black">GIRAR!</strong> para rodar a roleta da Boutique e garantir seu prêmio! 🥩🔥
        </p>
      </div>

      {/* THE ROULETTE STAGE CONTAINER */}
      <div className="relative w-80 h-80 flex items-center justify-center my-2 select-none">
        {/* Soft magical glow underlayer */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-amber-500/30 via-emerald-500/20 to-blue-500/20 blur-2xl animate-pulse" />
        
        {/* Outer casing brass ring border */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-600 via-amber-400 to-yellow-700 shadow-2xl p-2.5 flex items-center justify-center relative">
          
          {/* Inner dark carbon fiber backing layer */}
          <div className="absolute inset-1.5 rounded-full bg-zinc-900 border-4 border-yellow-500/40" />

          {/* Glowing Retro LED bulb beads around the metal frame */}
          {[...Array(16)].map((_, i) => {
            const angleDeg = i * (360 / 16);
            const style = {
              transform: `rotate(${angleDeg}deg) translateY(-145px)`,
            };
            return (
              <span
                key={i}
                className={`absolute w-2 h-2 rounded-full border border-white/50 shadow-md transition-colors duration-200 ${
                  isSpinning 
                    ? i % 2 === Math.floor(Date.now() / 200) % 2 
                      ? 'bg-yellow-400 shadow-[0_0_8px_#fa4]' 
                      : 'bg-emerald-400 shadow-[0_0_5px_#2e4]'
                    : 'bg-yellow-400 shadow-sm'
                }`}
                style={style}
              />
            );
          })}

          {/* SVG VECTOR ROULETTE WHEEL */}
          <svg
            id="roulette-svg-wheel"
            className="w-[268px] h-[268px] rounded-full overflow-hidden select-none bg-zinc-800"
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
              // Persistent transition to eliminate glitchy snap-backs or micro-stutters
              transition: 'transform 6.5s cubic-bezier(0.18, 0.85, 0.22, 1)',
              willChange: 'transform',
            }}
            viewBox="0 0 200 200"
          >
            <g transform="translate(100, 100)">
              {/* SEGMENT 0: Cerveja (0° to 60°) */}
              <path
                d="M 0,0 L 0,-100 A 100,100 0 0,1 86.6,-50 Z"
                fill="url(#orange-gradient)"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* SEGMENT 1: 10% OFF (60° to 120°) */}
              <path
                d="M 0,0 L 86.6,-50 A 100,100 0 0,1 86.6,50 Z"
                fill="url(#gold-gradient)"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* SEGMENT 2: 15% OFF (120° to 180°) */}
              <path
                d="M 0,0 L 86.6,50 A 100,100 0 0,1 0,100 Z"
                fill="url(#red-gradient)"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* SEGMENT 3: Entrega Grátis (180° to 240°) */}
              <path
                d="M 0,0 L 0,100 A 100,100 0 0,1 -86.6,50 Z"
                fill="url(#blue-gradient)"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* SEGMENT 4: Presente Surpresa (240° to 300°) */}
              <path
                d="M 0,0 L -86.6,50 A 100,100 0 0,1 -86.6,-50 Z"
                fill="url(#green-gradient)"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
              {/* SEGMENT 5: Try Again / Re-Spin (300° to 360°) */}
              <path
                d="M 0,0 L -86.6,-50 A 100,100 0 0,1 0,-100 Z"
                fill="url(#gray-gradient)"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />

              {/* RADIAL TYPOGRAPHY WRITING (POLISHED OUTWARD ALIGNMENT) */}
              
              {/* Segment 0: Cerveja */}
              <g transform="rotate(300)">
                <text
                  x="56"
                  y="0"
                  className="fill-white font-black text-[9px] font-sans uppercase tracking-widest text-center"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform="rotate(90, 56, 0)"
                >
                  CERVEJA 🍺
                </text>
              </g>

              {/* Segment 1: 10% OFF */}
              <g transform="rotate(0)">
                <text
                  x="56"
                  y="0"
                  className="fill-brazil-blue font-black text-[9px] font-sans uppercase tracking-widest text-center"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform="rotate(90, 56, 0)"
                >
                  10% OFF 🥩
                </text>
              </g>

              {/* Segment 2: 15% OFF */}
              <g transform="rotate(60)">
                <text
                  x="56"
                  y="0"
                  className="fill-white font-black text-[9px] font-sans uppercase tracking-widest text-center"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform="rotate(90, 56, 0)"
                >
                  15% OFF 🔥
                </text>
              </g>

              {/* Segment 3: Entrega */}
              <g transform="rotate(120)">
                <text
                  x="56"
                  y="0"
                  className="fill-white font-black text-[9px] font-sans uppercase tracking-widest text-center"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform="rotate(90, 56, 0)"
                >
                  ENTREGA 🛵
                </text>
              </g>

              {/* Segment 4: Brinde */}
              <g transform="rotate(180)">
                <text
                  x="56"
                  y="0"
                  className="fill-white font-black text-[8.5px] font-sans uppercase tracking-widest text-center"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform="rotate(90, 56, 0)"
                >
                  BRINDE 🎁
                </text>
              </g>

              {/* Segment 5: Quase lá */}
              <g transform="rotate(240)">
                <text
                  x="56"
                  y="0"
                  className="fill-white font-black text-[8.5px] font-sans uppercase tracking-widest text-center"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform="rotate(90, 56, 0)"
                >
                  QUASE LÁ 😢
                </text>
              </g>
            </g>

            {/* Premium Vibrant Color Gradients Defs */}
            <defs>
              <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="#FFF280" />
                 <stop offset="50%" stopColor="#FCD34D" />
                 <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#C2410C" />
              </linearGradient>
              <linearGradient id="red-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#B91C1C" />
              </linearGradient>
              <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
              <linearGradient id="green-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="gray-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A8A29E" />
                <stop offset="100%" stopColor="#44403C" />
              </linearGradient>
            </defs>
          </svg>

          {/* Absolute TOP Pin Needle Indicator */}
          <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
            {/* Physical Metallic Golden Arrow Pointer Indicator */}
            <div className="w-6 h-9 bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-600 rounded-b-xl shadow-2xl border-2 border-white pointer-events-none relative flex justify-center">
              <div className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-white shadow animate-ping" />
            </div>
            {/* Golden Core button cover */}
            <div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-white/70 shadow mt-[-6px]" />
          </div>

          {/* Central Spin Button: GIRAR */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <button
              id="btn-spin-wheel"
              type="button"
              disabled={isSpinning || hasSpun}
              onClick={startSpin}
              className={`w-18 h-18 rounded-full flex flex-col items-center justify-center font-black text-xs font-display border-4 border-white shadow-2xl transition-all duration-150 relative ${
                isSpinning 
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed scale-95 shadow-inner'
                  : hasSpun
                    ? 'bg-stone-100 text-stone-300 scale-95 shadow-inner'
                    : 'bg-gradient-to-br from-red-500 via-red-650 to-red-800 hover:scale-105 active:scale-95 text-white animate-pulse cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.5)]'
              }`}
            >
              {isSpinning ? (
                <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mb-0.5" />
                  <span>GIRAR</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Dynamic Sorteio Banner with state check */}
      <div className="h-10 mt-3 flex items-center justify-center">
        {isSpinning ? (
          <div className="flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-tight animate-pulse">
            <div className="w-2 h-2 rounded-full bg-bbq-red animate-ping shrink-0" />
            <span>Sorteando carne nobre... Torça pelo prêmio máximo!</span>
          </div>
        ) : selectedPrize && hasSpun ? (
          <div className="p-2.5 px-6 rounded-full bg-white border-2 border-brazil-green text-xs font-black text-brazil-blue animate-bounce font-display flex items-center gap-2 shadow-lg font-sans">
            🎯 GANHOU: {selectedPrize.title}
          </div>
        ) : (
          <p className="text-[11px] text-stone-500 font-bold italic">
            Toque em GIRAR para rodar a roleta da Boutique!
          </p>
        )}
      </div>

      {/* Rules Notice */}
      <div className="mt-4 p-4 bg-white rounded-2xl border-2 border-brazil-blue/10 flex items-start gap-2.5 max-w-sm w-full">
        <Zap className="w-4 h-4 text-brazil-green shrink-0 mt-0.5 fill-brazil-yellow" />
        <p className="text-[11px] text-stone-605 font-bold leading-normal text-left">
          *Regulamento: Válido 1 sorteio por telefone cadastrado. O prêmio deve ser retirado diretamente na loja física apresentando o comprovante via WhatsApp.
        </p>
      </div>

    </div>
  );
}
