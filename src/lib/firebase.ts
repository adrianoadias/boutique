import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocsFromServer, 
  getDocFromServer,
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Handle formatting of timestamps in standard Brazilian format
 */
export const formatCurrentTimestamp = (): string => {
  return new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

/**
 * Robustly parse timestamps in format "DD/MM/YYYY, HH:MM:SS" or standard ISO strings to Unix milliseconds for precise sorting
 */
export const parseCloudTimestampToMs = (ts: any): number => {
  if (!ts) return 0;
  if (typeof ts !== 'string') return 0;
  try {
    if (ts.includes('T') || ts.includes('-')) {
      const ms = Date.parse(ts);
      if (!isNaN(ms)) return ms;
    }
    const clean = ts.replace(',', '').trim(); 
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      const datePart = parts[0]; 
      const timePart = parts[1]; 
      const ampm = parts[2]; 
      
      const dateParts = datePart.split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; 
        const year = parseInt(dateParts[2], 10);
        
        const timeParts = timePart.split(':');
        let hour = parseInt(timeParts[0], 10);
        const min = parseInt(timeParts[1], 10);
        const sec = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
        
        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hour < 12) hour += 12;
          if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
        }
        
        const d = new Date(year, month, day, hour, min, sec);
        return d.getTime();
      }
    }
    const ms = Date.parse(ts);
    return isNaN(ms) ? 0 : ms;
  } catch (e) {
    console.error('Error parsing cloud timestamp:', ts, e);
    return 0;
  }
};

/**
 * Save or update a single registration record to Firestore
 */
export async function saveRegistrationToCloud(record: any): Promise<boolean> {
  if (!record || !record.id) return false;
  try {
    // Ensure all undefined fields are replaced with null or empty structures so Firestore doesn't throw
    const cleanedRecord = {
      id: record.id,
      name: record.name || '',
      phone: record.phone || '',
      cpf: record.cpf || '',
      brazilScore: Number(record.brazilScore) || 0,
      haitiScore: Number(record.haitiScore) || 0,
      firstGoalScorer: record.firstGoalScorer || '',
      predictions: record.predictions ? record.predictions.map((p: any) => ({
        matchId: p.matchId || '',
        team1Score: Number(p.team1Score) || 0,
        team2Score: Number(p.team2Score) || 0,
        firstGoalScorer: p.firstGoalScorer || ''
      })) : [],
      prizeTitle: record.prizeTitle || 'Pendente (Não girou roleta) ⏱️',
      prizeCode: record.prizeCode || 'PENDENTE',
      timestamp: record.timestamp || formatCurrentTimestamp()
    };

    const docRef = doc(db, 'registrations', cleanedRecord.id);
    await setDoc(docRef, cleanedRecord, { merge: true });
    return true;
  } catch (error) {
    console.error('Error saving registration to Firestore Cloud:', error);
    return false;
  }
}

/**
 * Synchronize / load all active registrations directly from Cloud Firestore
 */
export async function loadRegistrationsFromCloud(): Promise<any[]> {
  try {
    const colRef = collection(db, 'registrations');
    const snapshot = await getDocsFromServer(colRef);
    const records: any[] = [];
    
    snapshot.forEach(docSnap => {
      if (docSnap.exists()) {
        records.push(docSnap.data());
      }
    });

    // Sort by latest timestamp first using our high reliability millisecond parser
    return records.sort((a, b) => {
      return parseCloudTimestampToMs(b.timestamp) - parseCloudTimestampToMs(a.timestamp);
    });
  } catch (error) {
    console.error('Error loading registrations from Firestore Cloud:', error);
    return [];
  }
}

/**
 * Sync offline/local records with Cloud database
 */
export async function syncLocalRecordsWithCloud(localRecords: any[]): Promise<any[]> {
  try {
    const cloudRecords = await loadRegistrationsFromCloud();
    const mergedMap = new Map<string, any>();

    // 1. Load cloud records first
    cloudRecords.forEach(r => {
      if (r && r.id) {
        mergedMap.set(r.id, r);
      }
    });

    // 2. Local records check and upload if not existing or is update
    for (const local of localRecords) {
      if (local && local.id) {
        const cloudExisting = mergedMap.get(local.id);
        if (!cloudExisting) {
          // Upload to cloud
          await saveRegistrationToCloud(local);
          mergedMap.set(local.id, local);
        } else {
          // If local has a physical prize won, but cloud is PENDENTE, push the update to cloud
          const localHasRealPrize = local.prizeCode && local.prizeCode !== 'PENDENTE';
          const cloudIsPendente = cloudExisting.prizeCode === 'PENDENTE';
          
          if (localHasRealPrize && cloudIsPendente) {
            const updated = {
              ...cloudExisting,
              ...local,
              prizeTitle: local.prizeTitle,
              prizeCode: local.prizeCode
            };
            await saveRegistrationToCloud(updated);
            mergedMap.set(local.id, updated);
          }
        }
      }
    }

    const mergedList = Array.from(mergedMap.values()).sort((a, b) => {
      return parseCloudTimestampToMs(b.timestamp) - parseCloudTimestampToMs(a.timestamp);
    });

    return mergedList;
  } catch (error) {
    console.error('Error syncing local records with cloud:', error);
    return localRecords;
  }
}

/**
 * Archive active records to backups and empty the active Registrations list in Firestore
 */
export async function clearAndBackupCloud(password: string, backupName: string): Promise<boolean> {
  if (password !== '@SucessoRafes#26') {
    throw new Error('Acesso negado: senha incorreta');
  }

  try {
    const records = await loadRegistrationsFromCloud();
    
    // Save backup if records exist
    if (records.length > 0) {
      const cleanName = backupName ? backupName.toLowerCase().replace(/[^a-z0-9]+/g, '_') : 'backup';
      const backupId = `backup_${cleanName}_${Date.now()}`;
      
      const backupRef = doc(db, 'backups', backupId);
      await setDoc(backupRef, {
        id: backupId,
        name: cleanName,
        timestamp: formatCurrentTimestamp(),
        records: records
      });
    }

    // Atomically delete active records from cloud in chunks (since Firestore allow max 500 writes per batch)
    if (records.length > 0) {
      const chunks: string[][] = [];
      for (let i = 0; i < records.length; i += 400) {
        chunks.push(records.slice(i, i + 400).map(r => r.id));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(id => {
          batch.delete(doc(db, 'registrations', id));
        });
        await batch.commit();
      }
    }

    return true;
  } catch (error) {
    console.error('Error executing clear and backup operation on cloud:', error);
    return false;
  }
}

/**
 * Load archived database backups from Firestore
 */
export async function loadBackupsFromCloud(): Promise<any[]> {
  try {
    const colRef = collection(db, 'backups');
    const snapshot = await getDocsFromServer(colRef);
    const backups: any[] = [];
    
    snapshot.forEach(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        backups.push({
          id: data.id || docSnap.id,
          name: data.name || 'backup',
          timestamp: data.timestamp || formatCurrentTimestamp(),
          records: data.records || []
        });
      }
    });

    // Sort by latest backup timestamp first
    return backups.sort((a, b) => {
      return parseCloudTimestampToMs(b.timestamp) - parseCloudTimestampToMs(a.timestamp);
    });
  } catch (error) {
    console.error('Error loading backups from Cloud Firestore:', error);
    return [];
  }
}
