import React from 'react';
import { Share2, Copy, Check, Ticket, Award, RefreshCw, Calendar, Flame } from 'lucide-react';
import { Prize, UserRegistration, MatchGuess, MatchConfig } from '../types';
import { STORE_PHONE_NUMBER } from '../data';

interface FinalResultProps {
  matchConfig: MatchConfig;
  user: UserRegistration;
  guess: MatchGuess;
  prize: Prize;
  onReset: () => void;
}

export default function FinalResult({ matchConfig, user, guess, prize, onReset }: FinalResultProps) {
  const [copied, setCopied] = React.useState(false);

  // Formatted whatsapp message with bold styling, spacings and emojis
  const formatWhatsappMessage = () => {
    const scorerLine = guess.firstGoalScorer ? `⚽️ *Autor do 1º Gol:* ${guess.firstGoalScorer}\n` : '';
    
    const text = `🥩 *BOUTIQUE DAS CARNES - BOLÃO DA COPA & CHURRASCO* 🇧🇷⚽️\n` +
      `-----------------------------------------\n` +
      `🔥 Acabei de dar meu palpite no Bolão Oficial de ${matchConfig.team1Name} x ${matchConfig.team2Name}!\n\n` +
      `👤 *Nome:* ${user.name}\n` +
      `📱 *WhatsApp:* ${user.phone}\n\n` +
      `⚽️ *Meu Palpite:* ${matchConfig.team1Name} ${guess.brazilScore} x ${guess.haitiScore} ${matchConfig.team2Name}\n` +
      scorerLine +
      `🎰 *Prêmio Sorteado:* ${prize.title}\n` +
      `🎟 *Código do Cupom:* ${prize.couponCode}\n` +
      `⚠️ *Atenção:* Retirada somente hoje, no dia do sorteio!\n` +
      `-----------------------------------------\n` +
      `Vou retirar meu brinde hoje mesmo e garantir os melhores cortes para assistir ao jogo! Torcendo por nós! 🍖🔥⚽`;
    
    return encodeURIComponent(text);
  };

  const handleSendWhatsapp = () => {
    const url = `https://api.whatsapp.com/send?text=${formatWhatsappMessage()}`;
    window.open(url, '_blank', 'noreferrer,noopener');
  };

  const codeString = prize.couponCode;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col flex-1 px-4 py-4 pb-8 bg-brazil-yellow/5">
      {/* Visual divider line */}
      <div className="relative mb-5 bg-gradient-to-r from-transparent via-brazil-blue/20 to-transparent h-1 w-full" />

      <div className="flex flex-col gap-5 flex-1">
        
        {/* Banner with Trophy & Success */}
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-brazil-green/10 flex items-center justify-center border-2 border-brazil-green mb-2">
            <Award className="w-6 h-6 text-brazil-green animate-bounce" />
          </div>
          <h2 className="text-2xl font-black font-display uppercase text-brazil-blue tracking-tight leading-none">
            PALPITE CONCLUÍDO!
          </h2>
          <p className="text-xs text-stone-600 font-bold mt-1">
            Seu palpite foi registrado com sucesso. Salve o seu cupom abaixo e envie pelo WhatsApp!
          </p>
        </div>

        {/* PHYSICAL TICKET VISUAL COUPON DOCK */}
        <div className="relative bg-white rounded-[2rem] border-4 border-brazil-green shadow-xl overflow-hidden mt-1 text-brazil-blue">
          
          {/* Aesthetic coupon cut-out notches on left and right borders */}
          <div className="absolute top-[45%] -left-3.5 w-7 h-7 bg-[#FFDC05] border-2 border-brazil-green rounded-full z-20" />
          <div className="absolute top-[45%] -right-3.5 w-7 h-7 bg-[#FFDC05] border-2 border-brazil-green rounded-full z-20" />

          {/* Top Section: Ticket Header */}
          <div className={`p-5 bg-gradient-to-br ${prize.bgGradient} text-white relative`}>
            {/* Gloss shine effect */}
            <div className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-widest text-white/90 font-black">
                CUPOM DO BOLÃO DA COPA
              </span>
              <span className="text-[9px] font-black font-mono bg-black/45 px-2.5 py-1 rounded-full text-brazil-yellow">
                ATIVAÇÃO IMEDIATA
              </span>
            </div>

            <h3 className="text-xl font-black font-display uppercase tracking-tight mt-3 text-white">
              {prize.title}
            </h3>
            <p className="text-xs text-white/90 font-semibold mt-1 leading-normal">
              {prize.description}
            </p>

            {/* Same-day pickup requirements */}
            {prize.id === 'FREE_BEER' ? (
              <div className="mt-3 bg-red-650 text-white text-[10px] font-black uppercase tracking-wider py-2 px-3 rounded-xl border border-white/20 flex items-center justify-center gap-1.5 shadow-md animate-pulse">
                🚨 RETIRADA HOJE OBRIGATORIAMENTE (No dia do sorteio!)
              </div>
            ) : prize.id !== 'TRY_AGAIN' ? (
              <div className="mt-3 bg-yellow-450 text-stone-950 text-[10px] font-black uppercase tracking-wider py-2 px-3 rounded-xl border border-white/20 flex items-center justify-center gap-1.5 shadow-md">
                ⚠️ RETIRADA IMPRESCINDÍVEL HOJE (No dia do sorteio!)
              </div>
            ) : null}
          </div>

          {/* Middle Section: Cut line */}
          <div className="relative h-4 bg-white border-b-2 border-dashed border-stone-200" />

          {/* Bottom Section: Customer Details & Coupon Code */}
          <div className="p-5 flex flex-col gap-4 text-left">
            <div>
              <span className="text-[9px] font-black text-stone-400 uppercase tracking-wider block">Garantido Para:</span>
              <span className="text-base font-black text-brazil-blue font-display block leading-none mt-0.5">{user.name}</span>
              <span className="text-xs text-stone-500 font-bold block mt-1">{user.phone}</span>
            </div>

            <div className="flex flex-col py-2.5 px-3.5 rounded-xl bg-stone-50 border-2 border-stone-150 gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Palpite Informado</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs">{matchConfig.team1Flag}</span>
                    <span className="text-xs font-black font-mono text-brazil-blue">
                      {guess.brazilScore} x {guess.haitiScore}
                    </span>
                    <span className="text-xs">{matchConfig.team2Flag}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-black text-stone-400 tracking-wider">Jogo Oficial</span>
                  <span className="text-xs font-black text-brazil-green block mt-0.5 truncate">{matchConfig.team1Name} vs {matchConfig.team2Name}</span>
                </div>
              </div>
              {guess.firstGoalScorer && (
                <div className="pt-1.5 border-t border-stone-200/80 flex items-center justify-between text-[10px]">
                  <span className="font-black text-stone-400 uppercase tracking-wider text-[8px]">Seu autor do 1º Gol:</span>
                  <span className="font-extrabold text-brazil-blue font-display">⚽ {guess.firstGoalScorer}</span>
                </div>
              )}
            </div>

            {/* BARCODE COUPON GRAPHIC */}
            <div className="flex flex-col items-center gap-2 mt-2 pt-2 border-t-2 border-stone-100">
              <span className="text-[10px] font-black text-stone-450 uppercase tracking-widest">CÓDIGO SECRETO</span>
              
              <div className="flex w-full items-center gap-2">
                <div className="flex-1 bg-stone-50 border-2 border-stone-200 py-3 text-center font-mono font-black text-bbq-red tracking-[0.25em] text-sm rounded-xl">
                  {codeString}
                </div>
                
                <button
                  type="button"
                  id="btn-copy-coupon"
                  onClick={copyToClipboard}
                  className="p-3 bg-stone-50 border-2 border-stone-200 hover:bg-stone-100 active:scale-95 text-brazil-blue rounded-xl transition cursor-pointer"
                  title="Copiar Código"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-600 animate-scale" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>

              {/* Decorative stamp line */}
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-brazil-green fill-brazil-green" />
                <span className="text-[9px] text-brazil-green font-black uppercase tracking-[0.1em]">
                  RETIRAR DIRETO HOJE (NO DIA DO SORTEIO) NA BOUTIQUE DAS CARNES
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Action Button: SEND ON WHATSAPP */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            type="button"
            id="btn-send-whatsapp"
            onClick={handleSendWhatsapp}
            className="w-full bg-[#25D366] hover:brightness-110 active:scale-[0.98] py-4 rounded-2xl font-black font-display text-white tracking-wide flex items-center justify-center gap-2 text-base shadow-lg cursor-pointer border-b-4 border-emerald-800 relative overflow-hidden uppercase"
          >
            {/* Shine highlight */}
            <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
            
            <Share2 className="w-5 h-5 stroke-[2.5]" />
            ENVIAR PALPITE PELO WHATSAPP
          </button>

          {/* Reset / Repalpit button */}
          <button
            type="button"
            id="btn-play-again"
            onClick={onReset}
            className="w-full bg-white hover:bg-stone-50 active:scale-[0.98] py-3.5 rounded-2xl font-bold font-display text-brazil-blue tracking-wide flex items-center justify-center gap-2 text-xs transition cursor-pointer border-2 border-stone-200"
          >
            <RefreshCw className="w-4 h-4" />
            REFAZER MEU PALPITE / NOVO CADASTRO
          </button>
        </div>

      </div>
    </div>
  );
}
