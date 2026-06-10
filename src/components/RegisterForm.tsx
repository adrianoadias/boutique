import React, { useState } from 'react';
import { User, Smartphone, Send, Star, Zap, Plus, Minus } from 'lucide-react';
import { UserRegistration, MatchGuess, MatchConfig } from '../types';

interface RegisterFormProps {
  matchConfig: MatchConfig;
  onComplete: (user: UserRegistration, guess: MatchGuess) => void;
  initialUser: UserRegistration;
  initialGuess: MatchGuess;
}

export default function RegisterForm({ matchConfig, onComplete, initialUser, initialGuess }: RegisterFormProps) {
  const [name, setName] = useState(initialUser.name);
  const [phone, setPhone] = useState(initialUser.phone);
  const [cpf, setCpf] = useState(initialUser.cpf || '');
  const [brazilScore, setBrazilScore] = useState(initialGuess.brazilScore);
  const [haitiScore, setHaitiScore] = useState(initialGuess.haitiScore);
  const [firstGoalScorer, setFirstGoalScorer] = useState(initialGuess.firstGoalScorer || '');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto mask for Brazilian CPF: 000.000.000-00
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); // Extract numbers only
    if (input.length > 11) {
      input = input.substring(0, 11);
    }

    let formatted = '';
    if (input.length > 0) {
      formatted += input.substring(0, 3);
    }
    if (input.length > 3) {
      formatted += `.${input.substring(3, 6)}`;
    }
    if (input.length > 6) {
      formatted += `.${input.substring(6, 9)}`;
    }
    if (input.length > 9) {
      formatted += `-${input.substring(9, 11)}`;
    }

    setCpf(formatted);
  };

  // Official Brazilian algorithmic CPF validation
  const validateCPF = (cpfValue: string): boolean => {
    const cleanCPF = cpfValue.replace(/\D/g, '');
    if (cleanCPF.length !== 11) return false;
    
    // Ignore known invalid CPFs
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
      sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
  };

  // Auto mask for Brazilian WhatsApp formatted telephone: (XX) XXXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); // Extract numbers only
    if (input.length > 11) {
      input = input.substring(0, 11);
    }

    let formatted = '';
    if (input.length > 0) {
      formatted += `(${input.substring(0, 2)}`;
    }
    if (input.length > 2) {
      formatted += `) ${input.substring(2, 7)}`;
    }
    if (input.length > 7) {
      formatted += `-${input.substring(7, 11)}`;
    } else if (input.length > 2 && input.length <= 7) {
      // Just showing digits after area code
      formatted = `(${input.substring(0, 2)}) ${input.substring(2)}`;
    }

    setPhone(formatted);
  };

  const handleIncrementBrazil = () => {
    if (brazilScore < 20) setBrazilScore(prev => prev + 1);
  };
  const handleDecrementBrazil = () => {
    if (brazilScore > 0) setBrazilScore(prev => prev - 1);
  };

  const handleIncrementHaiti = () => {
    if (haitiScore < 20) setHaitiScore(prev => prev + 1);
  };
  const handleDecrementHaiti = () => {
    if (haitiScore > 0) setHaitiScore(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length < 3) {
      setErrorMsg('Por favor, digite seu nome completo (mínimo 3 letras).');
      return;
    }

    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      setErrorMsg('Digite um WhatsApp/Celular válido no formato (XX) XXXXX-XXXX.');
      return;
    }

    if (!validateCPF(cpf)) {
      setErrorMsg('Por favor, digite um CPF válido e bem formatado.');
      return;
    }

    // Check integrated database duplicate records (uniqueness by CPF or Phone)
    try {
      const saved = localStorage.getItem('boutique_all_registrations');
      const records = saved ? JSON.parse(saved) : [];
      
      const cleanInputCpf = cpf.replace(/\D/g, '');
      const cleanInputPhone = phone.replace(/\D/g, '');

      const isDuplicate = records.some((r: any) => {
        const itemCpf = (r.cpf || '').replace(/\D/g, '');
        const itemPhone = (r.phone || '').replace(/\D/g, '');
        return itemCpf === cleanInputCpf || itemPhone === cleanInputPhone;
      });

      if (isDuplicate) {
        setErrorMsg('Desculpe, esse CPF ou WhatsApp já possui um palpite registrado! Limite de 1 participação por pessoa.');
        return;
      }
    } catch (err) {
      console.error('Error conducting duplicate checks', err);
    }

    setErrorMsg('');
    onComplete({ name: name.trim(), phone, cpf }, { brazilScore, haitiScore, firstGoalScorer: firstGoalScorer.trim() });
  };

  return (
    <div className="flex flex-col flex-1 px-4 py-4 pb-8 bg-brazil-yellow/5">
      {/* Visual divider line with gradient */}
      <div className="relative mb-5 bg-gradient-to-r from-transparent via-brazil-blue/20 to-transparent h-1 w-full" />

      {/* Main Form container */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 flex-1">
        
        {/* Step tracker */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-brazil-blue font-mono">PASSO 1 DE 3</span>
          <div className="flex items-center gap-1.5">
            <div className="w-10 h-2 rounded-full bg-brazil-blue" />
            <div className="w-10 h-2 rounded-full bg-stone-300" />
            <div className="w-10 h-2 rounded-full bg-stone-300" />
          </div>
        </div>

        {/* SECTION I: User Data */}
        <div className="bg-white p-5 rounded-[2rem] border-4 border-brazil-green shadow-xl flex flex-col gap-4 text-brazil-blue">
          <h2 className="text-base font-black uppercase tracking-tight text-brazil-green font-display flex items-center gap-1.5 leading-none">
            <Zap className="w-5 h-5 fill-brazil-yellow text-brazil-green" /> Seus Dados de Contato
          </h2>

          {/* Nome Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase text-brazil-blue/80" htmlFor="user-name">
              Qual é seu nome completo?
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-brazil-blue/60" />
              <input
                id="user-name"
                name="user-name"
                type="text"
                required
                placeholder="Ex: Adriano Dias"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-50 border-2 border-stone-200 focus:border-brazil-blue focus:ring-1 focus:ring-brazil-blue rounded-xl py-3 pl-10 pr-4 text-sm text-brazil-blue font-bold placeholder-stone-400 transition-all outline-none"
              />
            </div>
          </div>

          {/* WhatsApp Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase text-brazil-blue/80" htmlFor="user-phone">
              Seu WhatsApp / Celular:
            </label>
            <div className="relative">
              <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-brazil-blue/60" />
              <input
                id="user-phone"
                name="user-phone"
                type="tel"
                required
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                className="w-full bg-stone-50 border-2 border-stone-200 focus:border-brazil-blue focus:ring-1 focus:ring-brazil-blue rounded-xl py-3 pl-10 pr-4 text-sm text-brazil-blue font-bold placeholder-stone-400 font-mono transition-all outline-none"
              />
            </div>
            <p className="text-[10px] text-stone-500 font-semibold leading-normal">
              ⚠️ Use seu número correto para validar o seu prêmio depois!
            </p>
          </div>

          {/* CPF Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase text-brazil-blue/80" htmlFor="user-cpf">
              Seu CPF (Válido para a promoção):
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-brazil-blue/60" />
              <input
                id="user-cpf"
                name="user-cpf"
                type="text"
                required
                placeholder="000.000.000-00"
                value={cpf}
                onChange={handleCpfChange}
                className="w-full bg-stone-50 border-2 border-stone-200 focus:border-brazil-blue focus:ring-1 focus:ring-brazil-blue rounded-xl py-3 pl-10 pr-4 text-sm text-brazil-blue font-bold placeholder-stone-400 font-mono transition-all outline-none"
              />
            </div>
            <p className="text-[10px] text-stone-500 font-semibold leading-normal">
              ⚠️ Apenas 1 palpite é aceito por CPF. A promoção é restrita a um prêmio por CPF.
            </p>
          </div>
        </div>

        {/* SECTION II: Score Guessing */}
        <div className="bg-white p-5 rounded-[2rem] border-4 border-brazil-blue shadow-xl flex flex-col gap-4 text-brazil-blue">
          <h2 className="text-base font-black uppercase tracking-tight text-brazil-blue font-display flex items-center gap-1.5">
            🏆 Seu Palpite do Jogo
          </h2>
          <p className="text-xs text-stone-600 font-bold -mt-2">
            Qual será o placar de <span className="font-extrabold text-brazil-green">{matchConfig.team1Name} x {matchConfig.team2Name}</span>?
          </p>

          {/* Interactive scoreboard columns */}
          <div className="grid grid-cols-5 items-center gap-2 mt-1 bg-stone-50 p-4 rounded-2xl border-2 border-stone-200/80 font-display select-none">
            
            {/* TIME 1 */}
            <div className="col-span-2 flex flex-col items-center gap-2">
              <div className="flex flex-col items-center text-center">
                <span className="text-3xl mb-1 filter drop-shadow">{matchConfig.team1Flag}</span>
                <span className="text-xs font-black uppercase text-brazil-blue tracking-wider truncate max-w-full font-display">{matchConfig.team1Name}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="dec-brazil"
                  onClick={handleDecrementBrazil}
                  className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 active:scale-90 flex items-center justify-center text-brazil-blue border border-stone-300 transition cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <span className="w-8 text-center text-2xl font-black font-display text-brazil-blue">
                  {brazilScore}
                </span>
                <button
                  type="button"
                  id="inc-brazil"
                  onClick={handleIncrementBrazil}
                  className="w-8 h-8 rounded-full bg-brazil-green text-white hover:brightness-110 active:scale-90 flex items-center justify-center border border-brazil-green transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* X divider */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-stone-400 font-mono">VS</span>
              <span className="text-stone-300 text-lg font-black font-display">X</span>
            </div>

            {/* TIME 2 */}
            <div className="col-span-2 flex flex-col items-center gap-2">
              <div className="flex flex-col items-center text-center">
                <span className="text-3xl mb-1 filter drop-shadow">{matchConfig.team2Flag}</span>
                <span className="text-xs font-black uppercase text-stone-500 tracking-wider truncate max-w-full font-display">{matchConfig.team2Name}</span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="dec-haiti"
                  onClick={handleDecrementHaiti}
                  className="w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 active:scale-90 flex items-center justify-center text-brazil-blue border border-stone-300 transition cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <span className="w-8 text-center text-2xl font-black font-display text-brazil-blue">
                  {haitiScore}
                </span>
                <button
                  type="button"
                  id="inc-haiti"
                  onClick={handleIncrementHaiti}
                  className="w-8 h-8 rounded-full bg-bbq-red text-white hover:brightness-110 active:scale-90 flex items-center justify-center border border-bbq-red transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            </div>

          </div>

          {/* FIRST GOAL SCORER (OPTIONAL) */}
          <div className="flex flex-col gap-1.5 mt-2.5 pt-3 border-t border-stone-100">
            <label className="text-[11px] font-black uppercase text-brazil-blue/80 flex items-center justify-between" htmlFor="user-scorer">
              <span>⚽ Quem fará o 1º gol do jogo?</span>
              <span className="text-[9px] text-stone-400 lowercase font-bold tracking-tight">(não obrigatório)</span>
            </label>
            <input
              id="user-scorer"
              type="text"
              placeholder="Ex: Vinicius Jr, Pedro, Raphinha, etc."
              value={firstGoalScorer}
              onChange={(e) => setFirstGoalScorer(e.target.value)}
              className="w-full bg-stone-50 border-2 border-stone-200 focus:border-brazil-blue focus:ring-1 focus:ring-brazil-blue rounded-xl py-3 px-4 text-sm font-bold text-brazil-blue placeholder-stone-400 transition-all outline-none"
            />
          </div>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-red-100 border-2 border-bbq-red rounded-2xl text-center">
            <p className="text-xs text-bbq-red font-black">{errorMsg}</p>
          </div>
        )}

        {/* Promotional notice */}
        <div className="mt-auto px-1 flex items-start gap-2.5 bg-white p-4 rounded-2xl border-2 border-brazil-blue/15">
          <div className="p-1.5 rounded bg-brazil-blue/10 mt-0.5 shrink-0">
            <Star className="w-4 h-4 text-brazil-blue fill-brazil-blue" />
          </div>
          <p className="text-[11px] text-brazil-blue/80 font-bold leading-relaxed">
            *Após preencher, você precisará seguir o nosso Instagram oficial para liberar a <span className="text-bbq-red font-extrabold decoration-solid">Roleta Premiada</span> e receber prêmios incríveis!
          </p>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          id="btn-register-submit"
          className="relative overflow-hidden w-full bg-bbq-red hover:brightness-110 active:scale-[0.98] py-4 rounded-2xl font-black font-display text-white tracking-wide flex items-center justify-center gap-2 text-base shadow-lg shadow-black/20 transition-all cursor-pointer border-b-4 border-red-950 uppercase"
        >
          {/* Gleam light overlay effect */}
          <span className="absolute inset-x-0 top-0 h-1/2 bg-white/10" />
          
          ENVIAR PALPITE E AVANÇAR
          <Send className="w-4.5 h-4.5 stroke-[2.5]" />
        </button>

      </form>
    </div>
  );
}
