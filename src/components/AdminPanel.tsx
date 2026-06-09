import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  KeyRound, 
  Search, 
  Download, 
  Trash2, 
  X, 
  ExternalLink,
  Award,
  Smartphone,
  Trophy,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Prize } from '../types';

export interface RegistrationRecord {
  id: string;
  name: string;
  phone: string;
  cpf?: string;
  brazilScore: number;
  haitiScore: number;
  prizeTitle: string;
  prizeCode: string;
  timestamp: string;
}

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrize, setFilterPrize] = useState('ALL');

  const [activeTab, setActiveTab] = useState<'PALPITES' | 'JOGO_DA_SEMANA'>('PALPITES');
  
  const [team1Name, setTeam1Name] = useState(() => {
    try {
      const saved = localStorage.getItem('boutique_match_config');
      return saved ? JSON.parse(saved).team1Name : 'Brasil';
    } catch { return 'Brasil'; }
  });
  const [team1Flag, setTeam1Flag] = useState(() => {
    try {
      const saved = localStorage.getItem('boutique_match_config');
      return saved ? JSON.parse(saved).team1Flag : '🇧🇷';
    } catch { return '🇧🇷'; }
  });
  const [team2Name, setTeam2Name] = useState(() => {
    try {
      const saved = localStorage.getItem('boutique_match_config');
      return saved ? JSON.parse(saved).team2Name : 'Haiti';
    } catch { return 'Haiti'; }
  });
  const [team2Flag, setTeam2Flag] = useState(() => {
    try {
      const saved = localStorage.getItem('boutique_match_config');
      return saved ? JSON.parse(saved).team2Flag : '🇭🇹';
    } catch { return '🇭🇹'; }
  });
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  const handleSaveMatchConfig = () => {
    try {
      const config = {
        team1Name: team1Name.trim() || 'Brasil',
        team1Flag: team1Flag.trim() || '🇧🇷',
        team2Name: team2Name.trim() || 'Haiti',
        team2Flag: team2Flag.trim() || '🇭🇹'
      };
      localStorage.setItem('boutique_match_config', JSON.stringify(config));
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 3000);
    } catch (e) {
      alert('Erro ao salvar as configurações.');
    }
  };
  
  // Load all registration records
  const loadRecords = (): RegistrationRecord[] => {
    try {
      const saved = localStorage.getItem('boutique_all_registrations');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const [records, setRecords] = useState<RegistrationRecord[]>(loadRecords);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'boutique' && password === '@SucessoRafes#26') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Usuário ou senha inválidos. Tente novamente.');
    }
  };

  const handleClearDatabase = () => {
    const confirmFirst = window.confirm('Tem certeza de que deseja limpar TODO o banco de palpites? Esta ação é irreversível.');
    if (!confirmFirst) return;
    
    const confirmSecond = window.confirm('Deseja realmente apagar os registros permanentemente? Clique em OK para confirmar.');
    if (confirmSecond) {
      localStorage.removeItem('boutique_all_registrations');
      setRecords([]);
    }
  };

  // Export records to CSV for Excel
  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('Não há registros para exportar!');
      return;
    }

    // CSV Headers
    let csvContent = '\uFEFF'; // Add BOM for Excel Portuguese encoding UTF-8
    csvContent += 'ID;Nome;CPF;WhatsApp;Palpite Brasil;Palpite Haiti;Premio;Codigo Cupom;Data de Cadastro\n';

    records.forEach(r => {
      // Clean string fields from semicolons or linebreaks
      const cleanName = r.name.replace(/;/g, ',');
      const cleanPhone = r.phone.replace(/;/g, ',');
      const cleanCpf = (r.cpf || '').replace(/;/g, ',');
      const cleanPrize = r.prizeTitle.replace(/;/g, ',');
      
      csvContent += `${r.id};${cleanName};${cleanCpf};${cleanPhone};${r.brazilScore};${r.haitiScore};${cleanPrize};${r.prizeCode};${r.timestamp}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `palpites_boutique_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered registrations
  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.phone.replace(/\D/g, '').includes(searchQuery.replace(/\D/g, '')) ||
      (r.cpf || '').replace(/\D/g, '').includes(searchQuery.replace(/\D/g, ''));
    
    if (filterPrize === 'ALL') return matchesSearch;
    return matchesSearch && r.prizeTitle.toLowerCase().includes(filterPrize.toLowerCase());
  });

  // Calculate quick stats
  const totalGuesses = records.length;
  const beersWon = records.filter(r => r.prizeTitle.toLowerCase().includes('cerveja')).length;
  const discountsWon = records.filter(r => r.prizeTitle.includes('10%') || r.prizeTitle.includes('15%')).length;
  const freeShipping = records.filter(r => r.prizeTitle.toLowerCase().includes('entrega')).length;
  const giftsWon = records.filter(r => r.prizeTitle.toLowerCase().includes('presente')).length;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2rem] border-4 border-brazil-blue shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header bar */}
        <div className="bg-brazil-blue p-5 text-white flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brazil-yellow fill-brazil-yellow" />
            <span className="font-display font-black text-sm tracking-tight">
              BANCO DE RESPOSTAS INTEGRADO
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not Logged In Screen */}
        {!isLoggedIn ? (
          <form onSubmit={handleLoginSubmit} className="p-6 flex flex-col gap-4 text-brazil-blue">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-full bg-brazil-yellow/10 border-2 border-brazil-yellow flex items-center justify-center mx-auto mb-2 text-brazil-blue">
                <Lock className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="font-display font-black text-lg text-brazil-blue leading-tight">PINEL DE GERENCIAMENTO</h3>
              <p className="text-xs text-stone-500 font-bold mt-1">
                Acesse o painel para verificar cadastros, palpites e prêmios.
              </p>
            </div>

            {/* Login Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-stone-500">Usuário:</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder="Ex: boutique"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-stone-200 focus:border-brazil-blue rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-brazil-blue outline-none"
                />
              </div>
            </div>

            {/* Login Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-stone-500">Senha:</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-stone-200 focus:border-brazil-blue rounded-xl py-2.5 pl-10 pr-4 text-sm font-bold text-brazil-blue outline-none"
                />
              </div>
            </div>

            {loginError && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 text-xs text-center font-bold rounded-xl flex items-center justify-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="mt-2 w-full bg-bbq-red hover:brightness-110 py-3 rounded-xl font-display font-black text-white text-sm tracking-wide shadow-md transition cursor-pointer text-center uppercase"
            >
              Conectas no Banco
            </button>
          </form>
        ) : (
          /* LOGGED IN DATABASE SCREEN */
          <div className="flex-1 overflow-hidden flex flex-col bg-stone-50">
            
            {/* Tab selector */}
            <div className="flex border-b border-stone-200 bg-white select-none shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('PALPITES')}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition cursor-pointer ${
                  activeTab === 'PALPITES' 
                    ? 'border-brazil-blue text-brazil-blue bg-stone-50/50' 
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                📋 Palpites ({totalGuesses})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('JOGO_DA_SEMANA')}
                className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition cursor-pointer ${
                  activeTab === 'JOGO_DA_SEMANA' 
                    ? 'border-brazil-blue text-brazil-blue bg-stone-50/50' 
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                ⚽ Jogo da Semana
              </button>
            </div>
            
            {activeTab === 'PALPITES' ? (
              <>
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-4 gap-1.5 p-3.5 bg-white border-b border-stone-200 shrink-0">
                  <div className="bg-stone-50 p-2 rounded-xl text-center border border-stone-150">
                    <span className="block text-[9px] font-black text-stone-400 uppercase">Total</span>
                    <span className="text-base font-black text-brazil-blue leading-none block mt-0.5">{totalGuesses}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl text-center border border-stone-150">
                    <span className="block text-[9px] font-black text-orange-500 uppercase">Brejas</span>
                    <span className="text-base font-black text-orange-600 leading-none block mt-0.5">{beersWon}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl text-center border border-stone-150">
                    <span className="block text-[9px] font-black text-emerald-500 uppercase">Desconto</span>
                    <span className="text-base font-black text-emerald-600 leading-none block mt-0.5">{discountsWon}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded-xl text-center border border-stone-150">
                    <span className="block text-[9px] font-black text-purple-500 uppercase">Brindes</span>
                    <span className="text-base font-black text-purple-600 leading-none block mt-0.5">{giftsWon + freeShipping}</span>
                  </div>
                </div>

                {/* Filter controls */}
                <div className="p-3.5 bg-white border-b border-stone-200 flex flex-col gap-2 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nome ou celular..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 focus:border-brazil-blue text-xs font-bold rounded-xl py-2 pl-9 pr-4 text-brazil-blue outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 bg-stone-50/50 p-1 rounded-lg">
                    <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <select
                      value={filterPrize}
                      onChange={(e) => setFilterPrize(e.target.value)}
                      className="bg-transparent border-none rounded-lg p-1 text-[11px] font-bold text-brazil-blue outline-none cursor-pointer"
                    >
                      <option value="ALL">Todos os Prêmios</option>
                      <option value="Cerveja">Cerveja</option>
                      <option value="Desconto">Desconto</option>
                      <option value="Entrega">Entrega Grátis</option>
                      <option value="Presente">Brinde / Presente</option>
                      <option value="Não foi dessa vez">Tente mais uma vez</option>
                    </select>
                  </div>
                </div>

                {/* Table wrapper */}
                <div className="flex-1 overflow-y-auto">
                  {filteredRecords.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <span className="text-3xl">📭</span>
                      <p className="text-stone-500 font-bold text-xs mt-2">Nenhum palpite registrado encontrado.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-200 bg-white">
                      {filteredRecords.map((rec, index) => {
                        const cleanPhone = rec.phone.replace(/\D/g, '');
                        const waLink = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}`;
                        
                        return (
                          <div key={rec.id || index} className="p-3.5 hover:bg-stone-50 flex items-start gap-3 text-left">
                            <div className="w-6 h-6 rounded-full bg-brazil-green/10 text-brazil-green flex items-center justify-center font-bold text-xs font-mono shrink-0 select-none">
                              {records.length - records.indexOf(rec)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-black text-brazil-blue truncate leading-snug">
                                  {rec.name}
                                </h4>
                                <span className="font-mono text-[9px] text-stone-400 font-bold shrink-0">
                                  {rec.timestamp}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-1 wrap flex-wrap">
                                <span className="text-[10px] text-stone-500 font-semibold font-mono flex items-center gap-1">
                                  <Smartphone className="w-3 h-3 text-stone-400" />
                                  {rec.phone}
                                </span>
                                
                                {rec.cpf && (
                                  <span className="text-[9px] text-brazil-blue font-extrabold font-mono bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200 select-all">
                                    CPF: {rec.cpf}
                                  </span>
                                )}
                                
                                <a 
                                  href={waLink} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[9px] font-black text-emerald-600 uppercase tracking-tight flex items-center gap-0.5 hover:underline shrink-0"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" /> Direct WA
                                </a>
                              </div>

                              {/* Placar and Premio info inside card */}
                              <div className="mt-2 grid grid-cols-2 gap-1.5 p-2 bg-stone-50 rounded-lg border border-stone-150">
                                <div>
                                  <span className="block text-[8px] font-black text-stone-400 uppercase">Palpite:</span>
                                  <span className="text-[10px] font-black text-brazil-blue font-mono">
                                    {team1Flag} {rec.brazilScore} x {rec.haitiScore} {team2Flag}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[8px] font-black text-stone-400 uppercase">Prêmio:</span>
                                  <span className="text-[10px] font-black text-bbq-red truncate block" title={rec.prizeTitle}>
                                    🎁 {rec.prizeTitle}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Actions of Dashboard */}
                <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleClearDatabase}
                    className="px-3 py-2 border-2 border-red-200 hover:border-red-400 text-stone-400 hover:text-red-500 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-black uppercase"
                    title="Limpar todos os palpites"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Wipar Banco
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex-1 bg-brazil-green hover:brightness-115 text-white rounded-xl py-2.5 font-bold text-xs tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    Exportar CSV Excel
                  </button>
                </div>
              </>
            ) : (
              /* TAB: GAME CONFIGURATION */
              <div className="flex-1 overflow-y-auto p-5 flex flex-col justify-between bg-stone-50">
                <div className="flex flex-col gap-4 text-brazil-blue">
                  <div className="p-3 bg-brazil-yellow/15 border-2 border-dashed border-brazil-yellow rounded-2xl flex gap-3 text-left">
                    <span className="text-xl">⚽</span>
                    <p className="text-[11px] text-stone-600 font-bold leading-normal">
                      Defina o jogo ativo da semana. Ao salvar, todos os cabeçalhos, palpites e formulários de participação estarão atualizados automaticamente com os novos times e bandeiras!
                    </p>
                  </div>

                  {/* TEAM 1 */}
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col gap-3">
                    <h3 className="text-xs font-black uppercase text-brazil-blue flex items-center gap-1">
                      <span className="text-sm">🏠</span> Time de Casa (Team 1)
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase text-stone-400">Nome do Time:</span>
                        <input
                          type="text"
                          value={team1Name}
                          onChange={(e) => setTeam1Name(e.target.value)}
                          placeholder="Ex: Brasil"
                          className="w-full bg-stone-50 border border-stone-200 focus:border-brazil-blue rounded-xl p-2.5 text-xs font-bold text-brazil-blue outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase text-stone-400">Emoji da Bandeira:</span>
                        <input
                          type="text"
                          value={team1Flag}
                          onChange={(e) => setTeam1Flag(e.target.value)}
                          placeholder="Ex: 🇧🇷"
                          className="w-full bg-stone-50 border border-stone-150 focus:border-brazil-blue rounded-xl p-2.5 text-xs font-bold text-brazil-blue text-center outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* TEAM 2 */}
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 flex flex-col gap-3">
                    <h3 className="text-xs font-black uppercase text-brazil-blue flex items-center gap-1">
                      <span className="text-sm">✈️</span> Time de Fora (Team 2)
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase text-stone-400">Nome do Time:</span>
                        <input
                          type="text"
                          value={team2Name}
                          onChange={(e) => setTeam2Name(e.target.value)}
                          placeholder="Ex: Haiti"
                          className="w-full bg-stone-50 border border-stone-200 focus:border-brazil-blue rounded-xl p-2.5 text-xs font-bold text-brazil-blue outline-none"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black uppercase text-stone-400">Emoji da Bandeira:</span>
                        <input
                          type="text"
                          value={team2Flag}
                          onChange={(e) => setTeam2Flag(e.target.value)}
                          placeholder="Ex: 🇭🇹"
                          className="w-full bg-stone-50 border border-stone-150 focus:border-brazil-blue rounded-xl p-2.5 text-xs font-bold text-brazil-blue text-center outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {isSavedSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs text-center font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Configurações atualizadas com sucesso!</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-auto">
                  <button
                    type="button"
                    onClick={handleSaveMatchConfig}
                    className="w-full bg-bbq-red hover:bg-bbq-red/90 text-white rounded-xl py-3 font-display font-black text-sm tracking-wide shadow-md transition cursor-pointer text-center uppercase"
                  >
                    Salvar Jogo Ativo ⚽
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
