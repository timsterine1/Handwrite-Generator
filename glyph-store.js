/**
 * glyph-store.js
 * Verwaltet die Speicherung, das Laden und Exportieren aller handschriftlichen
 * Glyphen mit bis zu 10 Variationen pro Buchstabe in IndexedDB / localStorage.
 */

class GlyphStore {
  constructor() {
    this.dbName = 'HandschriftGeneratorDB';
    this.storeName = 'glyphs';
    this.version = 1;
    this.db = null;

    // Zeichen-Kategorien
    this.categories = {
      lowercase: 'abcdefghijklmnopqrstuvwxyz'.split(''),
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
      umlauts: ['ä', 'ö', 'ü', 'Ä', 'Ö', 'Ü', 'ß'],
      digits: '0123456789'.split(''),
      punctuation: ['.', ',', '!', '?', '-', ':', ';', '(', ')', '"', "'", '/', '+', '=', '@', '€', '%', '&']
    };

    // Im Speicher gecachte Glyphen-Map: { [char]: [var0, var1, ..., var9] }
    this.cache = {};
    this.profileMeta = {
      name: 'Meine Handschrift',
      updatedAt: Date.now()
    };

    this.listeners = [];
  }

  async init() {
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(this.dbName, this.version);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName, { keyPath: 'char' });
          }
        };
        req.onsuccess = async (e) => {
          this.db = e.target.result;
          await this.loadAllFromDB();
          resolve(true);
        };
        req.onerror = () => {
          console.warn('IndexedDB nicht verfügbar, verwende localStorage als Fallback.');
          this.loadFromLocalStorage();
          resolve(true);
        };
      } catch (err) {
        console.warn('IndexedDB Exception, verwende localStorage:', err);
        this.loadFromLocalStorage();
        resolve(true);
      }
    });
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify(event, data) {
    this.listeners.forEach((fn) => {
      try { fn(event, data); } catch (e) { console.error(e); }
    });
  }

  // Lädt alle Einträge aus IndexedDB in den Arbeitsspeicher
  async loadAllFromDB() {
    if (!this.db) return;
    return new Promise((resolve) => {
      const tx = this.db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = req.result || [];
        this.cache = {};
        records.forEach((rec) => {
          if (rec.char && Array.isArray(rec.variations)) {
            this.cache[rec.char] = rec.variations;
          }
        });
        resolve();
      };
      req.onerror = () => resolve();
    });
  }

  loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem('handschrift_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        this.cache = parsed.glyphs || {};
        this.profileMeta = parsed.meta || this.profileMeta;
      }
    } catch (e) {
      console.error('Fehler beim Laden aus localStorage:', e);
    }
  }

  saveToLocalStorage() {
    try {
      const data = {
        meta: this.profileMeta,
        glyphs: this.cache
      };
      localStorage.setItem('handschrift_data', JSON.stringify(data));
    } catch (e) {
      console.warn('localStorage voll oder blockiert:', e);
    }
  }

  // Gibt alle 10 Slots für ein Zeichen zurück (Array der Länge 10 mit Daten oder null)
  getVariations(char) {
    const vars = this.cache[char];
    if (!vars || !Array.isArray(vars)) {
      return new Array(10).fill(null);
    }
    const result = new Array(10).fill(null);
    for (let i = 0; i < 10; i++) {
      result[i] = vars[i] || null;
    }
    return result;
  }

  getVariation(char, slotIndex) {
    const vars = this.cache[char];
    if (!vars || !vars[slotIndex]) return null;
    return vars[slotIndex];
  }

  // Zählt, wie viele Variationen für ein Zeichen bereits vorhanden sind
  getVariationCount(char) {
    const vars = this.cache[char];
    if (!vars) return 0;
    return vars.filter(v => v !== null && v !== undefined).length;
  }

  // Speichert eine Variation (0-9) für ein Zeichen
  async saveVariation(char, slotIndex, glyphData) {
    if (!this.cache[char]) {
      this.cache[char] = new Array(10).fill(null);
    }
    while (this.cache[char].length < 10) {
      this.cache[char].push(null);
    }
    this.cache[char][slotIndex] = glyphData;
    this.profileMeta.updatedAt = Date.now();

    // Persistieren
    if (this.db) {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).put({
        char: char,
        variations: this.cache[char]
      });
    }
    this.saveToLocalStorage();

    this.notify('variation_saved', { char, slotIndex, glyphData });
  }

  // Löscht eine bestimmte Variation
  async deleteVariation(char, slotIndex) {
    if (this.cache[char] && this.cache[char][slotIndex]) {
      this.cache[char][slotIndex] = null;
      if (this.db) {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).put({
          char: char,
          variations: this.cache[char]
        });
      }
      this.saveToLocalStorage();
      this.notify('variation_deleted', { char, slotIndex });
    }
  }

  // Gesamtanzahl der erfassten Zeichen (mindestens 1 Variation)
  getTotalRecordedCharsCount() {
    let count = 0;
    for (const char in this.cache) {
      if (this.getVariationCount(char) > 0) {
        count++;
      }
    }
    return count;
  }

  // Exportiert das gesamte Profil als JSON
  exportProfile() {
    const exportData = {
      format: 'handschrift-generator-v1',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      meta: this.profileMeta,
      glyphs: this.cache
    };
    return JSON.stringify(exportData, null, 2);
  }

  // Importiert ein Profil aus einem JSON-String
  async importProfile(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data.glyphs) {
        throw new Error('Ungültiges Format: "glyphs" fehlt im Profil.');
      }

      this.cache = data.glyphs;
      this.profileMeta = data.meta || { name: 'Importiertes Profil', updatedAt: Date.now() };

      if (this.db) {
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.clear();
        for (const char in this.cache) {
          store.put({
            char: char,
            variations: this.cache[char]
          });
        }
      }
      this.saveToLocalStorage();
      this.notify('profile_loaded', { success: true });
      return true;
    } catch (err) {
      console.error('Fehler beim Importieren:', err);
      throw err;
    }
  }

  // Komplettes Zurücksetzen
  async clearAll() {
    this.cache = {};
    this.profileMeta.updatedAt = Date.now();
    if (this.db) {
      const tx = this.db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).clear();
    }
    localStorage.removeItem('handschrift_data');
    this.notify('profile_cleared', {});
  }
}

// Global instanziieren
window.glyphStore = new GlyphStore();
