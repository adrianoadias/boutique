import React, { useState } from 'react';
import { CheckCircle, ArrowRight, Share2, AlertTriangle, Eye, Send, Award, Instagram } from 'lucide-react';
import { getLoadedMatches } from '../data';
import { UserRegistration, MatchGuess, MatchConfig } from '../types';

interface InstagramUnlockProps {
  onUnlock: () => void;
  user: UserRegistration;
  guess: MatchGuess;
  matchConfig: MatchConfig;
}

export default function InstagramUnlock({ onUnlock, user, guess, matchConfig }: InstagramUnlockProps) {
  const [hasFollowed, setHasFollowed] = useState(false);
  const [hasSent, setHasSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Formatted whatsapp message with bold styling, spacings and emojis
  const formatWhatsappMessage = () => {
    let predictionsText = '';
    if (guess.predictions && guess.predictions.length > 0) {
      const matches = getLoadedMatches();
      guess.predictions.forEach(p => {
        const matchInfo = matches.find(m => m.id === p.matchId) || matchConfig;
        predictionsText += `• ${matchInfo.team1Name} ${p.team1Score} x ${p.team2Score} ${matchInfo.team2Name}`;
        if (p.firstGoalScorer) {
          predictionsText += ` (⚽️ 1º Gol: ${p.firstGoalScorer.trim()})`;
        }
        predictionsText += `\n`;
      });
    } else {
      predictionsText = `• ${matchConfig.team1Name} ${guess.brazilScore} x ${guess.haitiScore} ${matchConfig.team2Name}`;
      if (guess.firstGoalScorer) {
        predictionsText += ` (⚽ 1º Gol: ${guess.firstGoalScorer.trim()})`;
      }
      predictionsText += `\n`;
    }

    const text = `🥩 *BOUTIQUE DAS CARNES - BOLÃO DA COPA & CHURRASCO* 🇧🇷⚽️\n` +
      `-----------------------------------------\n` +
      `🚀 *QUERO REGISTRAR MEUS PALPITES PARA LIBERAR A ROLETA!*\n\n` +
      `👤 *Nome:* ${user.name}\n` +
      `📱 *WhatsApp:* ${user.phone}\n` +
      `🆔 *CPF:* ${user.cpf}\n\n` +
      `⚽️ *Meus Palpites:* \n` +
      predictionsText +
      `-----------------------------------------\n` +
      `Estou enviando para o WhatsApp oficial e quero liberar 1 GIRO GRÁTIS da roleta da Boutique! 🎰🔥`;
    
    return encodeURIComponent(text);
  };

  const handleFollowInstagram = () => {
    setErrorMsg('');
    const instagramUrl = "https://www.instagram.com/boutiquedascarnes.bc?igsh=MWFyYnRsODFncXppOA==";
    window.open(instagramUrl, '_blank', 'noreferrer,noopener');
    setHasFollowed(true);
  };

  const handleSendWhatsappAndUnlock = () => {
    setErrorMsg('');
    const rawPhone = localStorage.getItem('boutique_store_phone_number') || '554797633756';
    const cleanStorePhone = rawPhone.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanStorePhone}&text=${formatWhatsappMessage()}`;
    window.open(url, '_blank', 'noreferrer,noopener');
    setHasSent(true);
  };

  const handleAdvance = () => {
    if (!hasFollowed && !hasSent) {
      setErrorMsg('Atenção: É obrigatório seguir a Boutique no Instagram e enviar seus palpites pelo WhatsApp para liberar a roleta!');
      return;
    }
    if (!hasFollowed) {
      setErrorMsg('Atenção: É obrigatório seguir a Boutique das Carnes no Instagram primeiro!');
      return;
    }
    if (!hasSent) {
      setErrorMsg('Atenção: É obrigatório enviar seus palpites e dados pelo WhatsApp para validar a inscrição!');
      return;
    }
    onUnlock();
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
          <div className="w-10 h-2 rounded-full bg-brazil-blue animate-pulse" />
          <div className="w-10 h-2 rounded-full bg-stone-300" />
        </div>
      </div>

      <div className="flex flex-col gap-5 flex-1 items-center justify-center">
        
        {/* Confirmed Thank You Message */}
        <div className="text-center bg-emerald-50/80 border-2 border-emerald-500/20 rounded-3xl p-5 mb-1 max-w-sm w-full mx-auto shadow-sm text-brazil-blue">
          <span className="text-[10px] text-emerald-800 bg-emerald-100/90 py-1 px-3.5 rounded-full uppercase font-mono font-black tracking-widest animate-pulse inline-block">
            🎉 CADASTRO EFETUADO COM SUCESSO! 🎉
          </span>
          <h2 className="text-lg font-black uppercase font-display tracking-tight leading-tight text-brazil-blue mt-3">
            SÓ MAIS 2 PASSOS RÁPIDOS!
          </h2>
          <p className="text-xs text-stone-605 font-semibold mt-2 leading-relaxed">
            Olá, <strong className="text-emerald-700 font-extrabold">{user.name}</strong>! Seus palpites estão prontos. Conclua as etapas abaixo para liberar a roleta e garantir seu prêmio! 🥩🇧🇷
          </p>
        </div>

        {/* Visual Multi-step Tasks Verification Card */}
        <div className="w-full max-w-sm bg-white border-4 border-brazil-green rounded-[2rem] overflow-hidden p-6 shadow-2xl text-brazil-blue flex flex-col gap-5">
          
          <div className="flex items-center gap-3 border-b-2 border-stone-105 pb-3">
            <div className="w-8 h-8 rounded-full bg-brazil-blue/10 flex items-center justify-center text-brazil-blue">
              <Award className="w-4.5 h-4.5 text-brazil-blue" />
            </div>
            <div className="text-left">
              <h3 className="text-xs font-black uppercase font-display text-brazil-blue tracking-tight">ETAPAS OBRIGATÓRIAS</h3>
              <p className="text-[10px] text-stone-500 font-extrabold uppercase">Para desbloqueio da roleta</p>
            </div>
          </div>

          {/* STEP 1: INSTAGRAM FOLLOW */}
          <div className="flex flex-col text-left">
            <div className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5 ${
                hasFollowed ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-600'
              }`}>
                {hasFollowed ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold text-stone-800 uppercase tracking-tight">Seguir a Boutique no Instagram</h4>
                  {hasFollowed && <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded uppercase">Concluído</span>}
                </div>
                <p className="text-[10.5px] text-stone-500 font-semibold leading-relaxed mt-0.5">
                  Seguir o perfil <span className="text-pink-600 font-bold">@boutiquedascarnes.bc</span> para conferir os resultados e premiações.
                </p>
              </div>
            </div>

            <div className="mt-2.5 pl-7">
              {hasFollowed ? (
                <div className="flex items-center gap-1.5 py-1 px-3 bg-emerald-55 border border-emerald-300 rounded-lg text-emerald-800 text-[10px] font-bold w-fit">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Sensacional! Você já está seguindo.
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleFollowInstagram}
                  className="w-full bg-gradient-to-r from-pink-600 via-purple-600 to-orange-500 hover:scale-[1.02] active:scale-95 text-white py-2 px-3 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm relative overflow-hidden"
                >
                  <Instagram className="w-4 h-4 text-white shrink-0" />
                  SEGUIR NO INSTAGRAM 📸
                </button>
              )}
            </div>
          </div>

          {/* Separator line */}
          <div className="border-t border-dashed border-stone-200" />

          {/* STEP 2: WHATSAPP SHARING */}
          <div className="flex flex-col text-left">
            <div className="flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black mt-0.5 ${
                hasSent ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-600'
              }`}>
                {hasSent ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-extrabold text-stone-800 uppercase tracking-tight">Enviar Palpites no WhatsApp</h4>
                  {hasSent && <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 rounded uppercase">Registrado</span>}
                </div>
                <p className="text-[10.5px] text-stone-500 font-semibold leading-relaxed mt-0.5">
                  Clique para enviar seus palpites e dados. Isso sincroniza seu telefone e libera o giro.
                </p>
              </div>
            </div>

            <div className="mt-2.5 pl-7">
              {hasSent ? (
                <div className="flex items-center gap-1.5 py-1 px-3 bg-emerald-55 border border-emerald-300 rounded-lg text-emerald-800 text-[10px] font-bold w-fit">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Perfeito! Palpites gravados com sucesso.
                </div>
              ) : (
                <button
                  type="button"
                  id="btn-send-whatsapp-unlock"
                  onClick={handleSendWhatsappAndUnlock}
                  className="w-full bg-[#25D366] hover:bg-[#20ba5a] hover:scale-[1.02] active:scale-95 text-white py-2 px-3 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Share2 className="w-4 h-4 text-white shrink-0" />
                  ENVIAR NO WHATSAPP 🟢
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ERROR WARNING DISCLOSURE */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl max-w-sm w-full text-center flex items-center justify-center gap-2 animate-bounce">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-xs font-black leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* Advance key button to enter Spin State */}
        <div className="w-full max-w-sm mt-1 px-1">
          <button
            type="button"
            id="btn-advance-rolette"
            onClick={handleAdvance}
            className={`w-full py-4 rounded-2xl font-black tracking-wide font-display flex items-center justify-center gap-2 text-sm uppercase transition duration-155 ${
              hasFollowed && hasSent
                ? 'bg-bbq-red text-white hover:bg-bbq-red/90 hover:scale-[1.02] active:scale-95 cursor-pointer border-b-4 border-red-950 shadow-xl animate-pulse'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed border-b-4 border-stone-300'
            }`}
          >
            LIBERAR E GIRAR A ROLETA 🎰
            <ArrowRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        <div className="mt-1 px-4 py-2 bg-stone-50 border border-stone-200 rounded-2xl text-[9px] text-stone-450 font-bold text-center max-w-xs leading-normal">
          🔒 Seus palpites e número ficarão salvos na central de relatórios do proprietário da Boutique para sorteio dos kits de churrasco da Copa!
        </div>
      </div>
    </div>
  );
}
