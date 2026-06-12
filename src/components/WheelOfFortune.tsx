import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Zap, RotateCcw, AlertCircle } from 'lucide-react';
import { PRIZES } from '../data';
import { Prize, PrizeId } from '../types';

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
    // Audio context not allowed or not supported yet (safe ignore)
  }
}

export default function WheelOfFortune({ onSpinComplete }: WheelOfFortuneProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);

  // References for animation
  const requestRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(-1);

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
    
    // Slices:
    // 0 -> Free Beer [Orange]
    // 1 -> 10% OFF [Gold]
    // 2 -> 15% OFF [Red]
    // 3 -> Free Shipping [Blue]
    // 4 -> Surprise Gift [Green]
    // 5 -> Try Again [Gray]
    const listCount = PRIZES.length;
    
    // Balanced premium marketing weights
    const rand = Math.random() * 100;
    let chosenIdx = 5; // Default: Try Again (10% chance)
    
    if (rand < 20) {
      chosenIdx = 0; // Free Beer (20%)
    } else if (rand < 45) {
      chosenIdx = 1; // 10% OFF (25%)
    } else if (rand < 60) {
      chosenIdx = 2; // 15% OFF (15%)
    } else if (rand < 75) {
      chosenIdx = 3; // Free Shipping (15%)
    } else if (rand < 90) {
      chosenIdx = 4; // Surprise Gift (15%)
    } else {
      chosenIdx = 5; // Try Again (10%)
    }

    const prize = PRIZES[chosenIdx];
    setSelectedPrize(prize);

    // Mathematics of stopping angle for 6 segments (60 degrees each)
    // Segment 'idx' is visually centered at angle: idx * 60 + 30 degrees.
    // To align this center with the TOP needle, we rotate the circle by:
    // Target stop angle = 360 - (idx * 60 + 30)
    const segmentAngleCenter = chosenIdx * 60 + 30;
    const targetBaseStopAngle = (360 - segmentAngleCenter) % 360;

    // Spin multiple full loops first (e.g. 5 full spins = 1800 degrees) to give maximum tension and speed.
    const baseRotation = rotationDegrees - (rotationDegrees % 360);
    const finalStopDegrees = baseRotation + 360 * 6 + targetBaseStopAngle;

    setRotationDegrees(finalStopDegrees);

    // Audio click ticks that slow down mimicking the visual speed
    let elapsed = 0;
    let nextTickInterval = 35; // start fast
    
    const playDeceleratingTicks = () => {
      // stop ticks near the end
      if (elapsed > 5400) return;
      playTickSound();
      
      elapsed += nextTickInterval;
      nextTickInterval = 35 + Math.pow(elapsed / 700, 3.2); // exponentially gets farther apart
      
      setTimeout(playDeceleratingTicks, nextTickInterval);
    };
    
    playDeceleratingTicks();

    // Trigger complete state after transition (6000ms duration)
    setTimeout(() => {
      setIsSpinning(false);
      setHasSpun(true);
      
      // Notify step completion after a neat suspense pause
      setTimeout(() => {
        onSpinComplete(prize);
      }, 1200);
    }, 6000);
  };

  return (
    <div className="flex flex-col flex-1 px-4 py-4 pb-8 items-center justify-center bg-brazil-yellow/5">
      {/* Visual divider */}
      <div className="relative mb-5 bg-gradient-to-r from-transparent via-brazil-blue/20 to-transparent h-1 w-full" />

      {/* Step Tracker */}
      <div className="flex items-center justify-between w-full px-1 mb-5">
        <span className="text-xs font-black text-brazil-blue font-mono">PASSO 3 DE 3</span>
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-2 rounded-full bg-brazil-green" />
          <div className="w-10 h-2 rounded-full bg-brazil-green" />
          <div className="w-10 h-2 rounded-full bg-brazil-blue" />
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-black uppercase text-brazil-blue tracking-tight font-display">
          ROLETA PREMIUM CHURRASCO 🎰
        </h2>
        <p className="text-xs text-stone-600 font-semibold mt-1 max-w-xs mx-auto">
          Toque no botão central <span className="font-extrabold text-bbq-red">GIRAR</span> para rodar a roleta da Boutique e sortear o seu prêmio instantâneo!
        </p>
      </div>

      {/* THE ROULETTE STAGE CONTAINER */}
      <div className="relative w-72 h-72 flex items-center justify-center my-4">
        {/* Outer glowing frame rings of the roulette */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brazil-yellow/40 via-brazil-green/20 to-brazil-blue/30 blur-2xl animate-pulse" />
        
        {/* Premium Gold Ribbed Border Container */}
        <div className="absolute inset-0 rounded-full border-4 border-brazil-blue bg-white shadow-2xl flex items-center justify-center relative">
          
          {/* Glowing Little LEDs bulbs embedded around the outer rim */}
          {[...Array(12)].map((_, i) => {
            const angleDeg = i * 30;
            const style = {
              transform: `rotate(${angleDeg}deg) translateY(-140px)`,
            };
            return (
              <span
                key={i}
                className={`absolute w-1.5 h-1.5 rounded-full ${
                  isSpinning 
                    ? i % 2 === 0 ? 'bg-brazil-yellow animate-ping' : 'bg-brazil-green'
                    : 'bg-brazil-blue'
                }`}
                style={style}
              />
            );
          })}

          {/* SVG VECTOR ROULETTE WHEEL */}
          <svg
            id="roulette-svg-wheel"
            className="w-[264px] h-[264px] rounded-full overflow-hidden"
            style={{
              transform: `rotate(${rotationDegrees}deg)`,
              transition: isSpinning ? 'transform 6s cubic-bezier(0.15, 0.85, 0.2, 1)' : 'none',
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
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* SEGMENT 1: 10% OFF (60° to 120°) */}
              <path
                d="M 0,0 L 86.6,-50 A 100,100 0 0,1 86.6,50 Z"
                fill="url(#gold-gradient)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* SEGMENT 2: 15% OFF (120° to 180°) */}
              <path
                d="M 0,0 L 86.6,50 A 100,100 0 0,1 0,100 Z"
                fill="url(#red-gradient)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* SEGMENT 3: Entrega Grátis (180° to 240°) */}
              <path
                d="M 0,0 L 0,100 A 100,100 0 0,1 -86.6,50 Z"
                fill="url(#blue-gradient)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* SEGMENT 4: Presente Surpresa (240° to 300°) */}
              <path
                d="M 0,0 L -86.6,50 A 100,100 0 0,1 -86.6,-50 Z"
                fill="url(#green-gradient)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* SEGMENT 5: Try Again (300° to 360°) */}
              <path
                d="M 0,0 L -86.6,-50 A 100,100 0 0,1 0,-100 Z"
                fill="url(#gray-gradient)"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />

              {/* Decorative slice labels rotated at segment centers: 300° (Segment 0), 0° (Segment 1), 60° (Segment 2), 120° (Segment 3), 180° (Segment 4), 240° (Segment 5) */}
              
              {/* Segment 0 text: Cerveja */}
              <g transform="rotate(300)">
                <text
                  x="52"
                  y="4"
                  className="fill-white font-extrabold text-[9px] font-sans uppercase tracking-wider text-center"
                  textAnchor="middle"
                  transform="rotate(90, 52, 0)"
                >
                  CERVEJA 🍺
                </text>
              </g>

              {/* Segment 1 text: 10% OFF */}
              <g transform="rotate(0)">
                <text
                  x="52"
                  y="4"
                  className="fill-brazil-blue font-extrabold text-[9px] font-sans uppercase tracking-wider text-center"
                  textAnchor="middle"
                  transform="rotate(90, 52, 0)"
                >
                  10% OFF 🥩
                </text>
              </g>

              {/* Segment 2 text: 15% OFF */}
              <g transform="rotate(60)">
                <text
                  x="52"
                  y="4"
                  className="fill-white font-extrabold text-[9px] font-sans uppercase tracking-wider text-center"
                  textAnchor="middle"
                  transform="rotate(90, 52, 0)"
                >
                  15% OFF 🔥
                </text>
              </g>

              {/* Segment 3 text: Entrega */}
              <g transform="rotate(120)">
                <text
                  x="52"
                  y="4"
                  className="fill-white font-extrabold text-[9px] font-sans uppercase tracking-wider text-center"
                  textAnchor="middle"
                  transform="rotate(90, 52, 0)"
                >
                  ENTREGA 🛵
                </text>
              </g>

              {/* Segment 4 text: Brinde */}
              <g transform="rotate(180)">
                <text
                  x="52"
                  y="4"
                  className="fill-white font-extrabold text-[8.5px] font-sans uppercase tracking-wider text-center"
                  textAnchor="middle"
                  transform="rotate(90, 52, 0)"
                >
                  BRINDE 🎁
                </text>
              </g>

              {/* Segment 5 text: Quase lá */}
              <g transform="rotate(240)">
                <text
                  x="52"
                  y="4"
                  className="fill-white font-extrabold text-[8.5px] font-sans uppercase tracking-wider text-center"
                  textAnchor="middle"
                  transform="rotate(90, 52, 0)"
                >
                  QUASE LÁ 😢
                </text>
              </g>
            </g>

            {/* Premium Gradients Definition inside the SVG view box */}
            <defs>
              <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fcde67" />
                 <stop offset="50%" stopColor="#FFDC05" />
                 <stop offset="100%" stopColor="#d29d00" />
              </linearGradient>
              <linearGradient id="orange-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff7e40" />
                <stop offset="100%" stopColor="#e24a00" />
              </linearGradient>
              <linearGradient id="red-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#9B1B1B" />
              </linearGradient>
              <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#012169" />
              </linearGradient>
              <linearGradient id="green-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1ebd5b" />
                <stop offset="100%" stopColor="#009739" />
              </linearGradient>
              <linearGradient id="gray-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#78716c" />
                <stop offset="100%" stopColor="#292524" />
              </linearGradient>
            </defs>
          </svg>

          {/* Golden Pointer needle indicator pin pointing at the very top */}
          <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
            {/* The physical arrow pointer */}
            <div className="w-5 h-7 bg-brazil-yellow rounded-b-full shadow-lg border-2 border-brazil-blue pointer-events-none relative flex justify-center">
              <div className="absolute top-1 w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
            {/* Tiny screw top accent */}
            <div className="w-3 h-3 rounded-full bg-brazil-blue border border-white mt-[-4px]" />
          </div>

          {/* Central Button: GIRAR */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <button
              id="btn-spin-wheel"
              type="button"
              disabled={isSpinning || hasSpun}
              onClick={startSpin}
              className={`w-18 h-18 rounded-full flex flex-col items-center justify-center font-black text-xs font-display border-4 border-brazil-blue shadow-xl transition-all ${
                isSpinning 
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed scale-95'
                  : hasSpun
                    ? 'bg-stone-50 text-stone-300 scale-95'
                    : 'bg-bbq-red hover:scale-105 active:scale-95 text-white animate-pulse cursor-pointer'
              }`}
            >
              {isSpinning ? (
                <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mb-0.5 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>GIRAR!</span>
                </>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Helper text display of prize during calculation */}
      <div className="h-10 mt-2 flex items-center justify-center">
        {isSpinning ? (
          <div className="flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-tight">
            <div className="w-1.5 h-1.5 rounded-full bg-bbq-red animate-ping" />
            <span>Sorteando carne nobre... Torça pelo prêmio máximo!</span>
          </div>
        ) : selectedPrize && hasSpun ? (
          <div className="p-2.5 px-5 rounded-full bg-white border-2 border-brazil-green text-xs font-black text-brazil-blue animate-bounce font-display flex items-center gap-1.5 shadow-md font-sans">
            🎯 GANHOU: {selectedPrize.title}
          </div>
        ) : (
          <p className="text-[11px] text-stone-500 font-bold italic">
            Clique no botão acima para rodar a roleta.
          </p>
        )}
      </div>

      {/* Rules Notice */}
      <div className="mt-4 p-4 bg-white rounded-2xl border-2 border-brazil-blue/10 flex items-start gap-2.5 max-w-sm w-full">
        <Zap className="w-4 h-4 text-brazil-green shrink-0 mt-0.5 fill-brazil-yellow" />
        <p className="text-[11px] text-stone-600 font-bold leading-normal">
          *Regulamento: Válido 1 sorteio por telefone cadastrado. O prêmio deve ser retirado diretamente na loja física apresentando o comprovante via WhatsApp.
        </p>
      </div>

    </div>
  );
}
