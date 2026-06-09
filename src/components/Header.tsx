import React from 'react';
import { Flame, Trophy, Star } from 'lucide-react';
import { MatchConfig } from '../types';

interface HeaderProps {
  matchConfig: MatchConfig;
}

export default function Header({ matchConfig }: HeaderProps) {
  return (
    <div className="relative overflow-hidden pt-6 pb-6 bg-brazil-green text-white shadow-lg border-b-4 border-brazil-blue">
      {/* Decorative light reflection or brazil flare */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-brazil-yellow/20 blur-3xl rounded-full" />
      <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-brazil-yellow rounded-full animate-ping" />
      
      {/* Sparkles / Embers animation elements */}
      <div className="absolute inset-x-0 bottom-0 h-16 pointer-events-none overflow-hidden">
        <span className="absolute bottom-1 left-1/4 w-1 h-1 bg-brazil-yellow rounded-full animate-amber" style={{ animationDelay: '0s' }} />
        <span className="absolute bottom-1 left-2/4 w-1 h-2 bg-amber-450 rounded-full animate-ember" style={{ animationDelay: '1.2s' }} />
        <span className="absolute bottom-1 left-3/4 w-1.5 h-1.5 bg-white rounded-full animate-ember" style={{ animationDelay: '2.5s' }} />
      </div>

      <div className="flex flex-col items-center text-center px-4 relative z-10">
        {/* Brand visual (Churrasco + Cup) */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex flex-col items-start leading-none text-left">
            <span className="text-[10px] tracking-[0.2em] font-black text-brazil-yellow uppercase font-display">CHURRASCO DA VITÓRIA</span>
            <span className="text-xl font-black uppercase tracking-tighter italic text-white font-display">
              Boutique das Carnes
            </span>
          </div>

          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-brazil-blue/45 border-2 border-brazil-yellow shadow-md select-none shrink-0">
            <Flame className="w-4.5 h-4.5 text-brazil-yellow animate-pulse" />
          </div>
        </div>

        {/* Campaign Banner Badge */}
        <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 bg-brazil-yellow text-brazil-blue font-black tracking-wider uppercase rounded-full text-[10px] shadow-sm font-display select-none">
          <span className="animate-pulse">⚽</span>
          BOLÃO MUNDIAL DA BOUTIQUE
        </div>

        {/* Dynamic Title */}
        <h1 className="mt-3 text-3xl font-black tracking-tighter leading-none uppercase italic font-display select-none">
          PLACAR <span className="text-brazil-yellow">PREMIADO</span>
        </h1>
        <p className="mt-2 text-xs text-white/90 max-w-sm px-4 leading-relaxed font-bold">
          Dê o seu palpite no jogo <span className="font-extrabold text-brazil-yellow">{matchConfig.team1Name} x {matchConfig.team2Name}</span>, siga no Instagram e gire para garantir prêmios deliciosos!
        </p>
      </div>
    </div>
  );
}
