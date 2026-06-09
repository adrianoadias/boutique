/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AppStep, 
  UserRegistration, 
  MatchGuess, 
  Prize,
  MatchConfig
} from './types';
import Header from './components/Header';
import RegisterForm from './components/RegisterForm';
import InstagramUnlock from './components/InstagramUnlock';
import WheelOfFortune from './components/WheelOfFortune';
import FinalResult from './components/FinalResult';
import { PRIZES, getLoadedMatch } from './data';
import { Flame, Star, Coffee, Lock } from 'lucide-react';
import AdminPanel from './components/AdminPanel';

const LOCAL_STORAGE_USER_KEY = 'boutique_copa_user';
const LOCAL_STORAGE_GUESS_KEY = 'boutique_copa_guess';
const LOCAL_STORAGE_PRIZE_KEY = 'boutique_copa_prize';
const LOCAL_STORAGE_STEP_KEY = 'boutique_copa_step';

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [matchConfig, setMatchConfig] = useState<MatchConfig>(() => getLoadedMatch());

  // Initialize states with safe localStorage backups
  const [step, setStep] = useState<AppStep>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_STEP_KEY);
    return (saved as AppStep) || 'INFO_FORM';
  });

  const [user, setUser] = useState<UserRegistration>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    return saved ? JSON.parse(saved) : { name: '', phone: '', cpf: '' };
  });

  const [guess, setGuess] = useState<MatchGuess>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_GUESS_KEY);
    return saved ? JSON.parse(saved) : { brazilScore: 0, haitiScore: 0 };
  });

  const [prize, setPrize] = useState<Prize | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PRIZE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  // Keep state backups synchronized
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_STEP_KEY, step);
  }, [step]);

  const handleFormComplete = (newUser: UserRegistration, newGuess: MatchGuess) => {
    setUser(newUser);
    setGuess(newGuess);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(LOCAL_STORAGE_GUESS_KEY, JSON.stringify(newGuess));
    setStep('INSTAGRAM_UNLOCK');
  };

  const handleInstagramUnlock = () => {
    setStep('SPIN_ROLETTE');
  };

  const handleSpinSuccess = (wonPrize: Prize) => {
    setPrize(wonPrize);
    localStorage.setItem(LOCAL_STORAGE_PRIZE_KEY, JSON.stringify(wonPrize));
    
    // Save to integrated answers database (localStorage)
    try {
      const existing = localStorage.getItem('boutique_all_registrations');
      const records = existing ? JSON.parse(existing) : [];
      
      const newRecord = {
        id: Math.random().toString(36).substring(2, 9).toUpperCase(),
        name: user.name,
        phone: user.phone,
        cpf: user.cpf,
        brazilScore: guess.brazilScore,
        haitiScore: guess.haitiScore,
        prizeTitle: wonPrize.title,
        prizeCode: wonPrize.couponCode,
        timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      };
      
      records.unshift(newRecord); // Add record to beginning of list
      localStorage.setItem('boutique_all_registrations', JSON.stringify(records));
    } catch (e) {
      console.error('Error saving registration', e);
    }

    setStep('FINAL_SHARE');
  };

  const handleResetAll = () => {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_GUESS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PRIZE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
    
    setUser({ name: '', phone: '', cpf: '' });
    setGuess({ brazilScore: 0, haitiScore: 0 });
    setPrize(null);
    setStep('INFO_FORM');
  };

  return (
    <div className="min-h-screen bg-brazil-yellow flex justify-center items-start text-brazil-blue font-sans">
      {/* MOBILE-ONLY WRAPPER CONTAINER:
          Centering on desktop with an attractive high-end shadow container, but filling
          the entire mobile layout space perfectly natively. */}
      <div className="w-full max-w-md min-h-screen bg-white relative shadow-2xl flex flex-col border-x-4 border-brazil-blue overflow-hidden">
        
        {/* Dynamic BBQ Ember Grill Particles drifting in the background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-15">
          <div className="absolute bottom-5 left-[15%] w-1.5 h-1.5 bg-brazil-green rounded-full animate-ember" style={{ animationDuration: '6s', animationDelay: '0s' }} />
          <div className="absolute bottom-12 left-[40%] w-2 h-2 bg-bbq-red rounded-full animate-ember" style={{ animationDuration: '5s', animationDelay: '2s' }} />
          <div className="absolute bottom-8 left-[75%] w-1 h-1 bg-brazil-blue rounded-full animate-ember" style={{ animationDuration: '7s', animationDelay: '1.5s' }} />
          <div className="absolute bottom-20 left-[60%] w-1.5 h-1.5 bg-brazil-green rounded-full animate-ember" style={{ animationDuration: '8s', animationDelay: '3s' }} />
          <div className="absolute bottom-2 left-[25%] w-1 h-1.5 bg-bbq-red rounded-full animate-ember" style={{ animationDuration: '4s', animationDelay: '0.8s' }} />
        </div>

        {/* Global Page Header */}
        <div className="relative z-10">
          <Header matchConfig={matchConfig} />
        </div>

        {/* Master State Switcher */}
        <main className="flex-1 flex flex-col relative z-10 bg-white">
          {step === 'INFO_FORM' && (
            <RegisterForm 
              matchConfig={matchConfig}
              onComplete={handleFormComplete} 
              initialUser={user} 
              initialGuess={guess} 
            />
          )}

          {step === 'INSTAGRAM_UNLOCK' && (
            <InstagramUnlock 
              userName={user.name} 
              onUnlock={handleInstagramUnlock} 
            />
          )}

          {step === 'SPIN_ROLETTE' && (
            <WheelOfFortune 
              onSpinComplete={handleSpinSuccess} 
              />
          )}

          {step === 'FINAL_SHARE' && prize && (
            <FinalResult 
              matchConfig={matchConfig}
              user={user} 
              guess={guess} 
              prize={prize} 
              onReset={handleResetAll} 
            />
          )}
        </main>

        {/* Bottom Campaign Footer */}
        <footer className="py-5 px-4 bg-stone-50 border-t border-stone-200 relative z-10 text-center flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-black tracking-widest text-brazil-blue">
            <span>🥩 BOUTIQUE DAS CARNES</span>
            <span className="text-brazil-green">•</span>
            <span className="text-bbq-red">SABORES DE CAMPEÃO</span>
          </div>
          <p className="text-[9px] text-stone-500 font-bold">
            © {new Date().getFullYear()} Boutique das Carnes Ltda. Todos os direitos reservados.
          </p>
          <button 
            type="button"
            onClick={() => setIsAdminOpen(true)}
            className="flex items-center gap-1 mt-1.5 text-[8.5px] font-black uppercase text-stone-400 hover:text-brazil-blue transition duration-150 tracking-wider hover:underline cursor-pointer"
          >
            <Lock className="w-2.5 h-2.5" />
            Painel do Proprietário
          </button>
        </footer>

      </div>

      {isAdminOpen && (
        <AdminPanel onClose={() => { setIsAdminOpen(false); setMatchConfig(getLoadedMatch()); }} />
      )}
    </div>
  );
}
