import React, { useState } from 'react';
import { Instagram, CheckCircle, ShieldCheck, ArrowRight, UserPlus, Flame } from 'lucide-react';
import { INSTAGRAM_HANDLE } from '../data';

interface InstagramUnlockProps {
  onUnlock: () => void;
  userName: string;
}

export default function InstagramUnlock({ onUnlock, userName }: InstagramUnlockProps) {
  const [clickedFollow, setClickedFollow] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [fullyUnlocked, setFullyUnlocked] = useState(false);

  const handleFollowClick = () => {
    setClickedFollow(true);
    setIsVerifying(true);
    
    // Simulate a premium verification countdown of 1.5 seconds
    // to give the user a robust feeling of system precision.
    setTimeout(() => {
      setIsVerifying(false);
      setFullyUnlocked(true);
    }, 1500);

    // Open Instagram handle link. Use standard web prefix.
    window.open(`https://www.instagram.com/${INSTAGRAM_HANDLE}`, '_blank');
  };

  return (
    <div className="flex flex-col flex-1 px-4 py-4 pb-8 bg-brazil-yellow/5">
      {/* Visual divider line */}
      <div className="relative mb-5 bg-gradient-to-r from-transparent via-brazil-blue/20 to-transparent h-1 w-full" />

      {/* Step Header */}
      <div className="flex items-center justify-between px-1 mb-4">
        <span className="text-xs font-black text-brazil-blue font-mono">PASSO 2 DE 3</span>
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-2 rounded-full bg-brazil-green" />
          <div className="w-10 h-2 rounded-full bg-brazil-blue" />
          <div className="w-10 h-2 rounded-full bg-stone-300" />
        </div>
      </div>

      <div className="flex flex-col gap-5 flex-1 items-center justify-center">
        
        {/* Welcome Message */}
        <div className="text-center">
          <span className="text-xs text-bbq-red uppercase font-mono font-black tracking-wider">
            Olá, {userName}! 👋
          </span>
          <h2 className="text-xl font-black uppercase font-display tracking-tight leading-none text-brazil-blue mt-1">
            Siga-nos para Liberar a Roleta
          </h2>
          <p className="text-xs text-stone-600 font-semibold mt-1 max-w-xs mx-auto">
            A roleta premiadora contém prêmios gourmet exclusivos. Siga o perfil da nossa boutique para validar sua participação!
          </p>
        </div>

        {/* Mock Instagram Feed Card with white deck template styling */}
        <div className="relative w-full max-w-sm bg-white border-4 border-brazil-green rounded-[2rem] overflow-hidden p-6 shadow-2xl text-brazil-blue">
          {/* Subtle warm decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-500/10 to-purple-500/5 blur-2xl rounded-full" />
          
          {/* Social Header */}
          <div className="flex items-center gap-4 relative z-10 text-left">
            {/* Mascot Avatar with Stories Gradient Border */}
            <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 shrink-0">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border-2 border-white overflow-hidden">
                <div className="w-full h-full bg-brazil-blue flex items-center justify-center font-black text-white text-lg">BC</div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-0.5 rounded-full border-2 border-white">
                <ShieldCheck className="w-3.5 h-3.5 fill-blue-500 text-white" />
              </div>
            </div>

            {/* Profile Statistics */}
            <div className="flex flex-col py-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black font-display text-brazil-blue tracking-tight">
                  boutiquedascarnes
                </span>
              </div>
              <span className="text-[10px] text-stone-500 font-bold">🔥 Boutique das Carnes Premium</span>
              
              <div className="flex gap-4 mt-1.5">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-brazil-blue font-mono leading-none">14.8k</span>
                  <span className="text-[9px] text-stone-400 uppercase tracking-tight font-bold">Seguidores</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-brazil-blue font-mono leading-none">4.9/5</span>
                  <span className="text-[9px] text-stone-400 uppercase tracking-tight font-bold font-mono">Avaliação</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bio Snippet */}
          <div className="mt-4 pt-3 border-t-2 border-stone-100 text-[11px] text-stone-600 font-medium relative z-10 leading-relaxed text-left">
            📍 <span className="font-extrabold text-brazil-blue">Boutique & Parrilla</span> • Os melhores cortes nobres de grelha da região, agora em clima de Copa do Mundo! 🥩⚽️🔥
          </div>

          {/* Animated Stories Badges Row */}
          <div className="mt-4 flex gap-3.5 justify-start overflow-x-auto pb-1 relative z-10 scrollbar-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-9 h-9 rounded-full border-2 border-stone-100 bg-stone-50 flex items-center justify-center text-base filter drop-shadow-sm">⚽️</div>
              <span className="text-[9px] text-stone-500 font-bold scale-90">Copa</span>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-9 h-9 rounded-full border-2 border-stone-100 bg-stone-50 flex items-center justify-center text-base filter drop-shadow-sm">🥩</div>
              <span className="text-[9px] text-stone-500 font-bold scale-90">Cortes</span>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-9 h-9 rounded-full border-2 border-stone-100 bg-stone-55 flex items-center justify-center text-base filter drop-shadow-sm">🍺</div>
              <span className="text-[9px] text-stone-500 font-bold scale-90">Chopp</span>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-9 h-9 rounded-full border-2 border-stone-100 bg-stone-50 flex items-center justify-center text-base filter drop-shadow-sm">👨‍🍳</div>
              <span className="text-[9px] text-stone-500 font-bold scale-90">Reviews</span>
            </div>
          </div>

          {/* FOLLOW BUTTON ACTION */}
          <div className="mt-5 relative z-10">
            {fullyUnlocked ? (
              <div className="flex items-center gap-2 justify-center p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600 fill-white" />
                <span className="text-[11px] font-black text-emerald-700">Você já está seguindo nossa página!</span>
              </div>
            ) : isVerifying ? (
              <button
                type="button"
                disabled
                className="w-full bg-stone-50 border-2 border-stone-200 text-stone-400 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black"
              >
                <div className="w-3.5 h-3.5 border-2 border-stone-300 border-t-brazil-blue rounded-full animate-spin" />
                VALIDANDO SEU CLIQUE NO INSTAGRAM...
              </button>
            ) : (
              <button
                type="button"
                id="btn-instagram-follow"
                onClick={handleFollowClick}
                className="w-full bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] hover:brightness-110 active:scale-95 text-white py-3 rounded-xl font-black text-xs tracking-wide flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-pink-600/10"
              >
                <Instagram className="w-4.5 h-4.5" />
                SEGUIR NO INSTAGRAM
                <UserPlus className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic bottom call to action once seguido is active */}
        {fullyUnlocked && (
          <div className="w-full max-w-sm mt-3 animate-bounce">
            <button
              type="button"
              id="btn-instagram-unlock"
              onClick={onUnlock}
              className="w-full bg-bbq-red hover:brightness-110 active:scale-[0.98] py-4 rounded-2xl font-black tracking-wide text-white font-display flex items-center justify-center gap-2 text-sm shadow-xl cursor-pointer border-b-4 border-red-950 uppercase"
            >
              LIBERAR MINHA ROLETA AGORA
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        )}

        {!fullyUnlocked && (
          <div className="mt-3 px-4 py-2.5 bg-white border-2 border-red-200 rounded-2xl text-[10px] text-stone-500 font-bold text-center max-w-xs leading-relaxed">
            ⚠️ <span className="text-bbq-red font-black">OBRIGATÓRIO:</span> Você é obrigado a clicar em "SEGUIR NO INSTAGRAM" para validar seu palpite! A liberação da roleta só ocorre após a validação do clique.
          </div>
        )}
      </div>
    </div>
  );
}
