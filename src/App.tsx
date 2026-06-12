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
import { PRIZES, getLoadedMatch, getLoadedMatches } from './data';
import { Flame, Star, Coffee, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminPanel from './components/AdminPanel';
import { 
  saveRegistrationToCloud, 
  syncLocalRecordsWithCloud,
  loadRegistrationsFromCloud
} from './lib/firebase';

const LOCAL_STORAGE_USER_KEY = 'boutique_copa_user';
const LOCAL_STORAGE_GUESS_KEY = 'boutique_copa_guess';
const LOCAL_STORAGE_PRIZE_KEY = 'boutique_copa_prize';
const LOCAL_STORAGE_STEP_KEY = 'boutique_copa_step';

export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [matchConfig, setMatchConfig] = useState<MatchConfig>(() => getLoadedMatch());
  const [matchesConfig, setMatchesConfig] = useState<MatchConfig[]>(() => getLoadedMatches());

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
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.predictions) && parsed.predictions.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    const initialMatches = getLoadedMatches();
    return {
      brazilScore: 0,
      haitiScore: 0,
      firstGoalScorer: '',
      predictions: initialMatches.map(m => ({
        matchId: m.id,
        team1Score: 0,
        team2Score: 0,
        firstGoalScorer: ''
      }))
    };
  });

  const [prize, setPrize] = useState<Prize | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PRIZE_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  // Keep state backups synchronized
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_STEP_KEY, step);
  }, [step]);

  // Synchronize local registration history with server side on mount
  useEffect(() => {
    try {
      // 100% Cloud-First query to obtain active records and purge any deleted or stale cache
      loadRegistrationsFromCloud()
        .then(records => {
          if (records) {
            localStorage.setItem('boutique_all_registrations', JSON.stringify(records));
            // Refresh components and storage events
            window.dispatchEvent(new Event('storage'));
          }
        })
        .catch(err => console.error('Cloud Firestore fetch error:', err));

      const existing = localStorage.getItem('boutique_all_registrations');
      let clientRecords: any[] = [];
      try {
        clientRecords = existing ? JSON.parse(existing) : [];
        if (!Array.isArray(clientRecords)) clientRecords = [];
      } catch {
        clientRecords = [];
      }

      // Standard Node server backup POST as optional fallback
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientRecords)
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Sync failed with status ' + res.status);
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.records)) {
          localStorage.setItem('boutique_all_registrations', JSON.stringify(data.records));
          window.dispatchEvent(new Event('storage'));
        }
      })
      .catch(e => console.log('Silent server fallback sync skipped (offline environment expected):', e.message));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleFormComplete = (newUser: UserRegistration, newGuess: MatchGuess) => {
    setUser(newUser);
    setGuess(newGuess);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
    localStorage.setItem(LOCAL_STORAGE_GUESS_KEY, JSON.stringify(newGuess));

    let registrationId = '';
    let targetRecord: any = null;

    // Save to database immediately so they are counted, even if they quit before spinning!
    try {
      const existing = localStorage.getItem('boutique_all_registrations');
      let records: any[] = [];
      try {
        records = existing ? JSON.parse(existing) : [];
        if (!Array.isArray(records)) records = [];
      } catch {
        records = [];
      }
      
      const cleanInputCpf = newUser.cpf ? newUser.cpf.replace(/\D/g, '') : '';
      const cleanInputPhone = newUser.phone.replace(/\D/g, '');

      // Identify if this is the special test user
      const isTestUser = cleanInputCpf === '41107627826' || cleanInputPhone === '47991238671' || newUser.name.trim().toLowerCase() === 'adriano dias';

      // Check if duplicate already exists (to prevent duplicating in the database if they go back and forth)
      const existingIndex = records.findIndex((r: any) => {
        const itemCpf = (r.cpf || '').replace(/\D/g, '');
        return (!isTestUser && cleanInputCpf && itemCpf === cleanInputCpf);
      });

      if (existingIndex > -1) {
        // Already registered, update predictions just in case they went back to change drafts
        records[existingIndex].brazilScore = newGuess.brazilScore;
        records[existingIndex].haitiScore = newGuess.haitiScore;
        records[existingIndex].predictions = newGuess.predictions || [];
        records[existingIndex].firstGoalScorer = newGuess.firstGoalScorer || '';
        registrationId = records[existingIndex].id;
        targetRecord = records[existingIndex];
        // Capture their ID back to sync of roulette flow
        localStorage.setItem('boutique_current_registration_id', records[existingIndex].id);
      } else {
        registrationId = Math.random().toString(36).substring(2, 9).toUpperCase();
        localStorage.setItem('boutique_current_registration_id', registrationId);

        const newRecord = {
          id: registrationId,
          name: newUser.name,
          phone: newUser.phone,
          cpf: newUser.cpf,
          brazilScore: newGuess.brazilScore,
          haitiScore: newGuess.haitiScore,
          firstGoalScorer: newGuess.firstGoalScorer || '',
          predictions: newGuess.predictions || [],
          prizeTitle: 'Pendente (Não girou roleta) ⏱️',
          prizeCode: 'PENDENTE',
          timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        };
        records.unshift(newRecord);
        targetRecord = newRecord;
      }
      localStorage.setItem('boutique_all_registrations', JSON.stringify(records));
      
      // Dual-System instant real-time cloud and server saving
      if (targetRecord) {
        // 1. Direct secure Firestore Cloud save (completely functional on Hostinger, local, and anywhere)
        saveRegistrationToCloud(targetRecord)
          .then(success => {
            if (success) {
              console.log('Firebase Firestore registration saved successfully');
            }
          })
          .catch(err => console.error('Firestore save registration failed:', err));

        // 2. Fallback backend POST
        fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetRecord)
        })
        .then(res => res.json())
        .then(result => {
          if (result && result.success && result.record) {
            console.log('Server registration synced successfully');
          }
        })
        .catch(err => console.log('Immediate Server backup POST skipped (offline mode):', err.message));
      }
    } catch (e) {
      console.error('Error saving immediate registration', e);
    }

    setStep('INSTAGRAM_UNLOCK');
  };

  const handleInstagramUnlock = () => {
    setStep('SPIN_ROLETTE');
  };

  const handleSpinSuccess = (wonPrize: Prize) => {
    setPrize(wonPrize);
    localStorage.setItem(LOCAL_STORAGE_PRIZE_KEY, JSON.stringify(wonPrize));
    
    // Update existing registration record with the won prize
    try {
      const existing = localStorage.getItem('boutique_all_registrations');
      let records: any[] = [];
      try {
        records = existing ? JSON.parse(existing) : [];
        if (!Array.isArray(records)) records = [];
      } catch {
        records = [];
      }
      
      const currentRegId = localStorage.getItem('boutique_current_registration_id');
      const cleanInputCpf = user.cpf ? user.cpf.replace(/\D/g, '') : '';
      const cleanInputPhone = user.phone.replace(/\D/g, '');

      let recordIndex = -1;
      let targetRecord: any = null;

      if (currentRegId) {
        recordIndex = records.findIndex((r: any) => r.id === currentRegId);
      }
      if (recordIndex === -1) {
        recordIndex = records.findIndex((r: any) => {
          const itemCpf = (r.cpf || '').replace(/\D/g, '');
          return cleanInputCpf && itemCpf === cleanInputCpf;
        });
      }

      if (recordIndex > -1) {
        records[recordIndex].prizeTitle = wonPrize.title;
        records[recordIndex].prizeCode = wonPrize.couponCode;
        targetRecord = records[recordIndex];
      } else {
        // Fallback: create fresh record if not found
        const newRecord = {
          id: currentRegId || Math.random().toString(36).substring(2, 9).toUpperCase(),
          name: user.name,
          phone: user.phone,
          cpf: user.cpf,
          brazilScore: guess.brazilScore,
          haitiScore: guess.haitiScore,
          firstGoalScorer: guess.firstGoalScorer || '',
          predictions: guess.predictions || [],
          prizeTitle: wonPrize.title,
          prizeCode: wonPrize.couponCode,
          timestamp: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        };
        records.unshift(newRecord);
        targetRecord = newRecord;
      }
      
      localStorage.setItem('boutique_all_registrations', JSON.stringify(records));

      // Dual-System instant real-time cloud and server saving
      if (targetRecord) {
        // 1. Direct secure Firestore Cloud save (completely functional on Hostinger, local, and anywhere)
        saveRegistrationToCloud(targetRecord)
          .then(success => {
            if (success) {
              console.log('Firebase Firestore prize update saved successfully');
            }
          })
          .catch(err => console.error('Firestore prize update failed:', err));

        // 2. Fallback backend POST
        fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(targetRecord)
        })
        .then(res => res.json())
        .then(result => {
          if (result && result.success) {
            console.log('Server prize update synced successfully');
          }
        })
        .catch(err => console.log('Immediate Server prize update backup Post skipped (offline mode):', err.message));
      }
    } catch (e) {
      console.error('Error updating registration with prize', e);
    }

    setStep('FINAL_SHARE');
  };

  const handleResetAll = () => {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_GUESS_KEY);
    localStorage.removeItem(LOCAL_STORAGE_PRIZE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_STEP_KEY);
    
    setUser({ name: '', phone: '', cpf: '' });
    const initialMatches = getLoadedMatches();
    setGuess({
      brazilScore: 0,
      haitiScore: 0,
      firstGoalScorer: '',
      predictions: initialMatches.map(m => ({
        matchId: m.id,
        team1Score: 0,
        team2Score: 0,
        firstGoalScorer: ''
      }))
    });
    setPrize(null);
    setStep('INFO_FORM');
  };

  const STEPS_ORDER: AppStep[] = ['INFO_FORM', 'INSTAGRAM_UNLOCK', 'SPIN_ROLETTE', 'FINAL_SHARE'];
  const STEP_LABELS = {
    INFO_FORM: 'Palpite',
    INSTAGRAM_UNLOCK: 'Redes',
    SPIN_ROLETTE: 'Roleta',
    FINAL_SHARE: 'Prêmio'
  };

  const currentIdx = STEPS_ORDER.indexOf(step);

  const validateStepTrans = (targetStep: AppStep): boolean => {
    if (targetStep !== 'INFO_FORM') {
      if (!user.name.trim() || !user.phone.trim()) {
        alert('Por favor, preencha seu Nome e WhatsApp/Celular na primeira etapa antes de avançar!');
        return false;
      }
    }
    return true;
  };

  const goPrevStep = () => {
    if (currentIdx > 0) {
      setStep(STEPS_ORDER[currentIdx - 1]);
    }
  };

  const goNextStep = () => {
    if (currentIdx < STEPS_ORDER.length - 1) {
      const nextStep = STEPS_ORDER[currentIdx + 1];
      if (validateStepTrans(nextStep)) {
        if (nextStep === 'FINAL_SHARE' && !prize) {
          const validPrizes = PRIZES.filter(p => p.id !== 'TRY_AGAIN');
          const randomPrize = validPrizes[Math.floor(Math.random() * validPrizes.length)];
          setPrize(randomPrize);
          localStorage.setItem(LOCAL_STORAGE_PRIZE_KEY, JSON.stringify(randomPrize));
        }
        setStep(nextStep);
      }
    }
  };

  const handleJumpToStep = (targetStep: AppStep, idx: number) => {
    if (validateStepTrans(targetStep)) {
      if (targetStep === 'FINAL_SHARE' && !prize) {
        const validPrizes = PRIZES.filter(p => p.id !== 'TRY_AGAIN');
        const randomPrize = validPrizes[Math.floor(Math.random() * validPrizes.length)];
        setPrize(randomPrize);
        localStorage.setItem(LOCAL_STORAGE_PRIZE_KEY, JSON.stringify(randomPrize));
      }
      setStep(targetStep);
    }
  };  return (
    <div className="min-h-screen bg-white flex flex-col text-brazil-blue font-sans w-full box-border overflow-x-hidden">
      {/* FULL-SCREEN RESPONSIVE PORTAL:
          Fills 100% space seamlessly on computer, TV, tablet, and mobile, with no borders or forced aspect confinement. */}
      <div className="w-full min-h-screen bg-white relative flex flex-col overflow-x-hidden">
        
        {/* Dynamic BBQ Ember Grill Particles drifting in the background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-15">
          <div className="absolute bottom-5 left-[15%] w-1.5 h-1.5 bg-brazil-green rounded-full animate-ember" style={{ animationDuration: '6s', animationDelay: '0s' }} />
          <div className="absolute bottom-12 left-[40%] w-2 h-2 bg-bbq-red rounded-full animate-ember" style={{ animationDuration: '5s', animationDelay: '2s' }} />
          <div className="absolute bottom-8 left-[75%] w-1 h-1 bg-brazil-blue rounded-full animate-ember" style={{ animationDuration: '7s', animationDelay: '1.5s' }} />
          <div className="absolute bottom-20 left-[60%] w-1.5 h-1.5 bg-brazil-green rounded-full animate-ember" style={{ animationDuration: '8s', animationDelay: '3s' }} />
          <div className="absolute bottom-2 left-[25%] w-1 h-1.5 bg-bbq-red rounded-full animate-ember" style={{ animationDuration: '4s', animationDelay: '0.8s' }} />
        </div>

        {/* Global Page Header */}
        <div className="relative z-10 w-full">
          <Header matchConfig={matchConfig} />
        </div>

        {/* Step Navigation Bar */}
        <div className="bg-stone-50 border-b-2 border-stone-150 py-2.5 select-none relative z-10 font-display shadow-inner w-full">
          <div className="max-w-4xl mx-auto w-full px-4 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevStep}
              disabled={currentIdx === 0}
              className="flex items-center gap-0.5 text-[10px] font-black uppercase text-brazil-blue disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition py-1 px-2 rounded-lg hover:bg-stone-200"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[3]" />
              Voltar
            </button>

            {/* Stepper nodes */}
            <div className="flex items-center gap-1">
              {STEPS_ORDER.map((s, idx) => {
                const isCompleted = idx < currentIdx;
                const isActive = s === step;
                return (
                  <React.Fragment key={s}>
                    <button
                      type="button"
                      onClick={() => handleJumpToStep(s, idx)}
                      className={`w-6 h-6 rounded-full flex flex-col items-center justify-center text-[10px] font-black transition relative cursor-pointer ${
                        isActive 
                          ? 'bg-brazil-blue text-white ring-2 ring-brazil-yellow ring-offset-1 shadow' 
                          : isCompleted
                          ? 'bg-brazil-green text-white shadow-sm'
                          : 'bg-stone-200 text-stone-500 hover:bg-stone-300'
                      }`}
                      title={STEP_LABELS[s]}
                    >
                      <span>{idx + 1}</span>
                      <span className="absolute -bottom-3 text-[7px] tracking-tighter text-stone-400 font-extrabold uppercase leading-none hidden">
                        {STEP_LABELS[s]}
                      </span>
                    </button>
                    {idx < STEPS_ORDER.length - 1 && (
                      <div className={`w-3.5 h-[3px] rounded ${idx < currentIdx ? 'bg-brazil-green' : 'bg-stone-200'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <button
              type="button"
              onClick={goNextStep}
              disabled={currentIdx === STEPS_ORDER.length - 1}
              className="flex items-center gap-0.5 text-[10px] font-black uppercase text-brazil-blue disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition py-1 px-2 rounded-lg hover:bg-stone-200"
            >
              Avançar
              <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>
        </div>

        {/* Master State Switcher */}
        <main className="flex-grow flex flex-col relative z-10 bg-white w-full">
          <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col">
            {step === 'INFO_FORM' && (
              <RegisterForm 
                matchesConfig={matchesConfig}
                onComplete={handleFormComplete} 
                initialUser={user} 
                initialGuess={guess} 
              />
            )}

            {step === 'INSTAGRAM_UNLOCK' && (
              <InstagramUnlock 
                user={user}
                guess={guess}
                matchConfig={matchConfig}
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
          </div>
        </main>

        {/* Bottom Campaign Footer */}
        <footer className="py-6 bg-stone-50 border-t border-stone-200 relative z-10 text-center w-full">
          <div className="max-w-4xl mx-auto w-full px-4 flex flex-col items-center gap-1">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-mono font-black tracking-widest text-brazil-blue">
              <span>🥩 BOUTIQUE DAS CARNES</span>
              <span className="text-brazil-green">•</span>
              <span className="text-bbq-red">SABORES DE CAMPEÃO</span>
            </div>
            <p className="text-[9px] text-stone-500 font-bold">
              © {new Date().getFullYear()} Boutique das Carnes Ltda. Todos os direitos reservados.
            </p>
            <p className="text-[8.5px] text-stone-400 font-semibold uppercase tracking-wider mt-0.5">
              Desenvolvido por: <span className="font-extrabold text-stone-500">Rafes Marketing</span>
            </p>
            <button 
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="flex items-center gap-1 mt-1.5 text-[8.5px] font-black uppercase text-stone-400 hover:text-brazil-blue transition duration-150 tracking-wider hover:underline cursor-pointer"
            >
              <Lock className="w-2.5 h-2.5" />
              Painel do Proprietário
            </button>
          </div>
        </footer>

      </div>

      {isAdminOpen && (
        <AdminPanel onClose={() => { setIsAdminOpen(false); setMatchConfig(getLoadedMatch()); }} />
      )}
    </div>
  );
}
