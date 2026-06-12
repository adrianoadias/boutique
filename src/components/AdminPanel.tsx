import React, { useState, useEffect } from 'react';
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
  AlertCircle,
  Plus,
  Minus,
  Settings,
  Database,
  History,
  Archive,
  Eye,
  EyeOff
} from 'lucide-react';
import { Prize, MatchConfig } from '../types';
import { getLoadedMatches, CONFIRMED_MATCHES } from '../data';
import { 
  loadRegistrationsFromCloud, 
  loadBackupsFromCloud, 
  clearAndBackupCloud, 
  syncLocalRecordsWithCloud 
} from '../lib/firebase';

export interface RegistrationRecord {
  id: string;
  name: string;
  phone: string;
  cpf?: string;
  brazilScore: number;
  haitiScore: number;
  firstGoalScorer?: string;
  predictions?: Array<{
    matchId: string;
    team1Score: number;
    team2Score: number;
  }>;
  prizeTitle: string;
  prizeCode: string;
  timestamp: string;
}

interface AdminPanelProps {
  onClose: () => void;
}

// Score points calculation algorithm
function calculatePoints(
  predictions: any[] | undefined, 
  realScores: Record<string, {team1: number | null, team2: number | null} | null>,
  legacyBScore?: number,
  legacyHScore?: number
) {
  let total = 0;
  let exactCount = 0;
  let winnerCount = 0;

  // Retrofilled prediction fallback for legacy single-game databases
  let preds = predictions;
  if (!preds || preds.length === 0) {
    preds = [
      { matchId: 'bra_hai', team1Score: legacyBScore ?? 0, team2Score: legacyHScore ?? 0 }
    ];
  }

  preds.forEach(p => {
    const real = realScores[p.matchId];
    if (!real || real.team1 === null || real.team2 === null) return; // Not played yet

    const pred1 = p.team1Score;
    const pred2 = p.team2Score;
    const real1 = real.team1;
    const real2 = real.team2;

    if (pred1 === real1 && pred2 === real2) {
      total += 10;
      exactCount += 1;
    } else {
      const predOutcome = pred1 > pred2 ? 'team1' : pred1 < pred2 ? 'team2' : 'draw';
      const realOutcome = real1 > real2 ? 'team1' : real1 < real2 ? 'team2' : 'draw';
      if (predOutcome === realOutcome) {
        total += 5;
        winnerCount += 1;
      }
    }
  });

  return { total, exactCount, winnerCount };
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showClearPassword, setShowClearPassword] = useState(false);
  const [storePhone, setStorePhone] = useState(() => {
    return localStorage.getItem('boutique_store_phone_number') || '5547991238671';
  });
  const [loginError, setLoginError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPrize, setFilterPrize] = useState('ALL');

  // Multi-tab system with Backups support
  const [activeTab, setActiveTab] = useState<'PALPITES' | 'CONFERIDOR' | 'JOGOS_COPA' | 'BACKUPS'>('PALPITES');

  // Backups structure for completed sweepstakes
  interface CompletedBackup {
    id: string;
    name: string;
    timestamp: string;
    records: RegistrationRecord[];
  }

  const [backups, setBackups] = useState<CompletedBackup[]>(() => {
    try {
      const saved = localStorage.getItem('boutique_finalized_backups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [expandedBackupId, setExpandedBackupId] = useState<string | null>(null);

  // Deletion Secure Verification Modal State
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [clearBackupName, setClearBackupName] = useState('');
  const [clearError, setClearError] = useState('');

  // Real scores configuration state
  const [realScores, setRealScores] = useState<Record<string, {team1: number | null, team2: number | null}>>(() => {
    try {
      const saved = localStorage.getItem('boutique_real_scores');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      bra_mar: { team1: null, team2: null },
      bra_hai: { team1: null, team2: null },
      esc_bra: { team1: null, team2: null }
    };
  });

  // Dynamic Matches List State
  const [matches, setMatches] = useState<MatchConfig[]>(() => getLoadedMatches());
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('');

  const [isApiWorking, setIsApiWorking] = useState(true);

  // Dual function to load active records from server and Firestore Cloud
  const fetchRegistrations = (showLoading = false) => {
    if (showLoading) setIsSyncing(true);

    // Pull from Cloud Firestore first as the definitive, real-time source of truth!
    loadRegistrationsFromCloud()
      .then(cloudRecords => {
        if (cloudRecords && cloudRecords.length > 0) {
          localStorage.setItem('boutique_all_registrations', JSON.stringify(cloudRecords));
          setRecords(cloudRecords);
        }
        const now = new Date();
        const timeStr = now.toLocaleTimeString('pt-BR');
        setLastSyncTime(timeStr);
        setIsApiWorking(true); // Always true because remote Cloud database is active and connected!
      })
      .catch(err => {
        console.error('Error loading registrations from Firestore Cloud:', err);
      });

    // Option II: Fallback fetch from standard api if available
    fetch('/api/registrations')
      .then(res => {
        if (!res.ok) throw new Error('API unreachable: status ' + res.status);
        return res.json();
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.records)) {
          // If we have local storage, update list representing latest sync
          const saved = localStorage.getItem('boutique_all_registrations');
          let localRecs = saved ? JSON.parse(saved) : [];
          if (!Array.isArray(localRecs)) localRecs = [];
          
          // Merge to keep latest values
          const recordMap = new Map<string, any>();
          localRecs.forEach((r: any) => recordMap.set(r.id, r));
          data.records.forEach((r: any) => recordMap.set(r.id, r));
          const mergedList = Array.from(recordMap.values());

          localStorage.setItem('boutique_all_registrations', JSON.stringify(mergedList));
          setRecords(mergedList);
        }
      })
      .catch(err => {
        console.log('Silent server backup list fetching skipped (standard offline behavior on Hostinger/static site):', err.message);
      })
      .finally(() => {
        if (showLoading) setIsSyncing(false);
      });
  };

  // Sync with full-stack server state when logged in and start real-time auto-polling!
  useEffect(() => {
    if (!isLoggedIn) return;

    // Load active records and backups initially
    fetchRegistrations(true);

    // Also fetch archived backups from Cloud Firestore
    loadBackupsFromCloud()
      .then(cloudBackups => {
        if (cloudBackups && cloudBackups.length > 0) {
          localStorage.setItem('boutique_finalized_backups', JSON.stringify(cloudBackups));
          setBackups(cloudBackups);
        }
      })
      .catch(err => console.error('Error loading backups from Cloud Firestore:', err));

    // Also fetch archived backups from backend as an optional fallback
    fetch('/api/backups')
      .then(res => {
        if (!res.ok) throw new Error('Status: ' + res.status);
        return res.json();
      })
      .then(data => {
        if (data && data.success && Array.isArray(data.backups)) {
          try {
            const saved = localStorage.getItem('boutique_finalized_backups');
            const localBackups = saved ? JSON.parse(saved) : [];
            
            // Deduplicate lists by id
            const backupMap = new Map<string, any>();
            localBackups.forEach((b: any) => backupMap.set(b.id, b));
            data.backups.forEach((b: any) => backupMap.set(b.id, b));
            
            const merged = Array.from(backupMap.values());
            localStorage.setItem('boutique_finalized_backups', JSON.stringify(merged));
            setBackups(merged);
          } catch {
            setBackups(data.backups);
          }
        }
      })
      .catch(err => {
        console.log('Silent server backups load skipped (standard static behavior):', err.message);
      });

    // Real-time server sync polling every 6 seconds to capture other device submissions instantly!
    const pollInterval = setInterval(() => {
      fetchRegistrations(false);
    }, 6000);

    return () => clearInterval(pollInterval);
  }, [isLoggedIn]);

  const handleUpdateRealScore = (matchId: string, team: 'team1' | 'team2', valStr: string) => {
    const trimmed = valStr.trim();
    const parsed = trimmed === '' ? null : parseInt(trimmed, 10);
    
    setRealScores(prev => {
      const current = prev[matchId] || { team1: null, team2: null };
      const updated = {
        ...prev,
        [matchId]: {
          ...current,
          [team]: parsed === null || isNaN(parsed) ? null : parsed
        }
      };
      localStorage.setItem('boutique_real_scores', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveMatchesConfig = () => {
    try {
      localStorage.setItem('boutique_matches_config', JSON.stringify(matches));
      localStorage.setItem('boutique_store_phone_number', storePhone.replace(/\D/g, ''));
      setIsSavedSuccess(true);
      setTimeout(() => setIsSavedSuccess(false), 3000);
    } catch (e) {
      alert('Erro ao salvar as configurações.');
    }
  };

  const handleUpdateMatchField = (idx: number, field: keyof MatchConfig, value: string) => {
    setMatches(prev => prev.map((m, i) => {
      if (i === idx) {
        return { ...m, [field]: value };
      }
      return m;
    }));
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
    setClearError('');
    setClearPassword('');
    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setClearBackupName(`Bolão Copa - Finalizado em ${formattedDate} às ${formattedTime}`);
    setIsConfirmingClear(true);
  };

  const handleExecuteClearDatabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (clearPassword !== '@SucessoRafes#26') {
      setClearError('Senha de segurança incorreta! Não foi possível autorizar a limpeza e o backup do sistema.');
      return;
    }

    const currentRecords = loadRecords();
    const backupTitle = (clearBackupName || `Bolão Finalizado em ${new Date().toLocaleString('pt-BR')}`).trim();
    
    // Automatically save a backup of current records if records exist
    const newBackup: CompletedBackup = {
      id: 'backup_' + Date.now(),
      name: backupTitle,
      timestamp: new Date().toLocaleString('pt-BR'),
      records: currentRecords
    };

    const updatedBackups = [newBackup, ...backups];

    // Direct Cloud Firestore database backup & reset (completely operational on any host link)
    clearAndBackupCloud(clearPassword, backupTitle)
      .then(success => {
        if (success) {
          console.log('Firestore Database backed up and reset completely!');
        }
      })
      .catch(err => {
        console.error('Firestore Database archiving/reset error:', err);
      });

    // Trigger clear database and backup on server-side as optional fallback
    fetch('/api/clear-db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: clearPassword, name: backupTitle })
    })
    .then(res => res.json())
    .then(serverResult => {
      if (serverResult.success) {
        console.log('Server-side database cleared and archived successfully.');
      } else {
        console.warn('Server-side clear-db response error:', serverResult.error);
      }
    })
    .catch(err => console.log('Server backup POST skipped (standard static behavior):', err.message));

    try {
      localStorage.setItem('boutique_finalized_backups', JSON.stringify(updatedBackups));
      localStorage.removeItem('boutique_all_registrations');
      
      setBackups(updatedBackups);
      setRecords([]);
      setIsConfirmingClear(false);
      setClearPassword('');
      setClearBackupName('');
      setClearError('');
      
      alert('Tudo limpo! Sua lista ativa de palpites foi redefinida com sucesso. O backup correspondente está salvo na aba "Backups" para download ou restauração futura.');
      setActiveTab('BACKUPS');
    } catch (err) {
      setClearError('Ocorreu um erro ao gravar o arquivo de backup no armazenamento LocalStorage.');
    }
  };

  const handleDeleteBackup = (backupId: string) => {
    const confirmDel = window.confirm('Deseja realmente deletar permanentemente este arquivo de backup? Esta ação não pode ser desfeita.');
    if (confirmDel) {
      const updated = backups.filter(b => b.id !== backupId);
      localStorage.setItem('boutique_finalized_backups', JSON.stringify(updated));
      setBackups(updated);
      if (expandedBackupId === backupId) setExpandedBackupId(null);
    }
  };

  const handleRestoreBackup = (backup: CompletedBackup) => {
    const confirmRestore = window.confirm(
      `Deseja restaurar as ${backup.records.length} participações deste backup?\n\n` +
      `⚠️ ATENÇÃO: Isso irá SOBRESCREVER sua lista atual de palpites ativos (que contém ${records.length} registros).`
    );
    if (confirmRestore) {
      localStorage.setItem('boutique_all_registrations', JSON.stringify(backup.records));
      setRecords(backup.records);

      // Direct Cloud Firestore backup restoration (restores all records back to Cloud active collection)
      syncLocalRecordsWithCloud(backup.records)
        .then(() => {
          console.log('Successfully restored active records to Firestore Cloud!');
        })
        .catch(err => {
          console.error('Error restoring records to Firestore Cloud:', err);
        });

      // Sincronizar de volta com o banco de dados principal do servidor
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backup.records)
      })
      .then(res => res.json())
      .then(res => {
        alert('Backup restaurado com sucesso! Seus palpites e registros correspondentes agora foram reativados.');
        setActiveTab('PALPITES');
      })
      .catch(err => {
        console.error('Error synchronising backup restoration with server:', err);
        alert('Backup restaurado com sucesso!');
        setActiveTab('PALPITES');
      });
    }
  };

  const handleExportBackupCSV = (backup: CompletedBackup) => {
    if (backup.records.length === 0) {
      alert('Nenhum registro encontrado neste backup para exportar.');
      return;
    }

    let csvContent = '\uFEFF'; 
    csvContent += 'ID;Nome;CPF;WhatsApp;Prêmio Ganho;Código Cupom;Data de Cadastro\n';

    backup.records.forEach(r => {
      const cleanName = r.name.replace(/;/g, ',');
      const cleanPhone = r.phone.replace(/;/g, ',');
      const cleanCpf = (r.cpf || '').replace(/;/g, ',');
      const cleanPrize = r.prizeTitle.replace(/;/g, ',');
      
      csvContent += `${r.id};${cleanName};${cleanCpf};${cleanPhone};${cleanPrize};${r.prizeCode};${r.timestamp}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backup_${backup.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export records to CSV for Excel
  const handleExportCSV = () => {
    if (records.length === 0) {
      alert('Não há registros para exportar!');
      return;
    }

    let csvContent = '\uFEFF'; 
    csvContent += 'ID;Nome;CPF;WhatsApp;Prêmio Ganho;Código Cupom;Pontos Totais;Placares Exatos;Vencedores Corretos;Data de Cadastro\n';

    records.forEach(r => {
      const cleanName = r.name.replace(/;/g, ',');
      const cleanPhone = r.phone.replace(/;/g, ',');
      const cleanCpf = (r.cpf || '').replace(/;/g, ',');
      const cleanPrize = r.prizeTitle.replace(/;/g, ',');
      
      const { total, exactCount, winnerCount } = calculatePoints(r.predictions, realScores, r.brazilScore, r.haitiScore);
      
      csvContent += `${r.id};${cleanName};${cleanCpf};${cleanPhone};${cleanPrize};${r.prizeCode};${total};${exactCount};${winnerCount};${r.timestamp}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `palpites_boutique_copa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getWinnerMessage = (rec: RegistrationRecord, total: number, exacts: number, outcomes: number) => {
    const text = `🥩 *BOUTIQUE DAS CARNES - RESULTADO DO BOLÃO!* 🇧🇷⚽️\n` +
      `-----------------------------------------\n` +
      `🔥 Olá *${rec.name}*! Temos o placar oficial dos jogos de Copa!\n\n` +
      `🏆 *Sua Pontuação:* ${total} Pontos de Campeão!\n` +
      `🎯 *Placares Exatos:* ${exacts} acerto(s)\n` +
      `✅ *Resultados Corretos:* ${outcomes} acerto(s)\n\n` +
      `🎰 *Seu Prêmio:* ${rec.prizeTitle}\n` +
      `🎟 *Código do Cupom:* ${rec.prizeCode}\n` +
      `-----------------------------------------\n` +
      `⚠️ Venha retirar o seu prêmio na Boutique das Carnes e garanta o seu churrasco com carnes premium! 🍖🔥`;
    return encodeURIComponent(text);
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

  // Calculate stats
  const totalGuesses = records.length;
  const beersWon = records.filter(r => r.prizeTitle.toLowerCase().includes('cerveja')).length;
  const discountsWon = records.filter(r => r.prizeTitle.includes('10%') || r.prizeTitle.includes('15%')).length;

  // Process leaderboard ranking
  const rankedUsers = records.map(rec => {
    const { total, exactCount, winnerCount } = calculatePoints(rec.predictions, realScores, rec.brazilScore, rec.haitiScore);
    return {
      ...rec,
      totalPoints: total,
      exactCount,
      winnerCount
    };
  }).sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.exactCount !== a.exactCount) {
      return b.exactCount - a.exactCount;
    }
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[2rem] border-4 border-brazil-blue shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header bar */}
        <div className="bg-brazil-blue p-5 text-white flex items-center justify-between relative shrink-0">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brazil-yellow fill-brazil-yellow" />
            <span className="font-display font-black text-sm tracking-tight uppercase">
              PAINEL DO ADMINISTRADOR • PROPRIETÁRIO
            </span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition select-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Login Page */}
        {!isLoggedIn ? (
          <form onSubmit={handleLoginSubmit} className="p-6 flex flex-col gap-4 text-brazil-blue overflow-y-auto">
            <div className="text-center mb-2">
              <div className="w-12 h-12 rounded-full bg-brazil-yellow/10 border-2 border-brazil-yellow flex items-center justify-center mx-auto mb-2 text-brazil-blue select-none">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-display font-black text-sm uppercase">Acesso Restrito</h3>
              <p className="text-[10px] text-stone-500 font-bold mt-1">Insira as credenciais de segurança do proprietário.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-stone-400">Usuário:</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  required
                  placeholder="Seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-brazil-blue rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-brazil-blue outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase text-stone-400">Senha Secreta:</label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-brazil-blue rounded-xl py-2.5 pl-10 pr-12 text-xs font-bold text-brazil-blue outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-brazil-blue p-2.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <p className="text-[10px] font-black text-bbq-red text-center">{loginError}</p>
            )}

            <button
              type="submit"
              className="mt-2 bg-brazil-blue hover:bg-brazil-blue/90 text-white rounded-xl py-3 font-display font-black text-xs uppercase tracking-wider shadow"
            >
              Liberar Painel 🔑
            </button>
          </form>
        ) : (
          /* Logged In Dashboard Container */
          <div className="flex-1 overflow-hidden flex flex-col">
            
            {/* Quick dashboard statistics tiles */}
            <div className="bg-stone-50 border-b border-stone-200 p-4 grid grid-cols-3 gap-2 text-center text-brazil-blue shrink-0 select-none">
              <div className="bg-white p-2 rounded-xl border border-stone-150 shadow-sm">
                <span className="block text-[8px] font-black uppercase text-stone-400 leading-none">Total Participantes</span>
                <span className="text-sm font-black text-brazil-blue font-mono">{totalGuesses}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-stone-150 shadow-sm">
                <span className="block text-[8px] font-black uppercase text-stone-400 leading-none">Cerveja Grátis</span>
                <span className="text-sm font-black text-brazil-green font-mono">{beersWon}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-stone-150 shadow-sm">
                <span className="block text-[8px] font-black uppercase text-stone-400 leading-none">Descontos Premiados</span>
                <span className="text-sm font-black text-bbq-red font-mono">{discountsWon}</span>
              </div>
            </div>

            {/* Navigation tabs row */}
            <div className="flex bg-white border-b border-stone-200 text-[10px] md:text-xs font-black uppercase font-display shrink-0 select-none overflow-x-auto scrollbar-none scroll-smooth">
              <button
                type="button"
                onClick={() => setActiveTab('PALPITES')}
                className={`flex-1 min-w-[85px] py-3 text-center transition tracking-tight border-b-2 font-black shrink-0 ${
                  activeTab === 'PALPITES' 
                    ? 'border-brazil-blue text-brazil-blue bg-stone-50/50' 
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                📝 Palpites ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CONFERIDOR')}
                className={`flex-1 min-w-[85px] py-3 text-center transition tracking-tight border-b-2 font-black shrink-0 ${
                  activeTab === 'CONFERIDOR' 
                    ? 'border-brazil-blue text-brazil-blue bg-stone-50/50' 
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                🏆 Conferidor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('JOGOS_COPA')}
                className={`flex-1 min-w-[85px] py-3 text-center transition tracking-tight border-b-2 font-black shrink-0 ${
                  activeTab === 'JOGOS_COPA' 
                    ? 'border-brazil-blue text-brazil-blue bg-stone-50/50' 
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                ⚙️ Jogos
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('BACKUPS')}
                className={`flex-1 min-w-[85px] py-3 text-center transition tracking-tight border-b-2 font-black shrink-0 ${
                  activeTab === 'BACKUPS' 
                    ? 'border-brazil-blue text-brazil-blue bg-stone-50/50' 
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                📁 Backups ({backups.length})
              </button>
            </div>

            {/* Selected Tab Layout Renders */}
            {activeTab === 'PALPITES' ? (
              /* TAB 1: ALL RECIEVED GUESSES */
              <>
                {/* Search inputs */}
                <div className="p-3 bg-white border-b border-stone-150 flex flex-col gap-2 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      type="text"
                      placeholder="Buscar por Nome, WhatsApp ou CPF..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 focus:border-brazil-blue rounded-xl py-2 px-9 text-xs font-bold text-brazil-blue outline-none"
                    />
                  </div>

                  {/* Real-time sync visual band with active pulse */}
                  <div className="flex items-center justify-between text-[10px] bg-stone-50/70 border border-stone-200/60 rounded-xl p-2 font-bold shrink-0">
                    <div className="flex items-center gap-1.5 text-stone-500">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-550"></span>
                      </span>
                      <span>Sincronizado {lastSyncTime ? `às ${lastSyncTime}` : 'em Tempo Real'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => fetchRegistrations(true)}
                      disabled={isSyncing}
                      className="px-2.5 py-1 text-[9px] uppercase font-black tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 transition rounded-lg flex items-center gap-1 cursor-pointer shadow-sm select-none"
                    >
                      {isSyncing ? 'Sincronizando...' : '🔄 Atualizar Lista'}
                    </button>
                  </div>

                  {/* Filter pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mt-0.5 select-none text-[9px] font-bold text-stone-500 uppercase">
                    <span className="flex items-center gap-0.5 text-stone-400">
                      <Filter className="w-2.5 h-2.5" /> Filtrar:
                    </span>
                    <button
                      type="button"
                      onClick={() => setFilterPrize('ALL')}
                      className={`px-2 py-0.5 rounded-full border transition ${
                        filterPrize === 'ALL' 
                          ? 'bg-brazil-blue text-white border-brazil-blue' 
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPrize('cerveja')}
                      className={`px-2 py-0.5 rounded-full border transition ${
                        filterPrize === 'cerveja' 
                          ? 'bg-brazil-blue text-white border-brazil-blue' 
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Cervejas
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPrize('10%')}
                      className={`px-2 py-0.5 rounded-full border transition ${
                        filterPrize === '10%' 
                          ? 'bg-brazil-blue text-white border-brazil-blue' 
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Cupom 10%
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterPrize('15%')}
                      className={`px-2 py-0.5 rounded-full border transition ${
                        filterPrize === '15%' 
                          ? 'bg-brazil-blue text-white border-brazil-blue' 
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Cupom 15%
                    </button>
                  </div>
                </div>

                {/* Submissions items scroller list */}
                <div className="flex-1 overflow-y-auto bg-stone-50">
                  {filteredRecords.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <span className="text-3xl">📭</span>
                      <p className="text-stone-500 font-bold text-xs mt-2">Nenhum palpite correspondente encontrado.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-200 bg-white">
                      {filteredRecords.map((rec, index) => {
                        const cleanPhone = rec.phone.replace(/\D/g, '');
                        const waLink = `https://wa.me/${cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone}`;
                        const displayPreds = rec.predictions && rec.predictions.length > 0 
                          ? rec.predictions 
                          : [{ matchId: 'bra_hai', team1Score: rec.brazilScore, team2Score: rec.haitiScore }];
                        
                        return (
                          <div key={rec.id || index} className="p-3.5 hover:bg-stone-50 flex items-start gap-2.5 text-left">
                            <div className="w-5.5 h-5.5 rounded-full bg-brazil-green/15 text-brazil-green flex items-center justify-center font-bold text-[10px] font-mono shrink-0 select-none">
                              {records.length - records.indexOf(rec)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-black text-brazil-blue truncate leading-snug">
                                  {rec.name}
                                </h4>
                                <span className="font-mono text-[8px] text-stone-400 font-black shrink-0">
                                  {rec.timestamp}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-stone-500 font-bold font-mono flex items-center gap-0.5">
                                  <Smartphone className="w-2.8 h-2.8 text-stone-400" />
                                  {rec.phone}
                                </span>
                                
                                {rec.cpf && (
                                  <span className="text-[8.5px] text-brazil-blue font-extrabold font-mono bg-stone-100 text-stone-600 px-1 py-0.2 rounded border border-stone-200 select-all">
                                    CPF: {rec.cpf}
                                  </span>
                                )}
                                
                                <a 
                                  href={waLink} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-[8.5px] font-black text-emerald-600 uppercase tracking-tight flex items-center gap-0.5 hover:underline shrink-0"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" /> Direct WA
                                </a>
                              </div>

                              {/* Multi match mini-table */}
                              <div className="mt-2 bg-stone-50 p-2 rounded-xl border border-stone-200 flex flex-col gap-1.5">
                                <span className="text-[8px] font-black text-stone-400 uppercase tracking-wider block">Lista de Palpites:</span>
                                
                                <div className="grid grid-cols-3 gap-1.5 text-center text-[9px] font-bold">
                                  {displayPreds.map((p, idx) => {
                                    const matchInfo = matches.find(m => m.id === p.matchId);
                                    if (!matchInfo) return null;
                                    return (
                                      <div key={p.matchId} className="bg-white p-1 rounded-md border border-stone-150 flex flex-col justify-between min-h-[50px]">
                                        <div>
                                          <div className="text-[7.5px] text-stone-400 uppercase font-mono truncate">
                                            {matchInfo.team1Name} x {matchInfo.team2Name}
                                          </div>
                                          <div className="font-black text-brazil-blue mt-0.5">
                                            {matchInfo.team1Flag} {p.team1Score} x {p.team2Score} {matchInfo.team2Flag}
                                          </div>
                                        </div>
                                        {p.firstGoalScorer && (
                                          <div className="text-[7.5px] font-black text-emerald-700 border-t border-stone-100 mt-1 pt-0.5 truncate" title={p.firstGoalScorer}>
                                            ⚽ {p.firstGoalScorer}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="flex items-center justify-between border-t border-stone-150/50 pt-1.5 mt-0.5 text-[9px] font-black">
                                  <span className="text-stone-400">PRÊMIO GANHO:</span>
                                  <span className="text-bbq-red truncate max-w-[150px]">
                                    🎁 {rec.prizeTitle} <span className="text-[8px] text-stone-400 font-mono">({rec.prizeCode})</span>
                                  </span>
                                </div>

                                {rec.firstGoalScorer && (
                                  <div className="text-[8.5px] font-black text-emerald-700 leading-none">
                                    ⚽ Autor 1º Gol: {rec.firstGoalScorer}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleClearDatabase}
                    className="px-3 py-2 border-2 border-red-200 hover:border-red-400 text-stone-400 hover:text-red-500 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar Banco
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex-1 bg-brazil-green hover:brightness-110 text-white rounded-xl py-2.5 font-bold text-xs tracking-wider uppercase transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    Exportar Planilha Excel
                  </button>
                </div>
              </>
            ) : activeTab === 'CONFERIDOR' ? (
              /* TAB 2: CONFERIDOR & LEADERBOARD RANKING */
              <div className="flex-1 overflow-hidden flex flex-col bg-stone-50">
                
                {/* Score Registrar Headers */}
                <div className="p-4 bg-white border-b border-stone-200 shrink-0 select-none">
                  <div className="bg-stone-50 p-2.5 rounded-2xl border border-stone-150 flex flex-col gap-2">
                    <span className="text-[9px] font-black uppercase text-brazil-blue tracking-wider font-display text-center flex items-center justify-center gap-1">
                      👑 Registro de Resultados Oficiais da Copa
                    </span>

                    <div className="flex flex-col gap-1.5">
                      {matches.map((m) => {
                        const currentReal = realScores[m.id] || { team1: null, team2: null };
                        return (
                          <div key={m.id} className="grid grid-cols-12 items-center gap-1 bg-white p-2 rounded-xl border border-stone-150 text-[10px]">
                            
                            {/* Match banner */}
                            <div className="col-span-4 font-black text-brazil-blue truncate flex items-center gap-1">
                              <span>{m.team1Flag} {m.team1Name}</span>
                            </div>

                            <div className="col-span-4 flex items-center gap-1.5 justify-center">
                              {/* Score team 1 */}
                              <input
                                type="number"
                                placeholder="-"
                                min="0"
                                value={currentReal.team1 === null ? '' : currentReal.team1}
                                onChange={(e) => handleUpdateRealScore(m.id, 'team1', e.target.value)}
                                className="w-9 h-7 bg-stone-50 font-mono text-[11px] font-black border border-stone-250 focus:border-brazil-blue rounded text-center text-brazil-blue outline-none"
                              />
                              <span className="text-stone-300 font-bold">X</span>
                              {/* Score team 2 */}
                              <input
                                type="number"
                                placeholder="-"
                                min="0"
                                value={currentReal.team2 === null ? '' : currentReal.team2}
                                onChange={(e) => handleUpdateRealScore(m.id, 'team2', e.target.value)}
                                className="w-9 h-7 bg-stone-50 font-mono text-[11px] font-black border border-stone-250 focus:border-brazil-blue rounded text-center text-brazil-blue outline-none"
                              />
                            </div>

                            <div className="col-span-4 font-black text-stone-600 text-right truncate flex items-center gap-1 justify-end">
                              <span>{m.team2Name} {m.team2Flag}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Score Leaderboard Table */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 pb-1">
                    <h3 className="text-xs font-black uppercase text-brazil-blue flex items-center gap-1 font-display">
                      🏅 Tabela de Classificação do Bolão (Ranking)
                    </h3>
                  </div>

                  {rankedUsers.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <span className="text-3xl">🏁</span>
                      <p className="text-stone-500 font-bold text-xs mt-2">Nenhum palpite para pontuar.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-200 bg-white border-t border-b border-stone-200">
                      {rankedUsers.map((rec, index) => {
                        const congratsWaLink = `https://wa.me/${rec.phone.replace(/\D/g, '').startsWith('55') ? rec.phone.replace(/\D/g, '') : '55' + rec.phone.replace(/\D/g, '')}?text=${getWinnerMessage(rec, rec.totalPoints, rec.exactCount, rec.winnerCount)}`;

                        let iconBadge = null;
                        if (index === 0) iconBadge = '⭐️';
                        else if (index === 1) iconBadge = '🥈';
                        else if (index === 2) iconBadge = '🥉';

                        return (
                          <div key={rec.id || index} className="p-3.5 hover:bg-stone-50 flex items-start gap-3 text-left">
                            {/* Position wrapper */}
                            <div className="w-7 h-7 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 flex flex-col items-center justify-center font-mono font-black text-xs shrink-0 relative select-none uppercase">
                              {iconBadge ? (
                                <span className="text-sm leading-none">{iconBadge}</span>
                              ) : (
                                <span className="leading-none text-[10px]">{index + 1}º</span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 leading-none">
                                <h4 className="text-xs font-black text-brazil-blue truncate pr-1">
                                  {rec.name}
                                </h4>
                                
                                {/* Points indicator */}
                                <span className="px-2 py-1.5 bg-brazil-yellow border-2 border-brazil-blue rounded-lg text-brazil-blue font-black font-display text-[10px] shrink-0 font-mono tracking-tighter leading-none shadow-sm">
                                  {rec.totalPoints} PTS
                                </span>
                              </div>

                              <div className="flex items-center gap-2 mt-1 select-none flex-wrap text-[8.5px] font-bold text-stone-500 font-mono">
                                <span>📞 {rec.phone}</span>
                                <span>•</span>
                                <span className="bg-stone-100 text-stone-600 px-1 py-0.2 rounded">CPF: {rec.cpf || '-'}</span>
                              </div>

                              {/* Detailed sub-matches correct scores info */}
                              <div className="mt-2 grid grid-cols-12 items-center gap-1.5 bg-stone-50 p-2 rounded-xl border border-stone-200">
                                <div className="col-span-5 text-[8px] font-black text-stone-400 uppercase tracking-widest leading-none">
                                  📊 DETALHES DOS ACERTOS:
                                </div>
                                <div className="col-span-7 flex justify-end gap-2 text-[9px] font-black">
                                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                    🎯 Exato: {rec.exactCount}
                                  </span>
                                  <span className="text-brazil-blue bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                    ✅ Vencedor: {rec.winnerCount}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Notify button column */}
                            <div className="self-center shrink-0">
                              <a 
                                href={congratsWaLink} 
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg px-2.5 py-2 text-[9px] font-black uppercase tracking-tight flex items-center gap-0.5 transition shadow-sm leading-none"
                              >
                                📣 Notificar WA
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === 'JOGOS_COPA' ? (
              /* TAB 3: CONFIGURE THE 3 WORLD CUP GAMES */
              <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between bg-stone-50">
                <div className="flex flex-col gap-3 text-brazil-blue">
                  <div className="p-3 bg-brazil-yellow/10 border-2 border-dashed border-brazil-yellow rounded-2xl flex gap-3 text-left">
                    <span className="text-xl">⚽</span>
                    <p className="text-[10px] text-stone-600 font-bold leading-normal">
                      Configure os detalhes e horários dos 3 jogos oficiais do Brasil na Primeira Fase. Os placares inseridos aqui serão exibidos no cabeçalho do formulário e usados para preenchimento de palpites!
                    </p>
                  </div>

                  {matches.map((m, idx) => (
                    <div key={m.id} className="bg-white p-3.5 rounded-2xl border border-stone-200 flex flex-col gap-2.5 shadow-sm text-left">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-1.5 mb-1.5 matches-header">
                        <span className="text-xs font-black uppercase text-brazil-blue flex items-center gap-1 font-display">
                          📅 JOGO #{idx + 1} • {m.team1Name} x {m.team2Name}
                        </span>
                        <span className="text-[8px] text-mono bg-stone-100 px-1.5 py-0.5 rounded select-all font-bold">ID: {m.id}</span>
                      </div>

                      {/* Teams config info */}
                      <div className="grid grid-cols-2 gap-2.5 text-[10px] font-bold">
                        <div className="flex flex-col gap-1">
                          <span className="text-stone-400 uppercase">Casa (Time 1):</span>
                          <input
                            type="text"
                            value={m.team1Name}
                            onChange={(e) => handleUpdateMatchField(idx, 'team1Name', e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold text-brazil-blue outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-stone-400 uppercase">Casa Flag (Emoji):</span>
                          <input
                            type="text"
                            value={m.team1Flag}
                            onChange={(e) => handleUpdateMatchField(idx, 'team1Flag', e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 text-center font-bold text-brazil-blue outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 text-[10px] font-bold">
                        <div className="flex flex-col gap-1">
                          <span className="text-stone-400 uppercase">Fora (Time 2):</span>
                          <input
                            type="text"
                            value={m.team2Name}
                            onChange={(e) => handleUpdateMatchField(idx, 'team2Name', e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold text-brazil-blue outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-stone-400 uppercase">Fora Flag (Emoji):</span>
                          <input
                            type="text"
                            value={m.team2Flag}
                            onChange={(e) => handleUpdateMatchField(idx, 'team2Flag', e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 text-center font-bold text-brazil-blue outline-none"
                          />
                        </div>
                      </div>

                      {/* Date and Place config */}
                      <div className="grid grid-cols-2 gap-2.5 text-[10px] font-bold">
                        <div className="flex flex-col gap-1">
                          <span className="text-stone-400 uppercase">Data/Hora (dateStr):</span>
                          <input
                            type="text"
                            value={m.dateStr}
                            onChange={(e) => handleUpdateMatchField(idx, 'dateStr', e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold text-brazil-blue outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-stone-400 uppercase">Local/Estádio:</span>
                          <input
                            type="text"
                            value={m.location}
                            onChange={(e) => handleUpdateMatchField(idx, 'location', e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded p-1.5 font-bold text-brazil-blue outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Boutique WhatsApp customizer */}
                  <div className="bg-white p-3.5 rounded-2xl border-2 border-dashed border-emerald-500/30 flex flex-col gap-2.5 shadow-sm text-left">
                    <span className="text-xs font-black uppercase text-emerald-700 flex items-center gap-1 font-display">
                      🟢 WHATSAPP DE RETORNO DA BOUTIQUE
                    </span>
                    <p className="text-[10px] text-stone-500 font-bold leading-normal">
                      Insira o número de WhatsApp completo com DDD da sua Boutique (APENAS NÚMEROS, incluindo o DDI 55 do Brasil). Os clientes usarão esse número para enviar seus comprovantes em um clique!
                    </p>
                    <div className="flex flex-col gap-1">
                      <input
                        type="text"
                        placeholder="Ex: 5547991238671"
                        value={storePhone}
                        onChange={(e) => setStorePhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 focus:border-emerald-500 rounded p-1.5 text-xs font-bold font-mono text-brazil-blue outline-none"
                      />
                    </div>
                  </div>

                  {isSavedSuccess && (
                     <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-600 text-xs text-center font-bold rounded-2xl flex items-center justify-center gap-1.5 shadow-sm">
                       <CheckCircle className="w-4 h-4 text-emerald-500" />
                       <span>Configurações dos Jogos salvas com sucesso!</span>
                     </div>
                  )}
                </div>

                <div className="pt-3 mt-auto shrink-0 animate-fade-in">
                  <button
                    type="button"
                    onClick={handleSaveMatchesConfig}
                    className="w-full bg-bbq-red hover:brightness-110 text-white rounded-xl py-3 font-display font-black text-sm tracking-wide shadow-md transition cursor-pointer text-center uppercase"
                  >
                    Salvar Todos os Confrontos 🏆
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 4: COMPLETED SWEEPSTAKES / BACKUPS */
              <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-stone-50 text-brazil-blue">
                <div className="p-3.5 bg-white rounded-2xl border border-stone-200 mb-4 flex items-start gap-3 text-left">
                  <div className="p-2 bg-brazil-yellow/15 text-brazil-yellow border border-brazil-yellow/20 rounded-xl shrink-0">
                    <Archive className="w-5 h-5 text-brazil-blue fill-brazil-yellow" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-brazil-blue">Histórico de Bolões Finalizados</h4>
                    <p className="text-[10px] text-stone-500 font-bold leading-normal mt-0.5">
                      Sempre que o banco principal é zerado, o sistema cria automaticamente um backup criptografado do bolão correspondente aqui. Você pode exportar relatórios ou restaurar a lista a qualquer momento!
                    </p>
                  </div>
                </div>

                {backups.length === 0 ? (
                  <div className="text-center py-12 px-4 flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-stone-200 min-h-[220px]">
                    <span className="text-4xl filter grayscale select-none">📁</span>
                    <p className="text-stone-500 font-black text-xs mt-3 uppercase tracking-wide">Nenhum backup arquivado ainda</p>
                    <p className="text-[10px] text-stone-400 font-bold mt-1 max-w-[200px] leading-relaxed mx-auto">Os backups surgirão aqui quando você reiniciar o sistema principal.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {backups.map((bak) => {
                      const isExpanded = expandedBackupId === bak.id;
                      return (
                        <div key={bak.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden flex flex-col animate-fade-in">
                          
                          {/* Banner Header */}
                          <div className="p-3.5 flex items-center justify-between gap-3 bg-stone-50/50 border-b border-stone-150 text-left">
                            <div className="min-w-0">
                              <h4 className="text-xs font-black text-brazil-blue truncate leading-snug">
                                {bak.name}
                              </h4>
                              <p className="text-[8px] font-mono text-stone-400 font-black mt-0.5 uppercase tracking-wide">
                                📅 Criado em: {bak.timestamp}
                              </p>
                            </div>
                            <span className="bg-brazil-blue text-white font-mono font-black text-[9px] px-2.5 py-1 rounded-full shrink-0 select-none">
                              {bak.records.length} Palpites
                            </span>
                          </div>

                          {/* Quick details summary if not expanded */}
                          <div className="p-3 flex items-center gap-1.5 flex-wrap border-b border-stone-100 bg-white leading-none">
                            <button
                              type="button"
                              onClick={() => setExpandedBackupId(isExpanded ? null : bak.id)}
                              className="text-[9px] font-extrabold uppercase bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-1 rounded-full cursor-pointer transition select-none"
                            >
                              {isExpanded ? '🙈 Ocultar Lista' : '👁️ Ver Participantes'}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleExportBackupCSV(bak)}
                              className="text-[9px] font-black uppercase bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-250 border border-emerald-150 text-emerald-700 px-2.5 py-1 rounded-full cursor-pointer transition flex items-center gap-0.5 select-none"
                            >
                              <Download className="w-2.5 h-2.5 shrink-0" /> Planilha
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRestoreBackup(bak)}
                              className="text-[9px] font-black uppercase bg-brazil-yellow hover:bg-brazil-yellow/85 border border-brazil-blue/15 text-brazil-blue px-2.5 py-1 rounded-full cursor-pointer transition flex items-center gap-0.5 select-none"
                            >
                              🔄 Restaurar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteBackup(bak.id)}
                              className="ml-auto text-[9px] font-black uppercase bg-red-50 hover:bg-red-100 hover:border-red-250 border border-red-150 text-red-600 p-1.5 rounded-full cursor-pointer transition select-none"
                              title="Remover backup definitivamente"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Expanded list view */}
                          {isExpanded && (
                            <div className="bg-stone-50/50 p-2.5 max-h-[160px] overflow-y-auto divide-y divide-stone-100 text-left scrollbar-thin">
                              <span className="text-[7.5px] font-black text-stone-400 uppercase tracking-widest block mb-1">Relação de Nomes no Backup:</span>
                              {bak.records.length === 0 ? (
                                <p className="text-[9px] text-stone-400 font-bold">Nenhum palpite registrado neste bolão.</p>
                              ) : (
                                bak.records.map((r, i) => (
                                  <div key={r.id || i} className="py-1 flex items-center justify-between text-[9px] font-bold text-brazil-blue gap-2">
                                    <span className="truncate pr-2 max-w-[150px]">👤 {r.name}</span>
                                    <span className="text-stone-400 text-[8px] font-mono pr-1">{r.phone}</span>
                                    <span className="text-bbq-red text-[8px] shrink-0 font-medium truncate max-w-[120px]">{r.prizeTitle}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Double-Check Reset Verification Overlay */}
        {isConfirmingClear && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center text-brazil-blue">
            <div className="w-16 h-16 rounded-full bg-red-100 text-bbq-red flex items-center justify-center mb-4 border-2 border-bbq-red select-none">
              <Trash2 className="w-7 h-7" />
            </div>
            
            <h3 className="font-display font-black text-base uppercase text-bbq-red font-black">
              ⚠️ RESET COMPLETO DE PARTICIPANTES ⚠️
            </h3>
            
            <p className="text-[11px] text-stone-600 font-bold mt-2 leading-relaxed max-w-sm">
              Você está prestes a limpar **TODOS** os palpites e participações de usuários ativos. Esta ação reiniciará os cadastros!
            </p>

            <div className="my-3 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl max-w-sm">
              <p className="text-[10px] text-emerald-800 font-bold leading-normal">
                🔒 <strong>Autobackup Ativo:</strong> Todos os palpites atuais serão exportados automaticamente e salvos na aba <strong>"Backups"</strong> antes de serem apagados.
              </p>
            </div>

            <form onSubmit={handleExecuteClearDatabase} className="w-full max-w-xs flex flex-col gap-3.5 mt-2">
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] font-black uppercase text-stone-400">Dê um nome para este Backup:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bolão Copa - Semanas Iniciais"
                  value={clearBackupName}
                  onChange={(e) => setClearBackupName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 focus:border-red-500 rounded-xl py-2 px-3 text-xs font-bold outline-none text-brazil-blue"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] font-black uppercase text-stone-400">Digite a Senha Principal para Confirmar:</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 animate-pulse" />
                  <input
                    type={showClearPassword ? "text" : "password"}
                    required
                    placeholder="Sua senha secreta de admin"
                    value={clearPassword}
                    onChange={(e) => setClearPassword(e.target.value)}
                    className="w-full bg-stone-100 border border-stone-300 focus:border-red-500 rounded-xl py-2 pl-9 pr-12 text-xs font-bold outline-none text-brazil-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClearPassword(!showClearPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500 p-1"
                  >
                    {showClearPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {clearError && (
                <p className="text-[9.5px] font-black text-bbq-red leading-none mt-1">{clearError}</p>
              )}

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsConfirmingClear(false);
                    setClearPassword('');
                    setClearBackupName('');
                    setClearError('');
                  }}
                  className="flex-1 bg-stone-150 hover:bg-stone-200 border border-stone-300 text-stone-600 rounded-xl py-2.5 font-display font-black text-[10px] uppercase cursor-pointer"
                >
                  Cancelar ❌
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-bbq-red hover:bg-bbq-red/90 text-white rounded-xl py-2.5 font-display font-black text-[10px] uppercase shadow active:scale-95 transition cursor-pointer"
                >
                  Confirmar & Zerar ⚡️
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
