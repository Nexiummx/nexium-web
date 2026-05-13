import type { MotionApplyPayload } from "@/lib/motion-overrides/types";

/**
 * Script inyectado en el documento del flyer (preview iframe + Puppeteer).
 * Control de reproducción + catálogo motion + aplicación de overrides GSAP/CSS (fase 1).
 */
const IFRAME_BRIDGE_SOURCE = `(function(){
  var GSAP_NAMES = ['tl','videoTimeline','timeline','masterTl','mainTl','tl1','gsapTl','anim'];
  var gsapTl = null;

  function readMotionApply() {
    var m = window.__NEXIUM_MOTION_APPLY__;
    if (!m) return { gsap: [], css: [] };
    return { gsap: m.gsap || [], css: m.css || [] };
  }

  function findGsapTl() {
    for (var i = 0; i < GSAP_NAMES.length; i++) {
      var candidate = window[GSAP_NAMES[i]];
      if (candidate && typeof candidate.pause === 'function' && typeof candidate.seek === 'function') {
        return candidate;
      }
    }
    if (window.gsap && window.gsap.globalTimeline) return window.gsap.globalTimeline;
    return null;
  }

  function isGlobalGsapTimeline(tl) {
    return window.gsap && window.gsap.globalTimeline === tl;
  }

  function applyGsapTimeScaleFromMeta() {
    if (!gsapTl || isGlobalGsapTimeline(gsapTl)) return;
    var metaEl = document.querySelector('meta[name="nexium:duration"]');
    if (!metaEl) return;
    var metaSec = parseFloat(metaEl.getAttribute('content') || '0');
    if (!(metaSec > 0)) return;
    gsapTl.timeScale(1);
    var natural = gsapTl.duration();
    if (!(natural > 0)) return;
    gsapTl.timeScale(natural / metaSec);
  }

  function gsapPause() { gsapTl.pause(); }
  function gsapPlay() { gsapTl.play(); }
  function gsapRestart() { gsapTl.seek(0, false); gsapTl.play(); }
  function gsapSeek(sec) { gsapTl.seek(sec, false); }

  function cssAnims() { return document.getAnimations(); }
  function cssPause() { cssAnims().forEach(function(a){ a.pause(); }); }
  function cssPlay() { cssAnims().forEach(function(a){ a.play(); }); }
  function cssRestart() { cssAnims().forEach(function(a){ a.cancel(); a.play(); }); }
  function cssSeek(ms) { cssAnims().forEach(function(a){ a.currentTime = ms; }); }

  function dispatch(cmd, data) {
    if (gsapTl) {
      if (cmd === 'pause') gsapPause();
      if (cmd === 'play') gsapPlay();
      if (cmd === 'restart') gsapRestart();
      if (cmd === 'seek') gsapSeek(data.sec);
    } else {
      if (cmd === 'pause') cssPause();
      if (cmd === 'play') cssPlay();
      if (cmd === 'restart') cssRestart();
      if (cmd === 'seek') cssSeek(data.ms);
    }
  }

  window.addEventListener('message', function(e) {
    var cmd = e.data && e.data.nexiumCmd;
    if (!cmd) return;
    dispatch(cmd, e.data);
  });

  function rootStartOnTimeline(tw, rootTl) {
    if (!tw || !rootTl || typeof tw.startTime !== 'function') return 0;
    var acc = tw.startTime();
    var par = tw.parent;
    while (par && par !== rootTl) {
      if (typeof par.startTime === 'function') acc += par.startTime();
      par = par.parent;
    }
    return acc;
  }

  function parseCssTime(str) {
    if (str == null || str === '') return 0;
    var s = String(str).trim().toLowerCase();
    var m = s.match(/^([\\d.]+)(ms|s|m)?$/);
    if (!m) return 0;
    var n = parseFloat(m[1]);
    if (!isFinite(n)) return 0;
    var u = m[2] || 's';
    if (u === 'ms') return n * 0.001;
    if (u === 'm') return n * 60;
    return n;
  }

  function setCssRangesFromRows(cssRows) {
    window.__NX_CSS_RANGES__ = (cssRows || []).map(function(row) {
      var ds = parseCssTime(row.delay);
      var du = parseCssTime(row.duration);
      var eff = du > 1e-6 ? du : 1 / 60;
      return { id: row.id, startSec: ds, endSec: ds + eff };
    });
  }

  function activeGsapIdsAt(tSec) {
    var ids = [];
    var map = window.__NX_GSAP_MAP__;
    if (!map || !gsapTl || isGlobalGsapTimeline(gsapTl)) return ids;
    var keys = Object.keys(map);
    for (var i = 0; i < keys.length; i++) {
      var kid = keys[i];
      if (!/^g_[0-9]+$/.test(kid)) continue;
      var tw = map[kid];
      if (!tw || typeof tw.startTime !== 'function') continue;
      var st = rootStartOnTimeline(tw, gsapTl);
      var rawD = tw.duration ? tw.duration() : 0;
      var d = rawD > 1e-6 ? rawD : 1 / 60;
      var ed = st + d;
      if (tSec + 1e-9 >= st && tSec <= ed + 1e-5) ids.push(kid);
    }
    return ids;
  }

  function activeCssIdsAt(tSec) {
    var ids = [];
    var ranges = window.__NX_CSS_RANGES__;
    if (!ranges || !ranges.length) return ids;
    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      if (tSec + 1e-9 >= r.startSec && tSec <= r.endSec + 1e-5) ids.push(r.id);
    }
    return ids;
  }

  var ticker;
  function startTick() {
    clearInterval(ticker);
    ticker = setInterval(function() {
      var cur = 0, dur = 0;
      var playheadSec = 0;
      var activeGsapIds = [];
      var activeCssIds = [];
      if (gsapTl) {
        dur = (gsapTl.duration() || 0) * 1000;
        playheadSec =
          typeof gsapTl.totalTime === 'function'
            ? gsapTl.totalTime()
            : gsapTl.time
              ? gsapTl.time()
              : 0;
        cur = playheadSec * 1000;
        if (!isGlobalGsapTimeline(gsapTl)) {
          activeGsapIds = activeGsapIdsAt(playheadSec);
        }
        activeCssIds = activeCssIdsAt(playheadSec);
      } else {
        var anims = cssAnims();
        anims.forEach(function(a) {
          var d = a.effect ? a.effect.getTiming().duration : 0;
          if (typeof d === 'number' && d > dur) {
            dur = d;
            cur = typeof a.currentTime === 'number' ? a.currentTime : 0;
          }
        });
        playheadSec = cur / 1000;
        activeCssIds = activeCssIdsAt(playheadSec);
      }
      window.parent.postMessage({
        nexiumProgress: {
          cur: cur,
          dur: dur,
          playheadSec: playheadSec,
          activeGsapIds: activeGsapIds,
          activeCssIds: activeCssIds
        }
      }, '*');
    }, 100);
  }

  function easeToString(ease) {
    if (!ease) return '';
    if (typeof ease === 'string') return ease;
    if (ease._ease && ease._ease.name) return ease._ease.name;
    return 'custom';
  }

  function targetLabel(t) {
    if (t == null) return '';
    if (typeof t === 'string') return t;
    if (t.nodeType === 1) {
      if (t.id) return '#' + t.id;
      var cl = t.className && typeof t.className === 'string' ? t.className.trim().split(/\\s+/).slice(0, 2).join('.') : '';
      return (t.tagName ? t.tagName.toLowerCase() : 'el') + (cl ? '.' + cl : '');
    }
    if (Array.isArray(t)) return t.length ? targetLabel(t[0]) : '';
    return String(t);
  }

  function sceneIdForTween(tw) {
    var targets = tw.targets ? tw.targets() : [];
    var el = Array.isArray(targets) ? targets[0] : targets;
    if (!el || el.nodeType !== 1) return 'sin-escena';
    var n = el;
    while (n && n !== document.documentElement) {
      if (n.id && String(n.id).indexOf('scene-') === 0) return n.id;
      n = n.parentNode;
    }
    return 'sin-escena';
  }

  function buildGsapMap(tl) {
    window.__NX_GSAP_MAP__ = {};
    if (!tl || typeof tl.getChildren !== 'function') return [];
    var kids = tl.getChildren(true, true, true);
    var out = [];
    for (var i = 0; i < kids.length; i++) {
      var tw = kids[i];
      var id = 'g_' + i;
      window.__NX_GSAP_MAP__[id] = tw;
      var dur = tw.duration ? tw.duration() : 0;
      var del = tw.delay ? tw.delay() : 0;
      var easeStr = '';
      try { easeStr = tw.vars && tw.vars.ease ? easeToString(tw.vars.ease) : ''; } catch (e1) {}
      var targets = tw.targets ? tw.targets() : [];
      var lab = targets.length ? targetLabel(targets[0]) : '(sin target)';
      if (targets.length > 1) lab += ' +' + (targets.length - 1);
      var st = rootStartOnTimeline(tw, tl);
      var sc = sceneIdForTween(tw);
      var ed = st + (dur > 1e-6 ? dur : 1 / 60);
      out.push({
        id: id,
        label: lab,
        sceneId: sc,
        startSec: st,
        duration: dur,
        delay: del,
        ease: easeStr,
        endSec: ed
      });
    }
    return out;
  }

  function applyGsapPatchesFromWindow() {
    var patches = readMotionApply().gsap;
    if (!patches || !patches.length || !window.__NX_GSAP_MAP__) return;
    for (var i = 0; i < patches.length; i++) {
      var p = patches[i];
      var tw = window.__NX_GSAP_MAP__[p.id];
      if (!tw) continue;
      try {
        if (typeof p.duration === 'number' && tw.duration) tw.duration(p.duration);
        if (typeof p.delay === 'number' && tw.delay) tw.delay(p.delay);
        if (typeof p.ease === 'string' && p.ease && tw.vars) {
          tw.vars.ease = p.ease;
          if (tw.invalidate) tw.invalidate();
        }
      } catch (e2) {}
    }
  }

  function clearNxCssMarkers() {
    document.querySelectorAll('[data-nx-css]').forEach(function(el) {
      el.removeAttribute('data-nx-css');
    });
  }

  function collectCssCatalog() {
    clearNxCssMarkers();
    var out = [];
    var counter = 0;
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var st = window.getComputedStyle(el);
      var name = st.animationName;
      if (!name || name === 'none') continue;
      var firstName = name.split(',')[0].trim();
      var id = 'c_' + counter++;
      el.setAttribute('data-nx-css', id);
      var durStr = (st.animationDuration || '').split(',')[0].trim();
      var delStr = (st.animationDelay || '').split(',')[0].trim();
      var ds = parseCssTime(delStr);
      var du = parseCssTime(durStr);
      out.push({
        id: id,
        label: el.id ? '#' + el.id : el.tagName.toLowerCase(),
        animationName: firstName,
        duration: durStr,
        delay: delStr,
        startSec: ds,
        endSec: ds + du
      });
    }
    return out;
  }

  function injectCssPatchesFromWindow() {
    var old = document.getElementById('nexium-motion-css-overrides');
    if (old) old.remove();
    var patches = readMotionApply().css;
    if (!patches || !patches.length) return;
    var css = '';
    for (var i = 0; i < patches.length; i++) {
      var p = patches[i];
      var parts = [];
      if (p.animationDuration) parts.push('animation-duration: ' + p.animationDuration + ' !important');
      if (p.animationDelay) parts.push('animation-delay: ' + p.animationDelay + ' !important');
      if (parts.length) css += '[data-nx-css="' + p.id + '"]{' + parts.join(';') + '}\\n';
    }
    if (!css) return;
    var s = document.createElement('style');
    s.id = 'nexium-motion-css-overrides';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function snapshotCssCatalogFromDom() {
    var out = [];
    document.querySelectorAll('[data-nx-css]').forEach(function(el) {
      var id = el.getAttribute('data-nx-css');
      if (!id) return;
      var st = window.getComputedStyle(el);
      var name = (st.animationName || '').split(',')[0].trim();
      var durStr2 = (st.animationDuration || '').split(',')[0].trim();
      var delStr2 = (st.animationDelay || '').split(',')[0].trim();
      var ds2 = parseCssTime(delStr2);
      var du2 = parseCssTime(durStr2);
      out.push({
        id: id,
        label: el.id ? '#' + el.id : (el.tagName ? el.tagName.toLowerCase() : 'el'),
        animationName: name || '?',
        duration: durStr2,
        delay: delStr2,
        startSec: ds2,
        endSec: ds2 + du2
      });
    });
    return out;
  }

  function emitMotionCatalog(gsapRows, cssRows) {
    setCssRangesFromRows(cssRows);
    window.parent.postMessage({ nexiumMotionCatalog: { gsap: gsapRows || [], css: cssRows || [] } }, '*');
  }

  function readGsapRowsEffective() {
    var map = window.__NX_GSAP_MAP__;
    if (!map || !gsapTl) return [];
    var out = [];
    var keys = Object.keys(map);
    for (var ki = 0; ki < keys.length; ki++) {
      var k = keys[ki];
      if (!/^g_[0-9]+$/.test(k)) continue;
      var tw = map[k];
      if (!tw) continue;
      var dur = tw.duration ? tw.duration() : 0;
      var del = tw.delay ? tw.delay() : 0;
      var easeStr = '';
      try { easeStr = tw.vars && tw.vars.ease ? easeToString(tw.vars.ease) : ''; } catch (e3) {}
      var targets = tw.targets ? tw.targets() : [];
      var lab = targets.length ? targetLabel(targets[0]) : '(sin target)';
      if (targets.length > 1) lab += ' +' + (targets.length - 1);
      var st = rootStartOnTimeline(tw, gsapTl);
      var sc = sceneIdForTween(tw);
      var effDur = dur > 1e-6 ? dur : 1 / 60;
      var ed = st + effDur;
      out.push({
        id: k,
        label: lab,
        sceneId: sc,
        startSec: st,
        duration: dur,
        delay: del,
        ease: easeStr,
        endSec: ed
      });
    }
    out.sort(function(a, b) {
      var ia = parseInt(a.id.slice(2), 10);
      var ib = parseInt(b.id.slice(2), 10);
      return ia - ib;
    });
    return out;
  }

  function scheduleCatalogEmit(gsapBaseline) {
    setTimeout(function() {
      var cssSnap = snapshotCssCatalogFromDom();
      var gFinal = gsapTl && window.__NX_GSAP_MAP__ ? readGsapRowsEffective() : gsapBaseline;
      emitMotionCatalog(gFinal, cssSnap);
    }, 450);
  }

  function init() {
    gsapTl = findGsapTl();
    var gsapBaseline = [];
    if (gsapTl && !isGlobalGsapTimeline(gsapTl)) {
      gsapBaseline = buildGsapMap(gsapTl);
      applyGsapPatchesFromWindow();
      applyGsapTimeScaleFromMeta();
      if (gsapTl.paused && gsapTl.paused()) gsapTl.play();
    }
    collectCssCatalog();
    injectCssPatchesFromWindow();
    startTick();
    scheduleCatalogEmit(gsapBaseline);
    if (!gsapTl) {
      var attempts = [200, 500, 1000, 2000];
      attempts.forEach(function(delay) {
        setTimeout(function() {
          if (!gsapTl) {
            gsapTl = findGsapTl();
            if (gsapTl && !isGlobalGsapTimeline(gsapTl)) {
              gsapBaseline = buildGsapMap(gsapTl);
              applyGsapPatchesFromWindow();
              applyGsapTimeScaleFromMeta();
              if (gsapTl.paused && gsapTl.paused()) gsapTl.play();
              collectCssCatalog();
              injectCssPatchesFromWindow();
              scheduleCatalogEmit(gsapBaseline);
            }
          }
        }, delay);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }
})();`;

/**
 * Inserta payload de overrides + script bridge en el HTML del flyer.
 */
export function buildVideoIframeDocument(
  html: string,
  motion: MotionApplyPayload | null | undefined
): string {
  const payload: MotionApplyPayload = motion ?? { gsap: [], css: [] };
  const json = JSON.stringify(payload).replace(/</g, "\\u003c");
  const boot = `<script>window.__NEXIUM_MOTION_APPLY__=${json};<\/script>`;
  const bridge = `<script>\n${IFRAME_BRIDGE_SOURCE}\n<\/script>`;
  const injected = `${boot}\n${bridge}\n`;
  if (html.includes("</head>")) {
    return html.replace("</head>", `${injected}</head>`);
  }
  return `${injected}${html}`;
}
