/* V47 — yatay ekran: kilit + "telefonu çevirin" kalkanı; ittifaklı renklerin yenilenmesi */
(function () {
  function lock() { try { var o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(function () { }); } catch (e) { } }
  lock();
  ['touchend', 'click'].forEach(function (ev) { document.addEventListener(ev, function f() { lock(); document.removeEventListener(ev, f, true); }, true); });
  // ittifak değişince 2B haritayı yeniden boya (renk imzası değişirse)
  var last = '';
  setInterval(function () { if (document.hidden) return; try { var s = WCD.sig(); if (s !== last) { last = s; if (typeof paint === 'function') paint(); } } catch (e) { } }, 1500);
})();
