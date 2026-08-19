// =======================================================================
// render.js — printable document templates, shared header/footer, QR code
// =======================================================================
const COMPANY = {
  name: 'iCOOL Trading & Contracting',
  cert: 'Deye Certified Engineer',
  services: 'HVAC • Solar Energy Systems • Electrical • Plumbing • MEP Solutions',
  addrLine: 'Jiyyeh – Lebanon',
  mobile: '+961 3 715 512',
};

const DOC_I18N = {
  ar: {
    invoice: 'فاتورة', invoice_en:'INVOICE',
    soa: 'كشف حساب', soa_en:'STATEMENT OF ACCOUNT',
    receipt: 'إيصال قبض', receipt_en:'RECEIPT',
    delivery: 'إذن تسليم', delivery_en:'DELIVERY NOTE',
    cert: 'شهادة خبرة', cert_en:'CERTIFICATE OF EXPERIENCE',
    quote: 'عرض سعر', quote_en:'QUOTATION',
    docNo:'رقم المستند', date:'التاريخ', client:'العميل', project:'المشروع',
    location:'الموقع', ref:'المرجع', statement:'تفاصيل المستند', item:'البيان',
    qty:'الكمية', unitPrice:'السعر المفرد', value:'الإجمالي', subtotalMaterials:'إجمالي المواد والتوريدات',
    labor:'أجرة أعمال', total:'الإجمالي', paidPrev:'المدفوع سابقاً', dueBalance:'الرصيد المستحق',
    notesTitle:'ملاحظات وشروط:',
    notesInvoice:'الأسعار بالدولار الأميركي. تُستحق الفاتورة عند الاستلام ما لم يُتفق على غير ذلك. الضمان: سنة على أعمال التركيب وضمان الوكيل على المعدات. أي أعمال أو مواد إضافية تُدرج في فاتورة لاحقة.',
    notesQuote:'هذا العرض غير مُلزم إلا بعد التوقيع عليه من الطرفين، ويبقى سعره ثابتًا خلال فترة الصلاحية المذكورة أعلاه. الأسعار بالدولار الأميركي.',
    notesDelivery:'يُرجى من المستلم فحص البضاعة والتأكد من مطابقتها للكمية والحالة المذكورة أعلاه عند التسليم. أي ملاحظة تُذكر فورًا.',
    validUntil:'العرض صالح حتى', receivedFrom:'وصلني من السادة', amount:'المبلغ',
    amountWords:'المبلغ كتابةً', paymentMethod:'طريقة الدفع', forDesc:'عن حساب',
    cash:'نقدًا', check:'شيك', transfer:'حوالة مصرفية', other:'أخرى',
    deliveredBy:'المسلِّم', receivedBy:'المستلِم', vehicle:'رقم المركبة',
    certTo:'تشهد شركة iCOOL للتجارة والمقاولات بأن',
    certRole:'قد عمل لدى الشركة / تعاون معها بصفة',
    certPeriod:'خلال الفترة الممتدة من', certTo2:'إلى',
    certBody:'وأنه أظهر كفاءة والتزامًا مهنيًا خلال هذه الفترة. وقد أُعطيت هذه الشهادة بناءً على طلبه دون أي مسؤولية على الشركة.',
    signClient:'توقيع العميل', signCompany:'توقيع وختم الشركة', signReceiver:'توقيع المستلِم',
    verifyLabel:'رمز التحقق — امسحه عبر تبويب "التحقق" في المنصة للتأكد من صحة المستند',
    balanceFrom:'كشف حساب من تاريخ', balanceTo:'إلى تاريخ', runningBalance:'الرصيد',
    dateCol:'التاريخ', descCol:'البيان', debitCol:'مدين (عليه)', creditCol:'دائن (له)',
    openingBal:'الرصيد الافتراضي', closingBal:'الرصيد الختامي المستحق',
    days:'يوم', validityDays:'صلاحية العرض (يوم)',
  },
  en: {
    invoice: 'Invoice', invoice_en:'فاتورة',
    soa: 'Statement of Account', soa_en:'كشف حساب',
    receipt: 'Receipt', receipt_en:'إيصال قبض',
    delivery: 'Delivery Note', delivery_en:'إذن تسليم',
    cert: 'Certificate of Experience', cert_en:'شهادة خبرة',
    quote: 'Quotation', quote_en:'عرض سعر',
    docNo:'Document No.', date:'Date', client:'Client', project:'Project',
    location:'Location', ref:'Reference', statement:'Document Details', item:'Description',
    qty:'Qty', unitPrice:'Unit Price', value:'Total', subtotalMaterials:'Materials & Supplies Subtotal',
    labor:'Labor Charges', total:'Total', paidPrev:'Previously Paid', dueBalance:'Balance Due',
    notesTitle:'Notes & Terms:',
    notesInvoice:'Prices in US Dollars. Invoice is due upon receipt unless otherwise agreed. Warranty: one year on installation work; equipment covered by manufacturer/agent warranty. Additional work or materials will be billed separately.',
    notesQuote:'This quotation is not binding until signed by both parties, and pricing remains fixed within the validity period stated above. Prices in USD.',
    notesDelivery:'Recipient is requested to inspect the goods and confirm quantity/condition upon delivery. Any discrepancy must be noted immediately.',
    validUntil:'Valid until', receivedFrom:'Received from Messrs.', amount:'Amount',
    amountWords:'Amount in words', paymentMethod:'Payment Method', forDesc:'For account of',
    cash:'Cash', check:'Cheque', transfer:'Bank Transfer', other:'Other',
    deliveredBy:'Delivered by', receivedBy:'Received by', vehicle:'Vehicle No.',
    certTo:'iCOOL Trading & Contracting hereby certifies that',
    certRole:'has worked with / cooperated with the company in the capacity of',
    certPeriod:'during the period from', certTo2:'to',
    certBody:'and has demonstrated competence and professional commitment throughout this period. This certificate is issued upon request without any liability on the company.',
    signClient:'Client Signature', signCompany:'Company Signature & Stamp', signReceiver:'Receiver Signature',
    verifyLabel:'Verification code — scan via the "Verify" tab in the platform to confirm document authenticity',
    balanceFrom:'Statement from', balanceTo:'to', runningBalance:'Balance',
    dateCol:'Date', descCol:'Description', debitCol:'Debit', creditCol:'Credit',
    openingBal:'Opening Balance', closingBal:'Closing Balance Due',
    days:'days', validityDays:'Validity (days)',
  }
};
function dt(lang, key){ return (DOC_I18N[lang] && DOC_I18N[lang][key]) || key; }

function fmt(n){ return Number(n||0).toFixed(2); }
function todayISO(){ return new Date().toISOString().slice(0,10); }
function fmtDateHuman(iso, lang){
  if (!iso) return '—';
  const [y,m,d] = iso.split('-');
  return lang==='en' ? `${d}/${m}/${y}` : `${d} / ${m} / ${y}`;
}

// ---------------- Amount in words -------------------------------------
const AR_ONES = ['','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة'];
const AR_TENS = ['عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر'];
const AR_DECA = ['','عشرة','عشرون','ثلاثون','أربعون','خمسون','ستون','سبعون','ثمانون','تسعون'];
const AR_HUND = ['','مئة','مئتان','ثلاثمئة','أربعمئة','خمسمئة','ستمئة','سبعمئة','ثمانمئة','تسعمئة'];
function arThreeDigits(n){
  n = Math.floor(n);
  if (n===0) return '';
  const h = Math.floor(n/100), r = n%100;
  let parts = [];
  if (h) parts.push(AR_HUND[h]);
  if (r){
    if (r<10) parts.push(AR_ONES[r]);
    else if (r<20) parts.push(AR_TENS[r-10]);
    else {
      const o = r%10, d = Math.floor(r/10);
      if (o) parts.push(AR_ONES[o] + ' و' + AR_DECA[d]);
      else parts.push(AR_DECA[d]);
    }
  }
  return parts.join(' و');
}
function numberToArabicWords(num){
  num = Math.round(num);
  if (num === 0) return 'صفر';
  const scales = [['', 1], ['ألف', 1000], ['مليون', 1000000]];
  let groups = [];
  let n = num;
  let idx = 0;
  const chunks = [];
  while (n > 0){ chunks.push(n % 1000); n = Math.floor(n/1000); }
  for (let i = chunks.length-1; i>=0; i--){
    const val = chunks[i];
    if (!val) continue;
    let words = arThreeDigits(val);
    if (i === 1){
      words = (val === 1) ? 'ألف' : (val === 2 ? 'ألفان' : words + ' ألف');
    } else if (i === 2){
      words = (val === 1) ? 'مليون' : (val === 2 ? 'مليونان' : words + ' مليون');
    }
    groups.push(words);
  }
  return groups.join(' و');
}
function amountToWords(amountUsd, lang){
  const whole = Math.floor(amountUsd);
  const cents = Math.round((amountUsd - whole) * 100);
  if (lang === 'en'){
    return `US Dollars ${whole.toLocaleString('en-US')} only` + (cents ? ` and ${cents}/100 cents` : '');
  }
  let s = numberToArabicWords(whole) + ' دولار أميركي فقط';
  if (cents) s += ' و' + numberToArabicWords(cents) + ' سنت';
  return s + ' لا غير';
}

// ---------------- QR rendering ------------------------------------------
// The vendored qrcode-generator library defaults to a naive Latin1 byte
// conversion that corrupts any non-ASCII text (Arabic customer names, etc).
// It ships a proper UTF-8 encoder too — just not enabled by default.
if (typeof qrcode !== 'undefined' && qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']){
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
}
function renderQrInto(containerEl, text){
  containerEl.innerHTML = '';
  try{
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const size = qr.getModuleCount();
    const cell = 4;
    const canvas = document.createElement('canvas');
    canvas.width = size*cell; canvas.height = size*cell;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#14406e';
    for (let r=0;r<size;r++){
      for (let c=0;c<size;c++){
        if (qr.isDark(r,c)) ctx.fillRect(c*cell, r*cell, cell, cell);
      }
    }
    canvas.style.width = '100%'; canvas.style.height = '100%';
    containerEl.appendChild(canvas);
  }catch(e){ containerEl.textContent = '(QR error)'; }
}

// ---------------- Shared header / footer --------------------------------
function docHeaderHtml(){
  return `
  <div class="doc-hdr">
    <div class="cell logo"><img src="assets/logo.png"></div>
    <div class="cell co">
      <div class="doc-co-name">${COMPANY.name}</div>
      <div class="doc-co-cert">${COMPANY.cert}</div>
      <div class="doc-co-serv">${COMPANY.services}</div>
      <div class="doc-co-addr">${COMPANY.addrLine} &nbsp;|&nbsp; Mobile: <b>${COMPANY.mobile}</b></div>
    </div>
  </div>`;
}
function docFooterHtml(){
  return `
  <div class="doc-footer">
    <div>${COMPANY.name} — ${COMPANY.addrLine} — Mobile: ${COMPANY.mobile}</div>
    <div class="tag">Precision Comfort, Professionally Installed</div>
  </div>`;
}
function docTitleBlockHtml(lang, titleKey, docNo, dateISO){
  const D = DOC_I18N[lang];
  return `
  <div class="doc-titlerow">
    <div class="cell">
      <table class="doc-meta"><tr>
        <td class="lb">${D.docNo}:</td><td class="vl mono">${docNo}</td>
      </tr><tr>
        <td class="lb">${D.date}:</td><td class="vl mono">${fmtDateHuman(dateISO, lang)}</td>
      </tr></table>
    </div>
    <div class="cell" style="text-align:${lang==='ar'?'right':'left'}">
      <div class="doc-title">${D[titleKey]}</div>
      <div class="doc-title-en">${D[titleKey+'_en']}</div>
    </div>
  </div>`;
}
async function docQrFooterHtml(sig, doc, lang){
  const D = DOC_I18N[lang];
  const payload = Crypto.buildQrPayload(doc, sig);
  return `
  <div class="doc-qr-block">
    <div id="qr-${doc._qrId}"></div>
    <div class="doc-verify-label">${D.verifyLabel}</div>
    <div class="doc-qr-code-text">${payload}</div>
  </div>`;
}
function signColHtml(label){
  return `<img class="sg" src="assets/signature.png" alt=""><div class="doc-sign-line">${label}</div>`;
}
function blankSignColHtml(label){
  return `<div class="sign-spacer"></div><div class="doc-sign-line">${label}</div>`;
}
function docFootzoneHtml(cols){
  return `<div class="doc-footzone">${cols.filter(Boolean).map(c=>`<div class="fcol">${c}</div>`).join('')}</div>`;
}

// ---------------- Items table helper -------------------------------------
function lineTotalOf(it){
  const qty = Number(it.qty||0);
  if (it.unitPrice != null && it.unitPrice !== '') return +(qty * Number(it.unitPrice)).toFixed(2);
  return Number(it.value||0);
}
function unitPriceOf(it){
  if (it.unitPrice != null && it.unitPrice !== '') return Number(it.unitPrice);
  const qty = Number(it.qty||0);
  return qty ? Number(it.value||0) / qty : Number(it.value||0);
}
function itemsRowsHtml(items, lang){
  return items.map((it, i) => {
    const qty = Number(it.qty||0);
    return `<tr class="${i%2?'alt':''}"><td>${escapeHtml(it.name)}</td><td class="q">${qty}</td><td class="v">${fmt(unitPriceOf(it))}</td><td class="v">${fmt(lineTotalOf(it))}</td></tr>`;
  }).join('');
}
function escapeHtml(s){
  return String(s==null?'':s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// =======================================================================
// Per-document renderers. Each returns {html, doc} where doc is the record
// to be signed + saved (caller assigns doc.no/dateISO/totalUsd before).
// =======================================================================

async function renderInvoiceLike(kind, data, lang){
  // kind: 'invoice' | 'quote'
  const D = DOC_I18N[lang];
  const items = data.items || [];
  const materialsTotal = items.reduce((s,it)=> s + lineTotalOf(it), 0);
  const labor = Number(data.labor||0);
  const laborLabel = data.laborLabel || D.labor;
  const total = materialsTotal + labor;
  const paidPrev = Number(data.paidPrev||0);
  const due = total - paidPrev;

  const doc = {
    type: kind, no: data.no, dateISO: data.dateISO, customerId: data.customerId,
    customerName: data.customerName, totalUsd: due, lang,
    payload: { items, labor, laborLabel, materialsTotal, total, paidPrev, project: data.project, location: data.location, ref: data.ref, validUntil: data.validUntil||null },
  };
  doc._qrId = Math.random().toString(36).slice(2,9);
  const sig = await Crypto.signDoc(doc);

  const rows = itemsRowsHtml(items, lang);
  const laborRow = labor ? `<tr class="sub"><td>${escapeHtml(laborLabel)}</td><td class="q"></td><td class="v"></td><td class="v">${fmt(labor)}</td></tr>` : '';
  const materialsSubtotalRow = `<tr class="sub"><td>${D.subtotalMaterials}</td><td class="q"></td><td class="v"></td><td class="v">${fmt(materialsTotal)}</td></tr>`;

  let tailRows = '';
  if (kind === 'invoice'){
    tailRows = `
      <tr class="tot"><td>${D.total}</td><td class="q"></td><td class="v"></td><td class="v">${fmt(total)}</td></tr>
      <tr class="paid"><td>${D.paidPrev}</td><td class="q"></td><td class="v"></td><td class="v">${fmt(paidPrev)}</td></tr>
      <tr class="due"><td>${D.dueBalance}</td><td class="q"></td><td class="v"></td><td class="v">${fmt(due)}</td></tr>`;
  } else {
    tailRows = `<tr class="tot"><td>${D.total}</td><td class="q"></td><td class="v"></td><td class="v">${fmt(total)}</td></tr>`;
  }

  const dueBoxLabel = kind === 'invoice' ? D.dueBalance : D.total;
  const dueBoxVal = kind === 'invoice' ? due : total;
  const notes = kind === 'invoice' ? D.notesInvoice : D.notesQuote;
  const validity = kind === 'quote' && data.validUntil ? `<div class="hint" style="margin-top:6px"><b>${D.validUntil}:</b> ${fmtDateHuman(data.validUntil, lang)}</div>` : '';

  const html = `
  <div class="docwrap doc-lang-${lang}" dir="${lang==='en'?'ltr':'rtl'}">
    ${docHeaderHtml()}
    ${docTitleBlockHtml(lang, kind==='invoice'?'invoice':'quote', doc.no, doc.dateISO)}
    <div class="doc-client"><table><tr>
      <td style="width:50%"><b>${D.client}:</b> ${escapeHtml(data.customerName||'-')}</td>
      <td style="width:50%"><b>${D.project}:</b> ${escapeHtml(data.project||'-')}</td>
    </tr><tr>
      <td><b>${D.location}:</b> ${escapeHtml(data.location||'-')}</td>
      <td><b>${D.ref}:</b> ${escapeHtml(data.ref||'-')}</td>
    </tr></table></div>
    <div class="doc-sec">${D.statement}</div>
    <table class="doc-items">
      <tr><th>${D.item}</th><th class="q" style="width:55px">${D.qty}</th><th class="v" style="width:85px">${D.unitPrice}</th><th class="v" style="width:90px">${D.value}</th></tr>
      ${rows}
      ${materialsSubtotalRow}
      ${laborRow}
      ${tailRows}
    </table>
    <div class="doc-blocks"><table style="width:100%"><tr>
      <td valign="top">
        <div class="doc-notes"><b>${D.notesTitle}</b><p>${notes}</p>${validity}</div>
      </td>
      <td style="width:14px"></td>
      <td style="width:230px" valign="top">
        <div class="doc-duebox"><div class="h">${dueBoxLabel}</div><div class="v">${fmt(dueBoxVal)} USD</div></div>
      </td>
    </tr></table></div>
    ${docFootzoneHtml([signColHtml(D.signCompany), await docQrFooterHtml(sig, doc, lang), blankSignColHtml(D.signClient)])}
    ${docFooterHtml()}
  </div>`;
  return { html, doc, sig, qrId: doc._qrId, qrPayload: Crypto.buildQrPayload(doc, sig) };
}

async function renderReceipt(data, lang){
  const D = DOC_I18N[lang];
  const amount = Number(data.amount||0);
  const doc = {
    type:'receipt', no: data.no, dateISO: data.dateISO, customerId: data.customerId,
    customerName: data.customerName, totalUsd: amount, lang,
    payload: { amount, method: data.method, forDesc: data.forDesc },
  };
  doc._qrId = Math.random().toString(36).slice(2,9);
  const sig = await Crypto.signDoc(doc);
  const methodLabel = { cash:D.cash, check:D.check, transfer:D.transfer, other:D.other }[data.method] || data.method;

  const html = `
  <div class="docwrap doc-lang-${lang}" dir="${lang==='en'?'ltr':'rtl'}">
    ${docHeaderHtml()}
    ${docTitleBlockHtml(lang, 'receipt', doc.no, doc.dateISO)}
    <div class="doc-client"><table><tr>
      <td style="width:100%"><b>${D.receivedFrom}:</b> ${escapeHtml(data.customerName||'-')}</td>
    </tr></table></div>
    <div class="doc-sec">${D.statement}</div>
    <table class="doc-items">
      <tr><th>${D.item}</th><th class="v" style="width:130px">${D.value}</th></tr>
      <tr><td>${D.forDesc}: ${escapeHtml(data.forDesc||'-')} &nbsp; (${D.paymentMethod}: ${escapeHtml(methodLabel)})</td><td class="v">${fmt(amount)}</td></tr>
      <tr class="due"><td>${D.amount}</td><td class="v">${fmt(amount)}</td></tr>
    </table>
    <div class="doc-words"><b>${D.amountWords}:</b> ${amountToWords(amount, lang)}</div>
    ${docFootzoneHtml([signColHtml(D.signCompany), await docQrFooterHtml(sig, doc, lang), blankSignColHtml(D.signClient)])}
    ${docFooterHtml()}
  </div>`;
  return { html, doc, sig, qrId: doc._qrId, qrPayload: Crypto.buildQrPayload(doc, sig) };
}

async function renderDelivery(data, lang){
  const D = DOC_I18N[lang];
  const items = data.items || [];
  const doc = {
    type:'delivery', no: data.no, dateISO: data.dateISO, customerId: data.customerId,
    customerName: data.customerName, totalUsd: 0, lang,
    payload: { items, vehicle: data.vehicle, deliveredBy: data.deliveredBy, location: data.location },
  };
  doc._qrId = Math.random().toString(36).slice(2,9);
  const sig = await Crypto.signDoc(doc);
  const rows = items.map((it,i)=>`<tr class="${i%2?'alt':''}"><td>${escapeHtml(it.name)}</td><td class="q">${it.qty}</td></tr>`).join('');

  const html = `
  <div class="docwrap doc-lang-${lang}" dir="${lang==='en'?'ltr':'rtl'}">
    ${docHeaderHtml()}
    ${docTitleBlockHtml(lang, 'delivery', doc.no, doc.dateISO)}
    <div class="doc-client"><table><tr>
      <td style="width:50%"><b>${D.client}:</b> ${escapeHtml(data.customerName||'-')}</td>
      <td style="width:50%"><b>${D.location}:</b> ${escapeHtml(data.location||'-')}</td>
    </tr><tr>
      <td><b>${D.deliveredBy}:</b> ${escapeHtml(data.deliveredBy||'-')}</td>
      <td><b>${D.vehicle}:</b> ${escapeHtml(data.vehicle||'-')}</td>
    </tr></table></div>
    <div class="doc-sec">${D.statement}</div>
    <table class="doc-items">
      <tr><th>${D.item}</th><th class="q" style="width:90px">${D.qty}</th></tr>
      ${rows}
    </table>
    <div class="doc-blocks"><div class="doc-notes"><b>${D.notesTitle}</b><p>${D.notesDelivery}</p></div></div>
    ${docFootzoneHtml([blankSignColHtml(D.deliveredBy), await docQrFooterHtml(sig, doc, lang), blankSignColHtml(D.signReceiver)])}
    ${docFooterHtml()}
  </div>`;
  return { html, doc, sig, qrId: doc._qrId, qrPayload: Crypto.buildQrPayload(doc, sig) };
}

async function renderCert(data, lang){
  const D = DOC_I18N[lang];
  const doc = {
    type:'cert', no: data.no, dateISO: data.dateISO, customerId: null,
    customerName: data.personName, totalUsd: 0, lang,
    payload: { personName: data.personName, role: data.role, from: data.periodFrom, to: data.periodTo, extra: data.extra },
  };
  doc._qrId = Math.random().toString(36).slice(2,9);
  const sig = await Crypto.signDoc(doc);

  const html = `
  <div class="docwrap doc-lang-${lang}" dir="${lang==='en'?'ltr':'rtl'}">
    ${docHeaderHtml()}
    ${docTitleBlockHtml(lang, 'cert', doc.no, doc.dateISO)}
    <div class="doc-cert-title">${DOC_I18N[lang].cert}</div>
    <div class="doc-cert-title-en">${DOC_I18N[lang].cert_en}</div>
    <div class="doc-cert-body">
      ${D.certTo} <b>${escapeHtml(data.personName)}</b> ${D.certRole} <b>${escapeHtml(data.role)}</b>،
      ${D.certPeriod} <b>${fmtDateHuman(data.periodFrom, lang)}</b> ${D.certTo2} <b>${fmtDateHuman(data.periodTo, lang)}</b>.
      <br><br>${D.certBody}
      ${data.extra ? `<br><br>${escapeHtml(data.extra)}` : ''}
    </div>
    ${docFootzoneHtml([signColHtml(D.signCompany), await docQrFooterHtml(sig, doc, lang)])}
    ${docFooterHtml()}
  </div>`;
  return { html, doc, sig, qrId: doc._qrId, qrPayload: Crypto.buildQrPayload(doc, sig) };
}

async function renderSOA(data, lang){
  const D = DOC_I18N[lang];
  const entries = data.entries || [];
  let bal = Number(data.opening||0);
  const rowsArr = entries.map(e=>{
    bal += (Number(e.debit)||0) - (Number(e.credit)||0);
    return { ...e, running: bal };
  });
  const rows = rowsArr.map((e,i)=>`
    <tr class="${i%2?'alt':''}">
      <td class="q" style="width:70px">${fmtDateHuman(e.date, lang)}</td>
      <td>${escapeHtml(e.desc)}</td>
      <td class="v" style="width:80px">${e.debit? fmt(e.debit):''}</td>
      <td class="v" style="width:80px">${e.credit? fmt(e.credit):''}</td>
      <td class="v" style="width:85px">${fmt(e.running)}</td>
    </tr>`).join('');
  const closing = rowsArr.length ? rowsArr[rowsArr.length-1].running : Number(data.opening||0);

  const doc = {
    type:'soa', no: data.no, dateISO: data.dateISO, customerId: data.customerId,
    customerName: data.customerName, totalUsd: closing, lang,
    payload: { entries, opening: data.opening, closing, periodFrom: data.periodFrom, periodTo: data.periodTo },
  };
  doc._qrId = Math.random().toString(36).slice(2,9);
  const sig = await Crypto.signDoc(doc);

  const html = `
  <div class="docwrap doc-lang-${lang}" dir="${lang==='en'?'ltr':'rtl'}">
    ${docHeaderHtml()}
    ${docTitleBlockHtml(lang, 'soa', doc.no, doc.dateISO)}
    <div class="doc-client"><table><tr>
      <td style="width:100%"><b>${D.client}:</b> ${escapeHtml(data.customerName||'-')}</td>
    </tr></table></div>
    <div class="doc-sec">${D.balanceFrom} ${fmtDateHuman(data.periodFrom,lang)} ${D.balanceTo} ${fmtDateHuman(data.periodTo,lang)}</div>
    <table class="doc-items">
      <tr><th>${D.dateCol}</th><th>${D.descCol}</th><th class="v">${D.debitCol}</th><th class="v">${D.creditCol}</th><th class="v">${D.runningBalance}</th></tr>
      <tr class="sub"><td colspan="4">${D.openingBal}</td><td class="v">${fmt(data.opening||0)}</td></tr>
      ${rows}
      <tr class="due"><td colspan="4">${D.closingBal}</td><td class="v">${fmt(closing)}</td></tr>
    </table>
    ${docFootzoneHtml([signColHtml(D.signCompany), await docQrFooterHtml(sig, doc, lang)])}
    ${docFooterHtml()}
  </div>`;
  return { html, doc, sig, qrId: doc._qrId, qrPayload: Crypto.buildQrPayload(doc, sig) };
}
