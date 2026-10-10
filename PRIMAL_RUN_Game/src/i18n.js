/* PRIMAL RUN translations. Danish is the source language: every other language maps the
   exact Danish text (numbers replaced by #) to a translation. Text that is built from
   parts joined by " · " is translated part by part, so new combinations still work.
   Missing strings fall back to English (for the fun languages) and then Danish. */
(function (root) {
  'use strict';
  const LANGUAGES = [
    { id: 'da', name: 'Dansk' }, { id: 'en', name: 'English' }, { id: 'de', name: 'Deutsch' },
    { id: 'sv', name: 'Svenska' }, { id: 'no', name: 'Norsk' }, { id: 'ja', name: '日本語' }, { id: 'zh', name: '中文' },
    // The world's most spoken languages (tools/i18n/lang/<code>, STYLE_GUIDE.md); missing strings fall back to English.
    { id: 'es', name: 'Español', fallback: 'en' }, { id: 'fr', name: 'Français', fallback: 'en' }, { id: 'pt', name: 'Português (Brasil)', fallback: 'en' },
    { id: 'ru', name: 'Русский', fallback: 'en' }, { id: 'hi', name: 'हिन्दी', fallback: 'en' }, { id: 'ar', name: 'العربية', fallback: 'en', rtl: true },
    { id: 'bn', name: 'বাংলা', fallback: 'en' }, { id: 'ur', name: 'اردو', fallback: 'en', rtl: true }, { id: 'id', name: 'Bahasa Indonesia', fallback: 'en' },
    { id: 'pcm', name: 'Naijá (Pidgin)', fallback: 'en' }, { id: 'mr', name: 'मराठी', fallback: 'en' }, { id: 'te', name: 'తెలుగు', fallback: 'en' },
    { id: 'tr', name: 'Türkçe', fallback: 'en' }, { id: 'ta', name: 'தமிழ்', fallback: 'en' }, { id: 'yue', name: '粵語', fallback: 'zh' },
    // Fun languages: own name only; the UI adds "(for sjov)" in the current language.
    { id: 'tlh', name: 'tlhIngan Hol', fallback: 'en', fun: true }, { id: 'sjn', name: 'Edhellen (Sindarin)', fallback: 'en', fun: true }, { id: 'dino', name: 'Rawr-rawrrr', fallback: 'en', fun: true }
  ];
  const dictionaries = {};
  let lang = 'da';
  const cache = new Map(), missing = new Set();
  const upperIndex = {};
  function lookup(id, key) {
    for (let code = id; code; code = (LANGUAGES.find(l => l.id === code) || {}).fallback) {
      const d = dictionaries[code]; if (!d) continue;
      if (Object.prototype.hasOwnProperty.call(d, key)) return d[key];
      // Upper-case text (labels, toasts) reuses the normal-case entry.
      if (key === key.toUpperCase() && /[A-ZÆØÅ]/.test(key)) {
        if (!upperIndex[code]) { upperIndex[code] = {}; for (const [k, v] of Object.entries(d)) upperIndex[code][k.toUpperCase()] = v; }
        if (Object.prototype.hasOwnProperty.call(upperIndex[code], key)) return upperIndex[code][key].toUpperCase();
      }
    }
    return null;
  }
  // Numbers become # and key names (W, F, SPACE, SHIFT, ESC, WASD) become @ in dictionary keys.
  const KEY = /(?<![A-Za-zÆØÅæøå])(?:SPACE|SHIFT|ESC|WASD|[A-Z])(?![A-Za-zÆØÅæøå])/g;
  function withNumbers(text) {
    const numbers = [], keys = [];
    const key = text.replace(/(?<!\{)\d+(?:[.,]\d+)?(?!\})/g, n => { numbers.push(n); return '#'; }).replace(KEY, k => { keys.push(k); return '@'; });
    let hit = lookup(lang, key);
    if (hit === null && keys.length) { // retry without key placeholders
      const plain = text.replace(/\d+(?:[.,]\d+)?/g, '#'); hit = lookup(lang, plain); if (hit !== null) keys.length = 0;
    }
    if (hit === null) return null;
    let i = 0, j = 0; return hit.replace(/#/g, () => numbers[i++] ?? '#').replace(/@/g, () => keys[j++] ?? '@');
  }
  function translate(text) {
    if (lang === 'da' || typeof text !== 'string') return text;
    const trimmed = text.trim(); if (!trimmed || !/[A-Za-zÆØÅæøåÉé]/.test(trimmed.replace(KEY, ''))) return text;
    const k = lang + '\u0000' + trimmed; if (cache.has(k)) return pad(text, cache.get(k));
    let out = withNumbers(trimmed);
    if (out === null && trimmed.includes(' · ')) out = trimmed.split(' · ').map(part => translateCore(part)).join(' · ');
    if (out === null && trimmed.includes(' / ')) out = trimmed.split(' / ').map(part => translateCore(part)).join(' / ');
    if (out === null) { const m = trimmed.match(/^([^:]{2,40}):\s*(.+)$/); if (m) { const label = withNumbers(m[1] + ':'); if (label !== null) out = label + ' ' + translateCore(m[2]); } }
    if (out === null) { const m = trimmed.match(/^([^A-Za-zÆØÅæøå]+)(.+)$/); if (m) { const rest = withNumbers(m[2]); if (rest !== null) out = m[1] + rest; } }
    if (out === null) { const m = trimmed.match(/^(.*?)\s*·$/); if (m && m[1]) { const core = translate(m[1]); out = core + ' ·'; } }
    if (out === null && isTranslation(trimmed)) out = trimmed;
    if (out === null) { missing.add(trimmed.replace(/\d+(?:[.,]\d+)?/g, '#').replace(KEY, '@')); out = trimmed; }
    cache.set(k, out); return pad(text, out);
  }
  const valueSets = {};
  function isTranslation(text) {
    const d = dictionaries[lang]; if (!d) return false;
    if (!valueSets[lang]) valueSets[lang] = new Set(Object.values(d).map(v => v.replace(/#/g, '').trim()));
    return valueSets[lang].has(text.replace(/\d+(?:[.,]\d+)?/g, '').trim());
  }
  function translateCore(part) { const t = translate(part); return t; }
  function pad(original, result) { const lead = original.match(/^\s*/)[0], tail = original.match(/\s*$/)[0]; return lead + result.trim() + tail; }
  const ATTRIBUTES = ['title', 'aria-label', 'placeholder', 'alt'];
  function translateNode(node) {
    if (lang === 'da' || !node) return;
    const walker = node.ownerDocument.createTreeWalker(node, 4 /* text */);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) { if (n.parentNode && (/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName) || n.parentNode.closest && n.parentNode.closest('[translate="no"]'))) continue; const t = translate(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; }
    if (node.querySelectorAll) for (const el of [node, ...node.querySelectorAll('[title],[aria-label],[placeholder],[alt]')]) for (const a of ATTRIBUTES) { if (el.hasAttribute && el.hasAttribute(a)) { const v = el.getAttribute(a), t = translate(v); if (t !== v) el.setAttribute(a, t); } }
  }
  const api = {
    LANGUAGES,
    get lang() { return lang; },
    get rtl() { return !!(LANGUAGES.find(l => l.id === lang) || {}).rtl; },
    setLanguage(id) { lang = LANGUAGES.some(l => l.id === id) ? id : 'da'; cache.clear(); return lang; },
    add(id, entries) { dictionaries[id] = Object.assign(dictionaries[id] || {}, entries); delete upperIndex[id]; delete valueSets[id]; cache.clear(); },
    // Template with named parts: tf('Låser {0} op', name)
    tf(template, ...args) { return translate(template).replace(/\{(\d)\}/g, (_, i) => args[+i] ?? ''); },
    t: translate, translateNode, missing,
    coverage(id) { const d = dictionaries[id] || {}, en = dictionaries.en || {}; return { entries: Object.keys(d).length, english: Object.keys(en).length }; }
  };
  root.PrimalI18n = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
