// =======================================================================
// store.js — local-only data layer (localStorage) + HMAC document signing
// =======================================================================
const DB_KEYS = {
  secret: 'icool_secret_v1',
  customers: 'icool_customers_v1',
  ledger: 'icool_ledger_v1',
  docs: 'icool_docs_v1',
  seq: 'icool_seq_v1',
  settings: 'icool_settings_v1',
};

function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){ return fallback; }
}
function saveJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

const Store = {
  customers: loadJSON(DB_KEYS.customers, []),
  ledger: loadJSON(DB_KEYS.ledger, []),      // {id, customerId, date, type, ref, desc, debit, credit}
  docs: loadJSON(DB_KEYS.docs, []),          // {id, type, no, dateISO, customerId, customerName, payload, totalUsd, sig, createdAt, lang}
  seq: loadJSON(DB_KEYS.seq, {}),
  settings: loadJSON(DB_KEYS.settings, { company: 'iCOOL Trading & Contracting' }),

  persist(){
    saveJSON(DB_KEYS.customers, this.customers);
    saveJSON(DB_KEYS.ledger, this.ledger);
    saveJSON(DB_KEYS.docs, this.docs);
    saveJSON(DB_KEYS.seq, this.seq);
    saveJSON(DB_KEYS.settings, this.settings);
  },

  uid(){ return 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2,8); },

  nextNo(prefix){
    const d = new Date();
    const ymd = d.getFullYear().toString().slice(2) +
      String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0');
    const key = prefix + ymd;
    this.seq[key] = (this.seq[key] || 0) + 1;
    this.persist();
    return prefix + '-' + ymd + '-' + String(this.seq[key]).padStart(2,'0');
  },

  addCustomer(c){
    c.id = this.uid();
    this.customers.push(c);
    this.persist();
    return c;
  },
  getCustomer(id){ return this.customers.find(c=>c.id===id); },

  addLedgerEntry(e){
    e.id = this.uid();
    this.ledger.push(e);
    this.persist();
    return e;
  },
  customerLedger(customerId){
    return this.ledger.filter(e=>e.customerId===customerId).sort((a,b)=> (a.date||'').localeCompare(b.date||''));
  },
  customerBalance(customerId){
    return this.customerLedger(customerId).reduce((s,e)=> s + (e.debit||0) - (e.credit||0), 0);
  },

  saveDoc(doc){
    doc.id = this.uid();
    doc.createdAt = new Date().toISOString();
    this.docs.push(doc);
    this.persist();
    return doc;
  },
  allDocs(){ return this.docs.slice().sort((a,b)=> (b.createdAt||'').localeCompare(a.createdAt||'')); },
  findDocByNo(no){ return this.docs.find(d=>d.no===no); },

  exportBackup(){
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      secret: localStorage.getItem(DB_KEYS.secret),
      customers: this.customers,
      ledger: this.ledger,
      docs: this.docs,
      seq: this.seq,
      settings: this.settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'icool-backup-' + new Date().toISOString().slice(0,10) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
  importBackup(obj){
    if (obj.secret) localStorage.setItem(DB_KEYS.secret, obj.secret);
    this.customers = obj.customers || [];
    this.ledger = obj.ledger || [];
    this.docs = obj.docs || [];
    this.seq = obj.seq || {};
    this.settings = obj.settings || this.settings;
    this.persist();
  },

  wipeAll(){
    Object.values(DB_KEYS).forEach(k=>localStorage.removeItem(k));
  }
};

// -----------------------------------------------------------------------
// Crypto: HMAC-SHA256 document signing (local anti-tamper, not a public
// registry — verification happens inside this same app using the secret
// key stored on this device).
// -----------------------------------------------------------------------
const Crypto = {
  _keyPromise: null,

  async getSecretRaw(){
    let b64 = localStorage.getItem(DB_KEYS.secret);
    if (!b64){
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      b64 = btoa(String.fromCharCode(...bytes));
      localStorage.setItem(DB_KEYS.secret, b64);
    }
    return b64;
  },

  async getKey(){
    if (this._keyPromise) return this._keyPromise;
    this._keyPromise = (async ()=>{
      const b64 = await this.getSecretRaw();
      const raw = Uint8Array.from(atob(b64), c=>c.charCodeAt(0));
      return crypto.subtle.importKey('raw', raw, { name:'HMAC', hash:'SHA-256' }, false, ['sign','verify']);
    })();
    return this._keyPromise;
  },

  async sign(message){
    const key = await this.getKey();
    const enc = new TextEncoder().encode(message);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc);
    const bytes = new Uint8Array(sigBuf);
    let hex = '';
    for (let i=0;i<bytes.length;i++) hex += bytes[i].toString(16).padStart(2,'0');
    return hex.slice(0, 24); // shortened for compact QR payload
  },

  canonical(doc){
    // Canonical string used for signing/verification — must match exactly
    // between issuance and verification.
    return ['ICL1', doc.type, doc.no, doc.dateISO, (doc.customerName||'-'), Number(doc.totalUsd||0).toFixed(2)].join('|');
  },

  async signDoc(doc){
    const msg = this.canonical(doc);
    return await this.sign(msg);
  },

  buildQrPayload(doc, sig){
    return [this.canonical(doc), sig].join('|');
  },

  async verifyPayload(payloadStr){
    const parts = payloadStr.trim().split('|');
    if (parts.length < 7) return { ok:false, reason:'format' };
    const sig = parts.pop();
    const msg = parts.join('|');
    const expected = await this.sign(msg);
    const [, type, no, dateISO, customerName, totalUsd] = parts;
    return {
      ok: expected === sig,
      type, no, dateISO, customerName, totalUsd,
      matchedLocalRecord: !!Store.findDocByNo(no),
    };
  }
};
