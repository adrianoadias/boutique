import React, { useState } from 'react';
import { CheckCircle, ShieldCheck, ArrowRight, Share2, AlertTriangle, Eye, Send, Award } from 'lucide-react';
import { getLoadedMatches } from '../data';
import { UserRegistration, MatchGuess, MatchConfig } from '../types';

interface InstagramUnlockProps {
  onUnlock: () => void;
  user: UserRegistration;
  guess: MatchGuess;
  matchConfig: MatchConfig;
}

export default function InstagramUnlock({ onUnlock, user, guess, matchConfig }: InstagramUnlockProps) {
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

  const handleSendWhatsappAndUnlock = () => {
    setErrorMsg('');
    const rawPhone = localStorage.getItem('boutique_store_phone_number') || '554797633756';
    const cleanStorePhone = rawPhone.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleanStorePhone}&text=${formatWhatsappMessage()}`;
    window.open(url, '_blank', 'noreferrer,noopener');
    
    setHasSent(true);
  };

  const handleAdvance = () => {
    if (!hasSent) {
      setErrorMsg('Atenção: É obrigatório clicar no botão verde acima para enviar seus palpites e dados pelo WhatsApp para liberar a roleta!');
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
            ÚLTIMA ETAPA ANTES DE GIRAR!
          </h2>
          <p className="text-xs text-stone-600 font-semibold mt-2 leading-relaxed">
            Olá, <strong className="text-emerald-700 font-extrabold">{user.name}</strong>! Seus palpites estão prontos. Agora você deve enviá-los no nosso WhatsApp para validar a inscrição e liberar a roleta! 🥩🇧🇷
          </p>
        </div>

        {/* Visual Summary Card */}
        <div className="relative w-full max-w-sm bg-white border-4 border-brazil-green rounded-[2rem] overflow-hidden p-6 shadow-2xl text-brazil-blue">
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 blur-2xl rounded-full" />
          
          <div className="flex items-center gap-3 relative z-10 text-left">
            <div className="w-10 h-10 rounded-full bg-brazil-blue/10 flex items-center justify-center text-brazil-blue">
              <Award className="w-5 h-5 text-brazil-blue" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase font-display text-brazil-blue tracking-tight">RESUMO DE SEUS DADOS</h3>
              <p className="text-[10px] text-stone-500 font-bold">Confira as informações que serão enviadas:</p>
            </div>
          </div>

          {/* Customer Details info block */}
          <div className="mt-4 pt-3 border-t-2 border-stone-100 text-left text-xs gap-1.5 flex flex-col relative z-10">
            <div>
              <strong className="text-stone-400 text-[10px] uppercase font-black tracking-wider block">Seu Nome:</strong>
              <span className="font-extrabold text-brazil-blue">{user.name}</span>
            </div>
            <div>
              <strong className="text-stone-400 text-[10px] uppercase font-black tracking-wider block">Seu CPF:</strong>
              <span className="font-bold text-stone-700 font-mono">{user.cpf}</span>
            </div>
            <div>
              <strong className="text-stone-400 text-[10px] uppercase font-black tracking-wider block">Seu Celular:</strong>
              <span className="font-bold text-stone-700 font-mono">{user.phone}</span>
            </div>
            
            <div className="mt-2 p-2.5 bg-stone-50 border border-stone-200 rounded-xl">
              <strong className="text-stone-400 text-[9px] uppercase font-black tracking-wider block mb-1">Palpites Ativos:</strong>
              <div className="flex flex-col gap-1 text-[11px] font-bold text-stone-700">
                {guess.predictions && guess.predictions.length > 0 ? (
                  guess.predictions.map((p) => {
                    const matches = getLoadedMatches();
                    const matchInfo = matches.find(m => m.id === p.matchId) || matchConfig;
                    return (
                      <div key={p.matchId} className="flex justify-between border-b border-dashed border-stone-200 pb-1 last:border-0 last:pb-0">
                        <span className="text-stone-605">{matchInfo.team1Flag} {matchInfo.team1Name} vs {matchInfo.team2Name} {matchInfo.team2Flag}</span>
                        <span className="text-brazil-blue font-black font-mono">{p.team1Score} x {p.team2Score}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex justify-between">
                    <span>{matchConfig.team1Flag} {matchConfig.team1Name} vs {matchConfig.team2Name} {matchConfig.team2Flag}</span>
                    <span className="text-brazil-blue font-black font-mono">{guess.brazilScore} x {guess.haitiScore}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BIG MANDATORY WHATSAPP BUTTON ACTION */}
          <div className="mt-5 relative z-10">
            {hasSent ? (
              <div className="flex flex-col items-center gap-2 p-3 bg-emerald-50 border-2 border-emerald-500 rounded-xl text-center">
                <div className="flex items-center gap-1.5 justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600 fill-white" />
                  <span className="text-xs font-black text-emerald-700">PALPITES ENVIADOS NO WHATSAPP! ✅</span>
                </div>
                <p className="text-[9.5px] text-emerald-800 font-semibold">
                  A roleta já está desbloqueada! Clique no botão vermelho abaixo para ganhar o seu prêmio.
                </p>
              </div>
            ) : (
              <button
                type="button"
                id="btn-send-whatsapp-unlock"
                onClick={handleSendWhatsappAndUnlock}
                className="w-full bg-[#25D366] hover:bg-[#20ba5a] hover:scale-[1.02] active:scale-95 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-emerald-600/20 border-b-4 border-emerald-850 relative overflow-hidden animate-pulse"
              >
                <Share2 className="w-4.5 h-4.5" />
                1º ENVIAR PARA O WHATSAPP 🟢
              </button>
            )}
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
            className={`w-full py-4 rounded-2xl font-black tracking-wide font-display flex items-center justify-center gap-2 text-sm uppercase transition duration-150 ${
              hasSent
                ? 'bg-bbq-red text-white hover:bg-bbq-red/90 hover:scale-[1.02] active:scale-95 cursor-pointer border-b-4 border-red-950 shadow-xl'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed border-b-4 border-stone-300'
            }`}
          >
            2º LIBERAR E GIRAR A ROLETA 🎰
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
