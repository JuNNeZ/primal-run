/* FEATURES.langSplit: load only the saved language (and its fallback chain) instead of all 24 in lang.js.
   Runs while the page is parsed, so the files are in place before PrimalApp.mount(); a language picked later is
   fetched with PrimalI18n.load(). The ?v= release version of this script is passed on to the language files. */
(function (root) {
  'use strict';
  const I = root.PrimalI18n, C = root.PrimalCore, doc = root.document; if (!I || !C || !doc) return;
  const me = doc.currentScript, src = me ? me.getAttribute('src') : 'src/lang_boot.js', q = src.indexOf('?'), version = q < 0 ? '' : src.slice(q);
  const dir = src.replace(/lang_boot\.js.*$/, '');
  if (!C.FEATURES.langSplit) { doc.write('<script src="' + dir + 'lang.js' + version + '"><\/script>'); return; }
  I.urlFor = code => dir + 'lang/' + code + '.js' + version;
  let id = 'da'; try { const save = JSON.parse(root.localStorage.getItem(C.SAVE_KEY) || 'null'); id = (save && save.settings && save.settings.language) || 'da'; } catch (_) {}
  for (const code of I.chain(id)) doc.write('<script src="' + I.urlFor(code) + '"><\/script>');
})(globalThis);
