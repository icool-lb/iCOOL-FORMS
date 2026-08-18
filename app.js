// =======================================================================
// app.js — UI wiring for the iCOOL Documents Platform
// =======================================================================

// ---------------- small helpers ----------------------------------------
function valOf(id){ const el = document.getElementById(id); return el ? el.value : ''; }
function escAttr(s){ return String(s==null?'':s).replace(/"/g,'&quot;'); }
function todayISOApp(){ return new Date().toISOString().slice(0,10); }

function showToast(msg, type){
  type = type || 'info';
  const host = document.getElementById('toastHost');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  host.appendChild(el);
  setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(), 250); }, 3200);
}

const TYPE_LABELS_AR = { invoice:'فاتورة', quote:'عرض سعر', receipt:'إيصال قبض', delivery:'إذن تسليم', cert:'شهادة خبرة', soa:'كشف حساب' };
const TYPE_LABELS_EN = { invoice:'Invoice', quote:'Quotation', receipt:'Receipt', delivery:'Delivery Note', cert:'Certificate', soa:'Statement' };

// ---------------- tab switching -----------------------------------------
function switchTab(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.querySelectorAll('.tabbtn').forEach(b=>b.classList.remove('active'));
  const v = document.getElementById('view-' + view);
  const b = document.querySelector('.tabbtn[data-view="' + view + '"]');
  if (v) v.classList.add('active');
  if (b) b.classList.add('active');
  window.scrollTo(0,0);
}

// ---------------- preview overlay ---------------------------------------
function openPreviewOverlay(html, qrId, qrPayload, printTargetBtnId){
  document.getElementById('printArea').innerHTML = html;
  renderQrInto(document.getElementById('qr-' + qrId), qrPayload);
  document.body.classList.add('show-preview');
  window._previewTargetBtn = printTargetBtnId || null;
}
function closePreviewOverlay(){ document.body.classList.remove('show-preview'); }

// ---------------- generic item-row widgets -------------------------------
function addStdItemRow(containerId, item){
  item = item || { name:'', qty:1, value:0 };
  const row = document.createElement('div');
  row.className = 'rowline';
  row.innerHTML =
    '<input type="text" class="grow it-name" placeholder="اسم البند" value="' + escAttr(item.name) + '">' +
    '<input type="number" step="0.01" class="it-qty" style="width:60px" value="' + item.qty + '">' +
    '<input type="number" step="0.01" class="it-value" style="width:80px" value="' + item.value + '">' +
    '<button type="button" class="btn danger sm it-remove" style="padding:6px 8px">×</button>';
  document.getElementById(containerId).appendChild(row);
  row.querySelector('.it-remove').onclick = function(){
    row.remove();
    document.getElementById(containerId).dispatchEvent(new Event('input'));
  };
  document.getElementById(containerId).dispatchEvent(new Event('input'));
}
function readStdItems(containerId){
  const rows = document.getElementById(containerId).querySelectorAll('.rowline');
  const out = [];
  rows.forEach(r=>{
    const name = r.querySelector('.it-name').value.trim();
    const qty = parseFloat(r.querySelector('.it-qty').value || 0) || 0;
    const value = parseFloat(r.querySelector('.it-value').value || 0) || 0;
    if (name) out.push({ name, qty, value });
  });
  return out;
}

function addDnItemRow(containerId, item){
  item = item || { name:'', qty:1 };
  const row = document.createElement('div');
  row.className = 'rowline';
  row.innerHTML =
    '<input type="text" class="grow it-name" placeholder="اسم البند" value="' + escAttr(item.name) + '">' +
    '<input type="number" step="0.01" class="it-qty" style="width:70px" value="' + item.qty + '">' +
    '<button type="button" class="btn danger sm it-remove" style="padding:6px 8px">×</button>';
  document.getElementById(containerId).appendChild(row);
  row.querySelector('.it-remove').onclick = function(){ row.remove(); };
}
function readDnItems(containerId){
  const rows = document.getElementById(containerId).querySelectorAll('.rowline');
  const out = [];
  rows.forEach(r=>{
    const name = r.querySelector('.it-name').value.trim();
    const qty = parseFloat(r.querySelector('.it-qty').value || 0) || 0;
    if (name) out.push({ name, qty });
  });
  return out;
}

function addAiItemRow(item){
  item = item || { name:'', qty:1, cost:0, sell:0 };
  const row = document.createElement('div');
  row.className = 'ai-item-row';
  row.innerHTML =
    '<input type="text" class="it-name" placeholder="اسم البند" value="' + escAttr(item.name) + '">' +
    '<input type="number" step="0.01" class="it-qty" value="' + item.qty + '">' +
    '<input type="number" step="0.01" class="it-cost" value="' + item.cost + '">' +
    '<input type="number" step="0.01" class="it-sell" value="' + item.sell + '">' +
    '<button type="button" class="btn danger sm it-remove" style="padding:4px 6px">×</button>';
  document.getElementById('ai-itemsContainer').appendChild(row);
  row.querySelector('.it-remove').onclick = function(){
    row.remove();
    document.getElementById('ai-itemsContainer').dispatchEvent(new Event('input'));
  };
  document.getElementById('ai-itemsContainer').dispatchEvent(new Event('input'));
}
function readAiItems(){
  const rows = document.querySelectorAll('#ai-itemsContainer .ai-item-row');
  const out = [];
  rows.forEach(r=>{
    const name = r.querySelector('.it-name').value.trim();
    const qty = parseFloat(r.querySelector('.it-qty').value || 0) || 0;
    const value = parseFloat(r.querySelector('.it-sell').value || 0) || 0;
    if (name) out.push({ name, qty, value });
  });
  return out;
}

// ---------------- totals preview binding ---------------------------------
function bindTotalsPreview(prefix, hasPaid){
  const el = document.getElementById(prefix + '-totalsPreview');
  if (!el) return;
  function recalc(){
    const items = readStdItems(prefix + '-items');
    const mat = items.reduce((s,i)=> s + i.value, 0);
    const labor = parseFloat(valOf(prefix + '-labor') || 0) || 0;
    const paid = hasPaid ? (parseFloat(valOf(prefix + '-paidPrev') || 0) || 0) : 0;
    const total = mat + labor;
    const due = total - paid;
    el.textContent = hasPaid
      ? ('الإجمالي: ' + total.toFixed(2) + '$  —  المستحق: ' + due.toFixed(2) + '$')
      : ('الإجمالي: ' + total.toFixed(2) + '$');
  }
  document.getElementById(prefix + '-items').addEventListener('input', recalc);
  const laborEl = document.getElementById(prefix + '-labor');
  if (laborEl) laborEl.addEventListener('input', recalc);
  const paidEl = document.getElementById(prefix + '-paidPrev');
  if (hasPaid && paidEl) paidEl.addEventListener('input', recalc);
  recalc();
}

function bindAiTotalsPreview(){
  const el = document.getElementById('ai-totalsPreview');
  function recalc(){
    const items = readAiItems();
    const mat = items.reduce((s,i)=> s + i.value, 0);
    const labor = parseFloat(valOf('ai-labor') || 0) || 0;
    el.textContent = 'الإجمالي: ' + (mat + labor).toFixed(2) + '$';
  }
  document.getElementById('ai-itemsContainer').addEventListener('input', recalc);
  document.getElementById('ai-labor').addEventListener('input', recalc);
  recalc();
}

// ---------------- customer select helpers --------------------------------
const MANUAL_CUSTOMER_SELECTS = ['inv','qt','rec','dn','ai'];
function refreshCustomerSelects(){
  MANUAL_CUSTOMER_SELECTS.forEach(prefix=>{
    const sel = document.getElementById(prefix + '-customerSelect');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">— اسم يدوي بدون ربط بكشف حساب —</option>' +
      Store.customers.map(c=>'<option value="' + c.id + '">' + escAttr(c.name) + '</option>').join('');
    if (cur) sel.value = cur;
  });
  const soaSel = document.getElementById('soa-customerSelect');
  if (soaSel){
    const cur = soaSel.value;
    if (Store.customers.length === 0){
      soaSel.innerHTML = '<option value="">لا يوجد زبائن — أضف زبونًا من تبويب الزبائن</option>';
    } else {
      soaSel.innerHTML = Store.customers.map(c=>'<option value="' + c.id + '">' + escAttr(c.name) + '</option>').join('');
    }
    if (cur) soaSel.value = cur;
  }
}
function getCustomerChoice(prefix){
  const sel = document.getElementById(prefix + '-customerSelect');
  const manual = document.getElementById(prefix + '-customerNameManual');
  if (sel && sel.value){
    const c = Store.getCustomer(sel.value);
    return { customerId: sel.value, customerName: c ? c.name : '' };
  }
  return { customerId: null, customerName: manual ? manual.value.trim() : '' };
}

// ---------------- gather functions ---------------------------------------
function gatherInvoiceLikeData(prefix){
  const { customerId, customerName } = getCustomerChoice(prefix);
  const items = readStdItems(prefix + '-items');
  if (items.length === 0) return { __error: 'أضف بندًا واحدًا على الأقل' };
  return {
    customerId, customerName,
    project: valOf(prefix + '-project'), location: valOf(prefix + '-location'), ref: valOf(prefix + '-ref'),
    dateISO: valOf(prefix + '-date') || todayISOApp(),
    items,
    labor: parseFloat(valOf(prefix + '-labor') || 0) || 0,
    laborLabel: valOf(prefix + '-laborLabel') || undefined,
    paidPrev: parseFloat(valOf(prefix + '-paidPrev') || 0) || 0,
    validUntil: valOf(prefix + '-validUntil') || null,
  };
}
function gatherReceiptData(){
  const { customerId, customerName } = getCustomerChoice('rec');
  const amount = parseFloat(valOf('rec-amount') || 0) || 0;
  if (amount <= 0) return { __error: 'أدخل مبلغًا صحيحًا أكبر من صفر' };
  if (!customerName) return { __error: 'أدخل اسم العميل (من القائمة أو يدويًا)' };
  return {
    customerId, customerName, amount,
    method: valOf('rec-method'), forDesc: valOf('rec-forDesc'),
    dateISO: valOf('rec-date') || todayISOApp(),
  };
}
function gatherDeliveryData(){
  const { customerId, customerName } = getCustomerChoice('dn');
  const items = readDnItems('dn-items');
  if (items.length === 0) return { __error: 'أضف بندًا واحدًا على الأقل' };
  return {
    customerId, customerName, items,
    location: valOf('dn-location'), vehicle: valOf('dn-vehicle'), deliveredBy: valOf('dn-deliveredBy'),
    dateISO: valOf('dn-date') || todayISOApp(),
  };
}
function gatherCertData(){
  const personName = valOf('cert-personName').trim();
  if (!personName) return { __error: 'أدخل اسم الشخص' };
  return {
    personName, role: valOf('cert-role'),
    periodFrom: valOf('cert-periodFrom'), periodTo: valOf('cert-periodTo'),
    extra: valOf('cert-extra'), dateISO: valOf('cert-date') || todayISOApp(),
  };
}

// ---------------- ledger linking on save ----------------------------------
function linkInvoiceLedger(doc){
  if (!doc.customerId) return;
  Store.addLedgerEntry({
    customerId: doc.customerId, date: doc.dateISO, type:'invoice', ref: doc.no,
    desc: (doc.lang==='en'?'Invoice ':'فاتورة ') + doc.no, debit: doc.payload.total, credit: 0,
  });
  if (doc.payload.paidPrev > 0){
    Store.addLedgerEntry({
      customerId: doc.customerId, date: doc.dateISO, type:'payment', ref: doc.no,
      desc: (doc.lang==='en'?'Prior payment within ':'دفعة مسبقة ضمن ') + doc.no, debit: 0, credit: doc.payload.paidPrev,
    });
  }
}
function linkReceiptLedger(doc){
  if (!doc.customerId) return;
  Store.addLedgerEntry({
    customerId: doc.customerId, date: doc.dateISO, type:'payment', ref: doc.no,
    desc: (doc.lang==='en'?'Receipt ':'إيصال قبض ') + doc.no, debit: 0, credit: doc.totalUsd,
  });
}

// ---------------- clear-form helpers ---------------------------------------
function clearInvoiceLikeForm(prefix){
  const manual = document.getElementById(prefix + '-customerNameManual'); if (manual) manual.value = '';
  const sel = document.getElementById(prefix + '-customerSelect'); if (sel) sel.value = '';
  ['project','location','ref'].forEach(f=>{ const el = document.getElementById(prefix + '-' + f); if (el) el.value = ''; });
  const items = document.getElementById(prefix + '-items');
  if (items){ items.innerHTML = ''; addStdItemRow(prefix + '-items'); }
  const labor = document.getElementById(prefix + '-labor'); if (labor) labor.value = 0;
  const paid = document.getElementById(prefix + '-paidPrev'); if (paid) paid.value = 0;
  const dateEl = document.getElementById(prefix + '-date'); if (dateEl) dateEl.value = todayISOApp();
}
function clearReceiptForm(){
  document.getElementById('rec-customerSelect').value = '';
  document.getElementById('rec-customerNameManual').value = '';
  document.getElementById('rec-amount').value = '';
  document.getElementById('rec-forDesc').value = '';
  document.getElementById('rec-date').value = todayISOApp();
}
function clearDeliveryForm(){
  document.getElementById('dn-customerSelect').value = '';
  document.getElementById('dn-customerNameManual').value = '';
  document.getElementById('dn-location').value = '';
  document.getElementById('dn-vehicle').value = '';
  document.getElementById('dn-deliveredBy').value = '';
  const items = document.getElementById('dn-items'); items.innerHTML = ''; addDnItemRow('dn-items');
  document.getElementById('dn-date').value = todayISOApp();
}
function clearCertForm(){
  document.getElementById('cert-personName').value = '';
  document.getElementById('cert-role').value = '';
  document.getElementById('cert-extra').value = '';
  document.getElementById('cert-date').value = todayISOApp();
}
function clearAiForm(){
  document.getElementById('ai-text').value = '';
  aiImages = [];
  renderAiThumbs();
  document.getElementById('ai-itemsContainer').innerHTML = '';
  document.getElementById('ai-resultCard').style.display = 'none';
  document.getElementById('ai-customerSelect').value = '';
  document.getElementById('ai-customerNameManual').value = '';
  document.getElementById('ai-project').value = '';
  document.getElementById('ai-labor').value = 0;
}

// ---------------- generic finalize / preview flows -------------------------
async function finalizeAndOutput(opts){
  // opts: { prefix, gatherFn, renderFn, langFn, onSaved, clearFn, doPrint }
  try{
    const data = opts.gatherFn();
    if (data.__error){ showToast(data.__error, 'err'); return; }
    data.no = Store.nextNo(opts.prefix);
    data.dateISO = data.dateISO || todayISOApp();
    const lang = opts.langFn ? opts.langFn() : 'ar';
    const result = await opts.renderFn(data, lang);
    const saved = Store.saveDoc(result.doc);
    if (opts.onSaved) opts.onSaved(saved, data);
    closePreviewOverlay();
    document.getElementById('printArea').innerHTML = result.html;
    renderQrInto(document.getElementById('qr-' + result.qrId), result.qrPayload);
    refreshAllDynamicViews();
    showToast('تم الحفظ في الأرشيف: ' + data.no, 'ok');
    if (opts.doPrint) setTimeout(()=>window.print(), 80);
    if (opts.clearFn) opts.clearFn();
  }catch(err){
    console.error(err);
    showToast('حدث خطأ: ' + err.message, 'err');
  }
}
async function previewOnly(opts){
  // opts: { prefix, gatherFn, renderFn, langFn, printTargetBtnId }
  try{
    const data = opts.gatherFn();
    if (data.__error){ showToast(data.__error, 'err'); return; }
    data.no = opts.prefix + '-DRAFT';
    data.dateISO = data.dateISO || todayISOApp();
    const lang = opts.langFn ? opts.langFn() : 'ar';
    const result = await opts.renderFn(data, lang);
    openPreviewOverlay(result.html, result.qrId, result.qrPayload, opts.printTargetBtnId);
  }catch(err){
    console.error(err);
    showToast('حدث خطأ: ' + err.message, 'err');
  }
}

// ---------------- SOA (statement of account) -------------------------------
let soaDraft = null;
async function soaGenerate(){
  const custId = valOf('soa-customerSelect');
  if (!custId){ showToast('اختر زبونًا أولاً', 'err'); return; }
  const cust = Store.getCustomer(custId);
  const pf = valOf('soa-periodFrom');
  const pt = valOf('soa-periodTo') || todayISOApp();
  const allEntries = Store.customerLedger(custId);
  const before = allEntries.filter(e=> pf && e.date < pf);
  const opening = before.reduce((s,e)=> s + (e.debit||0) - (e.credit||0), 0);
  const inRange = allEntries.filter(e=> (!pf || e.date >= pf) && (!pt || e.date <= pt));
  soaDraft = { customerId: custId, customerName: cust.name, opening, entries: inRange, periodFrom: pf, periodTo: pt, dateISO: todayISOApp() };
  const lang = valOf('soa-lang');
  const result = await renderSOA(Object.assign({}, soaDraft, { no: 'SOA-DRAFT' }), lang);
  openPreviewOverlay(result.html, result.qrId, result.qrPayload, 'soa-print');
  document.getElementById('soa-print').disabled = false;
  document.getElementById('soa-preview-note').textContent = 'تمت المعاينة — اضغط زر الطباعة لإصدار الكشف رسميًا وحفظه في الأرشيف.';
}
async function soaPrint(){
  if (!soaDraft){ showToast('ولّد الكشف أولاً', 'err'); return; }
  const lang = valOf('soa-lang');
  soaDraft.no = Store.nextNo('SOA');
  const result = await renderSOA(soaDraft, lang);
  const saved = Store.saveDoc(result.doc);
  closePreviewOverlay();
  document.getElementById('printArea').innerHTML = result.html;
  renderQrInto(document.getElementById('qr-' + result.qrId), result.qrPayload);
  showToast('تم حفظ الكشف: ' + soaDraft.no, 'ok');
  setTimeout(()=>window.print(), 80);
  document.getElementById('soa-print').disabled = true;
  soaDraft = null;
  refreshAllDynamicViews();
}
function soaAddManualEntry(){
  const custId = valOf('soa-customerSelect');
  if (!custId){ showToast('اختر زبونًا أولاً', 'err'); return; }
  const date = valOf('soa-m-date') || todayISOApp();
  const desc = valOf('soa-m-desc').trim();
  const debit = parseFloat(valOf('soa-m-debit') || 0) || 0;
  const credit = parseFloat(valOf('soa-m-credit') || 0) || 0;
  if (!desc || (debit===0 && credit===0)){ showToast('أدخل بيانًا ومبلغًا (مدين أو دائن)', 'err'); return; }
  Store.addLedgerEntry({ customerId: custId, date, type:'manual', ref:'-', desc, debit, credit });
  document.getElementById('soa-m-desc').value = '';
  document.getElementById('soa-m-debit').value = 0;
  document.getElementById('soa-m-credit').value = 0;
  showToast('تمت إضافة الحركة', 'ok');
  refreshAllDynamicViews();
}

// ---------------- reprint from archive --------------------------------------
async function reprintDoc(docId){
  const doc = Store.docs.find(d=>d.id===docId);
  if (!doc){ showToast('لم يتم العثور على المستند', 'err'); return; }
  const lang = doc.lang || 'ar';
  let result;
  if (doc.type === 'invoice' || doc.type === 'quote'){
    const data = {
      no: doc.no, dateISO: doc.dateISO, customerId: doc.customerId, customerName: doc.customerName,
      items: doc.payload.items, labor: doc.payload.labor, laborLabel: doc.payload.laborLabel,
      paidPrev: doc.payload.paidPrev, project: doc.payload.project, location: doc.payload.location,
      ref: doc.payload.ref, validUntil: doc.payload.validUntil,
    };
    result = await renderInvoiceLike(doc.type, data, lang);
  } else if (doc.type === 'receipt'){
    result = await renderReceipt({
      no: doc.no, dateISO: doc.dateISO, customerId: doc.customerId, customerName: doc.customerName,
      amount: doc.totalUsd, method: doc.payload.method, forDesc: doc.payload.forDesc,
    }, lang);
  } else if (doc.type === 'delivery'){
    result = await renderDelivery({
      no: doc.no, dateISO: doc.dateISO, customerId: doc.customerId, customerName: doc.customerName,
      items: doc.payload.items, vehicle: doc.payload.vehicle, deliveredBy: doc.payload.deliveredBy,
      location: doc.payload.location,
    }, lang);
  } else if (doc.type === 'cert'){
    result = await renderCert({
      no: doc.no, dateISO: doc.dateISO, personName: doc.payload.personName, role: doc.payload.role,
      periodFrom: doc.payload.from, periodTo: doc.payload.to, extra: doc.payload.extra,
    }, lang);
  } else if (doc.type === 'soa'){
    result = await renderSOA({
      no: doc.no, dateISO: doc.dateISO, customerId: doc.customerId, customerName: doc.customerName,
      entries: doc.payload.entries, opening: doc.payload.opening,
      periodFrom: doc.payload.periodFrom, periodTo: doc.payload.periodTo,
    }, lang);
  }
  if (!result) return;
  document.getElementById('printArea').innerHTML = result.html;
  renderQrInto(document.getElementById('qr-' + result.qrId), result.qrPayload);
  document.body.classList.add('show-preview');
  window._previewTargetBtn = null;
  document.getElementById('previewPrintBtn').textContent = '🖨 طباعة نسخة';
  document.getElementById('previewPrintBtn').onclick = function(){ closePreviewOverlay(); setTimeout(()=>window.print(), 60); };
}

// ---------------- customers tab -----------------------------------------
function renderCustomersList(){
  const tbody = document.getElementById('cust-list');
  if (!tbody) return;
  tbody.innerHTML = Store.customers.map(c=>{
    const bal = Store.customerBalance(c.id);
    const badgeClass = bal > 0.004 ? 'due' : 'paid';
    const badgeText = bal > 0.004 ? (bal.toFixed(2) + ' $ مستحق') : 'مسدَّد';
    return '<tr>' +
      '<td>' + escAttr(c.name) + '</td>' +
      '<td>' + escAttr(c.phone||'-') + '</td>' +
      '<td><span class="badge ' + badgeClass + '">' + badgeText + '</span></td>' +
      '<td><button class="btn outline sm" data-open-soa="' + c.id + '">كشف الحساب</button></td>' +
      '</tr>';
  }).join('') || '<tr><td colspan="4" class="small">لا يوجد زبائن بعد</td></tr>';
  tbody.querySelectorAll('[data-open-soa]').forEach(btn=>{
    btn.onclick = function(){
      switchTab('soa');
      document.getElementById('soa-customerSelect').value = btn.getAttribute('data-open-soa');
    };
  });
}

// ---------------- archive tab -------------------------------------------
function renderArchiveList(){
  const tbody = document.getElementById('archive-list');
  if (!tbody) return;
  const docs = Store.allDocs();
  tbody.innerHTML = docs.map(d=>{
    return '<tr>' +
      '<td>' + (TYPE_LABELS_AR[d.type]||d.type) + '</td>' +
      '<td class="mono">' + d.no + '</td>' +
      '<td>' + (d.dateISO||'-') + '</td>' +
      '<td>' + escAttr(d.customerName||'-') + '</td>' +
      '<td>' + Number(d.totalUsd||0).toFixed(2) + '</td>' +
      '<td><button class="btn outline sm" data-reprint="' + d.id + '">🖨</button></td>' +
      '</tr>';
  }).join('') || '<tr><td colspan="6" class="small">لا يوجد مستندات مُصدرة بعد</td></tr>';
  tbody.querySelectorAll('[data-reprint]').forEach(btn=>{
    btn.onclick = function(){ reprintDoc(btn.getAttribute('data-reprint')); };
  });
}

// ---------------- home stats ---------------------------------------------
function updateHomeStats(){
  const host = document.getElementById('homeStats');
  if (!host) return;
  const totalDue = Store.customers.reduce((s,c)=> s + Math.max(0, Store.customerBalance(c.id)), 0);
  host.innerHTML =
    statCard(Store.docs.length, 'مستند مُصدر') +
    statCard(Store.customers.length, 'زبون مسجّل') +
    statCard(totalDue.toFixed(2) + ' $', 'إجمالي مستحق على الزبائن');
}
function statCard(value, label){
  return '<div class="card" style="margin-bottom:0;text-align:center;padding:16px">' +
    '<div style="font-size:22px;font-weight:800;color:var(--navy)">' + value + '</div>' +
    '<div class="small">' + label + '</div></div>';
}

function refreshAllDynamicViews(){
  refreshCustomerSelects();
  renderCustomersList();
  renderArchiveList();
  updateHomeStats();
}

// ---------------- verify tab -----------------------------------------------
function loadImageFromFile(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = function(){
      const img = new Image();
      img.onload = ()=>resolve(img);
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
async function decodeQrFromFile(file){
  const img = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(imgData.data, canvas.width, canvas.height);
  return code ? code.data : null;
}
async function runVerify(){
  const fileInput = document.getElementById('verify-file');
  const resultBox = document.getElementById('verify-result');
  resultBox.innerHTML = '<span class="spinner"></span> جارِ التحقق...';
  let text = null;
  try{
    if (fileInput.files && fileInput.files[0]){
      text = await decodeQrFromFile(fileInput.files[0]);
      if (!text) showToast('لم يتم العثور على رمز QR واضح في الصورة، جرّب صورة أوضح أو ألصق النص يدويًا', 'err');
    }
    if (!text) text = document.getElementById('verify-paste').value.trim();
    if (!text){ resultBox.innerHTML = ''; return; }
    const res = await Crypto.verifyPayload(text);
    if (res.ok){
      resultBox.innerHTML =
        '<div class="verifybox ok"><div class="icon">✅</div><div class="title">مستند موثّق وأصلي</div>' +
        '<div class="small" style="margin-top:8px">النوع: ' + (TYPE_LABELS_AR[res.type]||res.type) + ' — الرقم: ' + res.no + '<br>' +
        'التاريخ: ' + res.dateISO + ' — الجهة: ' + escAttr(res.customerName) + ' — القيمة: ' + res.totalUsd + ' $<br>' +
        (res.matchedLocalRecord ? 'مطابق لسجل محفوظ على هذا الجهاز.' : 'لم يُعثر على نسخة محفوظة على هذا الجهاز (قد يكون صادرًا من جهاز آخر لنفس الشركة أو تمت مسح البيانات).') +
        '</div></div>';
    } else {
      resultBox.innerHTML =
        '<div class="verifybox bad"><div class="icon">⛔</div><div class="title">توقيع غير مطابق — قد يكون المستند معدَّلاً أو مزوَّرًا</div>' +
        '<div class="small" style="margin-top:8px">تأكد من أن الرمز مقروء بالكامل وأنك تستخدم نفس الجهاز الذي أصدر المستند.</div></div>';
    }
  }catch(err){
    console.error(err);
    resultBox.innerHTML = '<div class="msg err">حدث خطأ أثناء التحقق: ' + err.message + '</div>';
  }
}

// ---------------- AI tab ---------------------------------------------------
let aiImages = [];
function renderAiThumbs(){
  const host = document.getElementById('ai-thumbs');
  host.innerHTML = '';
  aiImages.forEach((im, idx)=>{
    const wrap = document.createElement('div');
    wrap.style.position = 'relative';
    const img = document.createElement('img');
    img.src = im.dataUrl;
    wrap.appendChild(img);
    const rm = document.createElement('button');
    rm.textContent = '×';
    rm.type = 'button';
    rm.className = 'btn danger sm';
    rm.style.position = 'absolute'; rm.style.top = '-6px'; rm.style.left = '-6px'; rm.style.padding = '1px 6px';
    rm.onclick = ()=>{ aiImages.splice(idx,1); renderAiThumbs(); };
    wrap.appendChild(rm);
    host.appendChild(wrap);
  });
}
function fileToBase64(file){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>{
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      resolve({ dataUrl, base64, mediaType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function setAiStatus(msg, loading, type){
  const el = document.getElementById('ai-status');
  if (!msg){ el.innerHTML = ''; return; }
  el.innerHTML = (loading ? '<span class="spinner"></span> ' : '') + '<span class="msg ' + (type||'info') + '" style="display:inline-block;margin-top:8px">' + msg + '</span>';
}
async function runAiAnalyze(){
  const text = valOf('ai-text').trim();
  if (!text && aiImages.length === 0){ showToast('اكتب وصفًا أو أرفق صورة على الأقل', 'err'); return; }
  setAiStatus('جارِ التحليل بالذكاء الاصطناعي...', true, 'info');
  const markup = parseFloat(valOf('ai-markup') || 0) || 0;
  try{
    const images = aiImages.map(im=>({ mediaType: im.mediaType, data: im.base64 }));
    const resp = await fetch('/api/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, markupPercent: markup, images }),
    });
    if (!resp.ok){
      const errText = await resp.text().catch(()=> '');
      throw new Error('HTTP ' + resp.status + (errText ? (' — ' + errText.slice(0,180)) : ''));
    }
    const json = await resp.json();
    document.getElementById('ai-itemsContainer').innerHTML = '';
    const items = Array.isArray(json.items) ? json.items : [];
    if (items.length === 0) addAiItemRow();
    items.forEach(it=>{
      const qty = Number(it.qty || 1) || 1;
      const unitCost = Number(it.unit_cost != null ? it.unit_cost : (it.cost || 0)) || 0;
      const totalCost = unitCost * qty;
      const sell = +(totalCost * (1 + markup/100)).toFixed(2);
      addAiItemRow({ name: it.name || '', qty, cost: +totalCost.toFixed(2), sell });
    });
    document.getElementById('ai-resultCard').style.display = 'block';
    setAiStatus(json.notes ? ('ملاحظة الذكاء الاصطناعي: ' + json.notes) : '', false, 'ok');
  }catch(err){
    console.error(err);
    setAiStatus('تعذّر الاتصال بخدمة الذكاء الاصطناعي (' + err.message + '). أضف البنود يدويًا أدناه وتابع بشكل طبيعي.', false, 'err');
    document.getElementById('ai-resultCard').style.display = 'block';
    if (document.querySelectorAll('#ai-itemsContainer .ai-item-row').length === 0) addAiItemRow();
  }
}
function aiRecalcMarkup(){
  const markup = parseFloat(valOf('ai-markup') || 0) || 0;
  document.querySelectorAll('#ai-itemsContainer .ai-item-row').forEach(row=>{
    const cost = parseFloat(row.querySelector('.it-cost').value || 0) || 0;
    row.querySelector('.it-sell').value = +(cost * (1 + markup/100)).toFixed(2);
  });
  document.getElementById('ai-itemsContainer').dispatchEvent(new Event('input'));
}
function gatherAiInvoiceData(){
  const { customerId, customerName } = getCustomerChoice('ai');
  const items = readAiItems();
  if (items.length === 0) return { __error: 'أضف بندًا واحدًا على الأقل' };
  return {
    customerId, customerName,
    project: valOf('ai-project'), location: '', ref: '',
    dateISO: todayISOApp(),
    items,
    labor: parseFloat(valOf('ai-labor') || 0) || 0,
    laborLabel: undefined,
    paidPrev: 0,
    validUntil: null,
  };
}

// =======================================================================
// INIT
// =======================================================================
document.addEventListener('DOMContentLoaded', function(){
  setLang(CURLANG);

  // tabbar + home chips
  document.querySelectorAll('.tabbtn').forEach(btn=>{
    btn.addEventListener('click', ()=>switchTab(btn.getAttribute('data-view')));
  });
  document.querySelectorAll('[data-goto]').forEach(btn=>{
    btn.addEventListener('click', ()=>switchTab(btn.getAttribute('data-goto')));
  });
  document.getElementById('btnLangSwitch').addEventListener('click', ()=>{
    setLang(CURLANG === 'ar' ? 'en' : 'ar');
  });
  document.getElementById('previewClose').addEventListener('click', closePreviewOverlay);
  document.getElementById('previewPrintBtn').addEventListener('click', function(){
    const id = window._previewTargetBtn;
    closePreviewOverlay();
    if (id){ const b = document.getElementById(id); if (b) b.click(); }
    else { setTimeout(()=>window.print(), 60); }
  });

  // default dates
  document.getElementById('inv-date').value = todayISOApp();
  document.getElementById('qt-date').value = todayISOApp();
  const validUntil = new Date(); validUntil.setDate(validUntil.getDate() + 14);
  document.getElementById('qt-validUntil').value = validUntil.toISOString().slice(0,10);
  document.getElementById('rec-date').value = todayISOApp();
  document.getElementById('dn-date').value = todayISOApp();
  document.getElementById('cert-date').value = todayISOApp();
  const firstOfMonth = new Date(); firstOfMonth.setDate(1);
  document.getElementById('soa-periodFrom').value = firstOfMonth.toISOString().slice(0,10);
  document.getElementById('soa-periodTo').value = todayISOApp();
  document.getElementById('soa-m-date').value = todayISOApp();

  // ---- invoice tab
  addStdItemRow('inv-items');
  document.getElementById('inv-addItem').addEventListener('click', ()=>addStdItemRow('inv-items'));
  bindTotalsPreview('inv', true);
  document.getElementById('inv-preview').addEventListener('click', ()=>previewOnly({
    prefix:'INV', gatherFn:()=>gatherInvoiceLikeData('inv'),
    renderFn:(d,l)=>renderInvoiceLike('invoice', d, l), langFn:()=>valOf('inv-lang'),
    printTargetBtnId:'inv-print',
  }));
  document.getElementById('inv-print').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'INV', gatherFn:()=>gatherInvoiceLikeData('inv'),
    renderFn:(d,l)=>renderInvoiceLike('invoice', d, l), langFn:()=>valOf('inv-lang'),
    onSaved:linkInvoiceLedger, clearFn:()=>clearInvoiceLikeForm('inv'), doPrint:true,
  }));
  document.getElementById('inv-save').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'INV', gatherFn:()=>gatherInvoiceLikeData('inv'),
    renderFn:(d,l)=>renderInvoiceLike('invoice', d, l), langFn:()=>valOf('inv-lang'),
    onSaved:linkInvoiceLedger, clearFn:()=>clearInvoiceLikeForm('inv'), doPrint:false,
  }));

  // ---- quote tab
  addStdItemRow('qt-items');
  document.getElementById('qt-addItem').addEventListener('click', ()=>addStdItemRow('qt-items'));
  bindTotalsPreview('qt', false);
  document.getElementById('qt-preview').addEventListener('click', ()=>previewOnly({
    prefix:'QUO', gatherFn:()=>gatherInvoiceLikeData('qt'),
    renderFn:(d,l)=>renderInvoiceLike('quote', d, l), langFn:()=>valOf('qt-lang'),
    printTargetBtnId:'qt-print',
  }));
  document.getElementById('qt-print').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'QUO', gatherFn:()=>gatherInvoiceLikeData('qt'),
    renderFn:(d,l)=>renderInvoiceLike('quote', d, l), langFn:()=>valOf('qt-lang'),
    onSaved:null, clearFn:()=>clearInvoiceLikeForm('qt'), doPrint:true,
  }));
  document.getElementById('qt-save').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'QUO', gatherFn:()=>gatherInvoiceLikeData('qt'),
    renderFn:(d,l)=>renderInvoiceLike('quote', d, l), langFn:()=>valOf('qt-lang'),
    onSaved:null, clearFn:()=>clearInvoiceLikeForm('qt'), doPrint:false,
  }));

  // ---- receipt tab
  document.getElementById('rec-preview').addEventListener('click', ()=>previewOnly({
    prefix:'REC', gatherFn:gatherReceiptData, renderFn:renderReceipt, langFn:()=>valOf('rec-lang'),
    printTargetBtnId:'rec-print',
  }));
  document.getElementById('rec-print').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'REC', gatherFn:gatherReceiptData, renderFn:renderReceipt, langFn:()=>valOf('rec-lang'),
    onSaved:linkReceiptLedger, clearFn:clearReceiptForm, doPrint:true,
  }));
  document.getElementById('rec-save').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'REC', gatherFn:gatherReceiptData, renderFn:renderReceipt, langFn:()=>valOf('rec-lang'),
    onSaved:linkReceiptLedger, clearFn:clearReceiptForm, doPrint:false,
  }));

  // ---- delivery tab
  addDnItemRow('dn-items');
  document.getElementById('dn-addItem').addEventListener('click', ()=>addDnItemRow('dn-items'));
  document.getElementById('dn-preview').addEventListener('click', ()=>previewOnly({
    prefix:'DN', gatherFn:gatherDeliveryData, renderFn:renderDelivery, langFn:()=>valOf('dn-lang'),
    printTargetBtnId:'dn-print',
  }));
  document.getElementById('dn-print').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'DN', gatherFn:gatherDeliveryData, renderFn:renderDelivery, langFn:()=>valOf('dn-lang'),
    onSaved:null, clearFn:clearDeliveryForm, doPrint:true,
  }));
  document.getElementById('dn-save').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'DN', gatherFn:gatherDeliveryData, renderFn:renderDelivery, langFn:()=>valOf('dn-lang'),
    onSaved:null, clearFn:clearDeliveryForm, doPrint:false,
  }));

  // ---- certificate tab
  document.getElementById('cert-preview').addEventListener('click', ()=>previewOnly({
    prefix:'CERT', gatherFn:gatherCertData, renderFn:renderCert, langFn:()=>valOf('cert-lang'),
    printTargetBtnId:'cert-print',
  }));
  document.getElementById('cert-print').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'CERT', gatherFn:gatherCertData, renderFn:renderCert, langFn:()=>valOf('cert-lang'),
    onSaved:null, clearFn:clearCertForm, doPrint:true,
  }));
  document.getElementById('cert-save').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'CERT', gatherFn:gatherCertData, renderFn:renderCert, langFn:()=>valOf('cert-lang'),
    onSaved:null, clearFn:clearCertForm, doPrint:false,
  }));

  // ---- SOA tab
  document.getElementById('soa-generate').addEventListener('click', soaGenerate);
  document.getElementById('soa-print').addEventListener('click', soaPrint);
  document.getElementById('soa-m-add').addEventListener('click', soaAddManualEntry);

  // ---- AI tab
  const uploadbox = document.getElementById('ai-uploadbox');
  const aiImagesInput = document.getElementById('ai-images');
  uploadbox.addEventListener('click', ()=>aiImagesInput.click());
  uploadbox.addEventListener('dragover', e=>{ e.preventDefault(); uploadbox.classList.add('drag'); });
  uploadbox.addEventListener('dragleave', ()=>uploadbox.classList.remove('drag'));
  uploadbox.addEventListener('drop', async e=>{
    e.preventDefault(); uploadbox.classList.remove('drag');
    await addAiFiles(e.dataTransfer.files);
  });
  aiImagesInput.addEventListener('change', async e=>{ await addAiFiles(e.target.files); e.target.value=''; });
  async function addAiFiles(fileList){
    for (const f of Array.from(fileList)){
      if (!f.type.startsWith('image/')) continue;
      const res = await fileToBase64(f);
      aiImages.push(res);
    }
    renderAiThumbs();
  }
  document.getElementById('ai-analyzeBtn').addEventListener('click', runAiAnalyze);
  document.getElementById('ai-addItem').addEventListener('click', ()=>addAiItemRow());
  document.getElementById('ai-recalc').addEventListener('click', aiRecalcMarkup);
  bindAiTotalsPreview();
  document.getElementById('ai-issueBtn').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'INV', gatherFn:gatherAiInvoiceData, renderFn:(d,l)=>renderInvoiceLike('invoice', d, l),
    langFn:()=>valOf('ai-lang'), onSaved:linkInvoiceLedger, clearFn:clearAiForm, doPrint:true,
  }));
  document.getElementById('ai-issueSaveOnly').addEventListener('click', ()=>finalizeAndOutput({
    prefix:'INV', gatherFn:gatherAiInvoiceData, renderFn:(d,l)=>renderInvoiceLike('invoice', d, l),
    langFn:()=>valOf('ai-lang'), onSaved:linkInvoiceLedger, clearFn:clearAiForm, doPrint:false,
  }));

  // ---- verify tab
  document.getElementById('verify-btn').addEventListener('click', runVerify);

  // ---- customers tab
  document.getElementById('cust-add').addEventListener('click', ()=>{
    const name = valOf('cust-name').trim();
    if (!name){ showToast('أدخل اسم الزبون', 'err'); return; }
    Store.addCustomer({ name, phone: valOf('cust-phone'), address: valOf('cust-address') });
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('cust-address').value = '';
    refreshAllDynamicViews();
    showToast('تمت إضافة الزبون', 'ok');
  });

  // ---- settings tab
  document.getElementById('settings-export').addEventListener('click', ()=>Store.exportBackup());
  document.getElementById('settings-import').addEventListener('change', function(e){
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(){
      try{
        const obj = JSON.parse(reader.result);
        Store.importBackup(obj);
        refreshAllDynamicViews();
        showToast('تم استيراد النسخة الاحتياطية بنجاح', 'ok');
      }catch(err){ showToast('ملف غير صالح: ' + err.message, 'err'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
  let secretShown = false;
  document.getElementById('settings-revealSecret').addEventListener('click', async function(){
    const box = document.getElementById('settings-secretBox');
    secretShown = !secretShown;
    if (secretShown){
      box.textContent = await Crypto.getSecretRaw();
      this.textContent = '🙈 إخفاء المفتاح';
    } else {
      box.textContent = '';
      this.textContent = '👁 إظهار المفتاح';
    }
  });
  document.getElementById('settings-wipe').addEventListener('click', function(){
    if (confirm('هل أنت متأكد؟ سيتم حذف كل الزبائن والمستندات ومفتاح التوثيق من هذا الجهاز نهائيًا. تأكد أنك أخذت نسخة احتياطية أولاً.')){
      Store.wipeAll();
      location.reload();
    }
  });

  refreshAllDynamicViews();
});
