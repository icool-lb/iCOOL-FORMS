// =======================================================================
// i18n — UI dictionary (Arabic / English). Document content has its own
// bilingual label sets inside render.js (DOC_I18N) since documents can be
// issued in either language independent of the current UI language.
// =======================================================================
const I18N = {
  ar: {
    appName: "منصة iCOOL للمستندات",
    tab_home: "الرئيسية",
    tab_invoice: "فاتورة",
    tab_soa: "كشف حساب",
    tab_receipt: "إيصال قبض",
    tab_delivery: "إذن تسليم",
    tab_cert: "شهادة خبرة",
    tab_quote: "عرض سعر",
    tab_ai: "الذكاء الاصطناعي",
    tab_verify: "التحقق",
    tab_customers: "الزبائن",
    tab_archive: "الأرشيف",
    tab_settings: "الإعدادات",
    lang_switch: "English",
    backup_btn: "نسخة احتياطية",
    home_title: "أهلاً بك في منصة iCOOL للمستندات",
    home_sub: "إصدار الفواتير وكشوف الحساب والإيصالات وسائر المستندات الرسمية، موثّقة برمز تحقق خاص، وتُحفظ محليًا على جهازك.",
    home_local_warn: "⚠️ كل البيانات محفوظة محليًا على هذا الجهاز فقط. يُنصح بأخذ نسخة احتياطية بشكل دوري من تبويب الإعدادات، وإلا قد تُفقد البيانات عند حذف بيانات المتصفح أو تغيير الجهاز.",
    quick_new: "إصدار مستند جديد",
    stat_docs: "مستند مُصدر",
    stat_customers: "زبون مسجّل",
    stat_due: "إجمالي مستحق (USD)",
  },
  en: {
    appName: "iCOOL Documents Platform",
    tab_home: "Home",
    tab_invoice: "Invoice",
    tab_soa: "Statement",
    tab_receipt: "Receipt",
    tab_delivery: "Delivery Note",
    tab_cert: "Certificate",
    tab_quote: "Quotation",
    tab_ai: "AI Assistant",
    tab_verify: "Verify",
    tab_customers: "Customers",
    tab_archive: "Archive",
    tab_settings: "Settings",
    lang_switch: "العربية",
    backup_btn: "Backup",
    home_title: "Welcome to the iCOOL Documents Platform",
    home_sub: "Issue invoices, statements of account, receipts, and other official documents, each secured with a verification code, stored locally on your device.",
    home_local_warn: "⚠️ All data is stored locally on this device only. Take a backup regularly from Settings, or data may be lost if browser data is cleared or the device changes.",
    quick_new: "Issue a new document",
    stat_docs: "Documents issued",
    stat_customers: "Registered customers",
    stat_due: "Total due (USD)",
  }
};
let CURLANG = localStorage.getItem('icool_lang') || 'ar';
function t(key){ return (I18N[CURLANG] && I18N[CURLANG][key]) || key; }
function setLang(l){
  CURLANG = l;
  localStorage.setItem('icool_lang', l);
  document.body.className = 'lang-' + l;
  document.documentElement.setAttribute('lang', l);
  document.documentElement.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
  applyI18n();
}
function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  document.title = t('appName');
}
