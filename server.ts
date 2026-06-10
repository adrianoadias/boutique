import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Serve middleware to parse JSON/urlencoded request bodies
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Helper paths for file database
  const dbDir = path.join(process.cwd(), 'src', 'db');
  const backupDir = path.join(dbDir, 'backups');
  const dbPath = path.join(dbDir, 'registrations_backup.json');

  // Verify and create database directories if they don't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Load registrations from file database helper
  const readRegistrationsFromFile = (): any[] => {
    try {
      if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, '[]', 'utf-8');
        return [];
      }
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (e) {
      console.error('Error reading registrations from backup file:', e);
      return [];
    }
  };

  // Write registrations to file database helper
  const writeRegistrationsToFile = (data: any[]) => {
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing registrations to file database:', e);
    }
  };

  // API Route I: Fetch all backups and current registrations
  app.get('/api/registrations', (req, res) => {
    try {
      const records = readRegistrationsFromFile();
      res.json({ success: true, records });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to retrieve registrations' });
    }
  });

  // API Route II: Register/update single record
  app.post('/api/register', (req, res) => {
    try {
      const newRecord = req.body;
      if (!newRecord || !newRecord.id || !newRecord.name || !newRecord.phone) {
        return res.status(400).json({ success: false, error: 'Missing required registration parameters' });
      }

      const records = readRegistrationsFromFile();
      
      const cleanInputCpf = newRecord.cpf ? newRecord.cpf.replace(/\D/g, '') : '';
      const cleanInputPhone = newRecord.phone.replace(/\D/g, '');

      // Identify special test users who can duplicate
      const isTestUser = cleanInputCpf === '41107627826' || cleanInputPhone === '47991238671' || newRecord.name.trim().toLowerCase() === 'adriano dias';

      // Find duplicate index by ID, CPF, or Phone
      let existingIndex = records.findIndex((r: any) => r.id === newRecord.id);
      
      if (existingIndex === -1 && !isTestUser) {
        existingIndex = records.findIndex((r: any) => {
          const itemCpf = (r.cpf || '').replace(/\D/g, '');
          const itemPhone = (r.phone || '').replace(/\D/g, '');
          return (cleanInputCpf && itemCpf === cleanInputCpf) || (itemPhone === cleanInputPhone);
        });
      }

      if (existingIndex > -1) {
        // Suppress updating with 'Pendente' if they had already won a prize, unless they are rewriting prediction drafts
        const existingRecord = records[existingIndex];
        
        let shouldUpdatePrize = true;
        if (newRecord.prizeCode === 'PENDENTE' && existingRecord.prizeCode && existingRecord.prizeCode !== 'PENDENTE') {
          shouldUpdatePrize = false;
        }

        records[existingIndex] = {
          ...existingRecord,
          ...newRecord,
          prizeTitle: shouldUpdatePrize ? newRecord.prizeTitle : existingRecord.prizeTitle,
          prizeCode: shouldUpdatePrize ? newRecord.prizeCode : existingRecord.prizeCode,
          timestamp: existingRecord.timestamp || newRecord.timestamp || new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
        };
      } else {
        // Insert new record at the start
        records.unshift(newRecord);
      }

      writeRegistrationsToFile(records);
      res.json({ success: true, record: records[existingIndex > -1 ? existingIndex : 0] });
    } catch (err) {
      console.error('Error posting registration to backend file db:', err);
      res.status(500).json({ success: false, error: 'Failed to write registration to persistent database' });
    }
  });

  // API Route III: Bulk Synchronisation (client localStorage <-> server file database)
  // Ensures absolutely no participant list discrepencies can exist!
  app.post('/api/sync', (req, res) => {
    try {
      const clientRecords = req.body || [];
      const serverRecords = readRegistrationsFromFile();
      
      const mergedMap = new Map<string, any>();

      // 1. Pack server records first
      serverRecords.forEach((r: any) => {
        if (r && r.id) {
          mergedMap.set(r.id, r);
        }
      });

      // 2. Merge client records. Overwrite or add if client contains updated information (e.g. won prize is no longer PENDENTE)
      clientRecords.forEach((c: any) => {
        if (c && c.id) {
          const existing = mergedMap.get(c.id);
          if (!existing) {
            mergedMap.set(c.id, c);
          } else {
            // If the client has a fully resolved prize and server has PENDENTE, favor client
            const clientHasRealPrize = c.prizeCode && c.prizeCode !== 'PENDENTE';
            const serverIsPendente = existing.prizeCode === 'PENDENTE';
            
            if (clientHasRealPrize && serverIsPendente) {
              mergedMap.set(c.id, {
                ...existing,
                ...c,
                prizeTitle: c.prizeTitle,
                prizeCode: c.prizeCode
              });
            } else {
              // Standard merge, favor server timestamp & core content
              mergedMap.set(c.id, {
                ...c,
                ...existing
              });
            }
          }
        }
      });

      // Turn map back to array & sort by newest timestamp first
      const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = new Date(a.timestamp?.split(', ').reverse().join(' ') || 0).getTime();
        const timeB = new Date(b.timestamp?.split(', ').reverse().join(' ') || 0).getTime();
        return timeB - timeA;
      });

      writeRegistrationsToFile(mergedList);
      res.json({ success: true, records: mergedList });
    } catch (err) {
      console.error('Sync failure:', err);
      res.status(500).json({ success: false, error: 'Failed to synchronize lists' });
    }
  });

  // API Route IV: Reset active registrations & moves existing database file to backups
  app.post('/api/clear-db', (req, res) => {
    try {
      const { password, name } = req.body;
      if (password !== '@SucessoRafes#26') {
        return res.status(403).json({ success: false, error: 'Acesso negado: senha incorreta' });
      }

      const records = readRegistrationsFromFile();
      
      if (records.length > 0) {
        const backupName = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'backup';
        const fileBackupPath = path.join(backupDir, `backup_${backupName}_${Date.now()}.json`);
        
        fs.writeFileSync(fileBackupPath, JSON.stringify(records, null, 2), 'utf-8');
      }

      // Overwrite current file database with empty array
      writeRegistrationsToFile([]);
      res.json({ success: true, message: 'Database successfully backed up and cleared' });
    } catch (err) {
      console.error('Clear database failure:', err);
      res.status(500).json({ success: false, error: 'Failed to clear and archive database' });
    }
  });

  // API Route V: Fetch list of archived server-side JSON backup files
  app.get('/api/backups', (req, res) => {
    try {
      if (!fs.existsSync(backupDir)) {
        return res.json({ success: true, backups: [] });
      }
      const files = fs.readdirSync(backupDir);
      const backups = files.map(file => {
        try {
          const content = fs.readFileSync(path.join(backupDir, file), 'utf-8');
          const records = JSON.parse(content || '[]');
          return {
            id: file,
            name: file.replace(/^backup_/, '').replace(/\.json$/, '').replace(/_\d+$/, ''),
            timestamp: new Date(fs.statSync(path.join(backupDir, file)).mtime).toLocaleString('pt-BR'),
            records
          };
        } catch {
          return null;
        }
      }).filter(Boolean);

      res.json({ success: true, backups });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to load list of backups' });
    }
  });

  // Vite development vs production asset serving setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Boutique Copas Server running on port ${PORT}`);
  });
}

startServer();
