(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var cv = $('card');

  /* ---------- Data ---------- */

  var FONTS = [
    { id: 'playfair', name: 'Playfair Display', tag: 'Elegant serif', css: '"Playfair Display"', fb: 'Georgia, serif', weight: 400, style: 'italic', lh: 1.28, scale: 1, upper: false, ls: 0, ui: 20 },
    { id: 'story', name: 'Story Script', tag: 'Storybook script', css: '"Story Script"', fb: 'cursive', weight: 400, style: 'normal', lh: 1.3, scale: 0.95, upper: false, ls: 0, ui: 18 },
    { id: 'fleur', name: 'Fleur De Leah', tag: 'Flourished script', css: '"Fleur De Leah"', fb: 'cursive', weight: 400, style: 'normal', lh: 1.45, scale: 1.18, upper: false, ls: 0, ui: 22 },
    { id: 'pacifico', name: 'Pacifico', tag: 'Casual script', css: '"Pacifico"', fb: 'cursive', weight: 400, style: 'normal', lh: 1.5, scale: 0.8, upper: false, ls: 0, ui: 18 },
    { id: 'parisienne', name: 'Parisienne', tag: 'Elegant script', css: '"Parisienne"', fb: 'cursive', weight: 400, style: 'normal', lh: 1.45, scale: 1.2, upper: false, ls: 0, ui: 24 },
    { id: 'bebas', name: 'Bebas Neue', tag: 'Tall caps', css: '"Bebas Neue"', fb: 'Impact, sans-serif', weight: 400, style: 'normal', lh: 1.06, scale: 1.25, upper: true, ls: 0.04, ui: 22 },
    { id: 'lora', name: 'Lora', tag: 'Literary serif', css: '"Lora"', fb: 'Georgia, serif', weight: 400, style: 'normal', lh: 1.4, scale: 0.98, upper: false, ls: 0, ui: 19 },
    { id: 'dynalight', name: 'Dynalight', tag: 'Brush script', css: '"Dynalight"', fb: 'cursive', weight: 400, style: 'normal', lh: 1.3, scale: 1.3, upper: false, ls: 0, ui: 24 }
  ];

  var SIZES = [
    { id: 'sq', name: 'Square', w: 1080, h: 1080 },
    { id: 'pt', name: 'Portrait 4:5', w: 1080, h: 1350 },
    { id: 'ls', name: 'Landscape 16:9', w: 1920, h: 1080 },
    { id: 'st', name: 'Story 9:16', w: 1080, h: 1920 },
    { id: 'ln', name: 'Link preview', w: 1200, h: 630 }
  ];

  var PRESETS = [
    { name: 'Deep Sea', a: '#0a3d4a', b: '#2a7f7a', card: '#eef0e6', text: '#0b2a31' },
    { name: 'Saffron', a: '#f4b942', b: '#e2572b', card: '#fff6e8', text: '#2b1710' },
    { name: 'Chalk', a: '#e4e6e8', b: '#b9bfc6', card: '#ffffff', text: '#16191c' },
    { name: 'Midnight', a: '#0e1020', b: '#2b3263', card: '#161a30', text: '#f1ede2' },
    { name: 'Rose Clay', a: '#b85c5c', b: '#f0c3b0', card: '#fff3ec', text: '#47201f' },
    { name: 'Moss', a: '#34493a', b: '#9db38a', card: '#f4f3e7', text: '#223024' },
    { name: 'Newsprint', a: '#1a1a1a', b: '#1a1a1a', card: '#efece4', text: '#1a1a1a' },
    { name: 'Citrus', a: '#d7f171', b: '#7fc46c', card: '#10210f', text: '#eaf7c8' },
    { name: 'Lavender Dusk', a: '#4b3b7a', b: '#c9a7e8', card: '#f6f0fb', text: '#2c1f4a' },
    { name: 'Ocean Breeze', a: '#1c6fb5', b: '#8fd3f4', card: '#f1f9ff', text: '#0c2d48' },
    { name: 'Ember', a: '#7a1f3d', b: '#ff8a5c', card: '#fff1e8', text: '#3b0f20' },
    { name: 'Sandstone', a: '#c9a66b', b: '#8a6a3b', card: '#fbf5e6', text: '#3a2a12' },
    { name: 'Graphite Mint', a: '#2b2f36', b: '#3fb7a0', card: '#1b1f24', text: '#e6fff9' },
    { name: 'Cotton Candy', a: '#ff9ec7', b: '#9ad0ff', card: '#ffffff', text: '#3a2240' }
  ];

  var S = {
    quote: 'Nothing great was ever achieved without enthusiasm.',
    author: 'Ralph Waldo Emerson',
    font: 'playfair',
    size: 'sq',
    bgA: PRESETS[0].a, bgB: PRESETS[0].b, card: PRESETS[0].card, text: PRESETS[0].text,
    opacity: 100, radius: 36, margin: 7,
    fontSize: 72, auto: true, align: 'center', mark: true, frame: true
  };

  /* ---------- Helpers ---------- */

  function fontOf(id) { return FONTS.filter(function (f) { return f.id === id; })[0]; }
  function sizeOf(id) { return SIZES.filter(function (z) { return z.id === id; })[0]; }
  function fontStr(f, px) { return f.style + ' ' + f.weight + ' ' + Math.round(px) + 'px ' + f.css + ', ' + f.fb; }
  function authorFont(px) { return '600 ' + Math.round(px) + 'px "Instrument Sans", system-ui, sans-serif'; }
  function setLS(c, px) { if ('letterSpacing' in c) c.letterSpacing = px + 'px'; }

  /* Rounded-rectangle path; rp adds to the current path, rr starts a new one. */
  function rp(c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); rp(c, x, y, w, h, r); }

  /* Greedy word wrap, then a second pass that narrows the width as far as the
     line count allows, so the last line is not a single orphaned word. */
  function wrap(c, text, maxW) {
    var out = [];
    text.split('\n').forEach(function (para) {
      var words = para.split(/\s+/).filter(Boolean);
      if (!words.length) { out.push(''); return; }
      var line = '';
      words.forEach(function (w) {
        var t = line ? line + ' ' + w : w;
        if (!line || c.measureText(t).width <= maxW) { line = t; }
        else { out.push(line); line = w; }
      });
      out.push(line);
    });
    return out;
  }
  function wrapBalanced(c, text, maxW) {
    var lines = wrap(c, text, maxW);
    if (lines.length < 2) return lines;
    var lo = maxW * 0.55, hi = maxW;
    for (var i = 0; i < 10; i++) {
      var mid = (lo + hi) / 2;
      if (wrap(c, text, mid).length <= lines.length) hi = mid; else lo = mid;
    }
    return wrap(c, text, hi);
  }

  /* ---------- Card drawing ---------- */

  function draw() {
    var f = fontOf(S.font), z = sizeOf(S.size);
    var W = z.w, H = z.h, u = Math.min(W, H) / 1080;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    var c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);

    // Background
    var g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, S.bgA); g.addColorStop(1, S.bgB);
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    // Card box
    var m = Math.round(Math.min(W, H) * S.margin / 100);
    var cx = m, cy = m, cw = W - 2 * m, ch = H - 2 * m;
    var r = Math.min(S.radius * u, cw / 2, ch / 2);

    // Shadow drawn only outside the card, so a translucent card stays clean
    if (m > 0 && S.opacity > 0) {
      c.save();
      c.beginPath(); c.rect(0, 0, W, H); rp(c, cx, cy, cw, ch, r); c.clip('evenodd');
      c.shadowColor = 'rgba(0,0,0,0.30)'; c.shadowBlur = 70 * u; c.shadowOffsetY = 24 * u;
      c.fillStyle = '#000'; rr(c, cx, cy, cw, ch, r); c.fill();
      c.restore();
    }
    c.globalAlpha = S.opacity / 100;
    c.fillStyle = S.card; rr(c, cx, cy, cw, ch, r); c.fill();
    c.globalAlpha = 1;

    // Text metrics
    var pad = Math.round(Math.min(cw, ch) * 0.1);
    var availW = cw - 2 * pad, availH = ch - 2 * pad;
    var raw = S.quote.trim() || 'Your quote goes here.';
    var text = f.upper ? raw.toUpperCase() : raw;
    var author = S.author.trim();
    var aSize = Math.max(16, Math.round(Math.min(W, H) * 0.028));
    var gapA = aSize * 1.1, divH = Math.max(2, 3 * u), gapB = aSize * 0.9;
    var authorH = author ? gapA + divH + gapB + aSize : 0;
    var center = S.align === 'center';
    var ax = center ? cx + cw / 2 : cx + pad;

    function layout(fs) {
      c.font = fontStr(f, fs); setLS(c, f.ls * fs);
      var lines = wrapBalanced(c, text, availW);
      var maxW = 0;
      lines.forEach(function (l) { maxW = Math.max(maxW, c.measureText(l).width); });
      var lh = fs * f.lh;
      var markSize = S.mark ? fs * 2.2 : 0;
      var markH = S.mark ? markSize * 0.34 + fs * 0.3 : 0;
      return { fs: fs, lines: lines, maxW: maxW, lh: lh, markSize: markSize, markH: markH, h: markH + lines.length * lh + authorH };
    }

    // Auto-fit: largest size whose block fits inside the card
    var L;
    if (S.auto) {
      var lo = 16, hi = Math.round(Math.min(W, H) * 0.15 * f.scale), best = lo;
      while (lo <= hi) {
        var mid = (lo + hi) >> 1, t = layout(mid);
        if (t.h <= availH && t.maxW <= availW + 1) { best = mid; lo = mid + 1; } else { hi = mid - 1; }
      }
      L = layout(best);
    } else {
      L = layout(Math.round(S.fontSize * f.scale * u));
    }

    // Frame line
    if (S.frame) {
      var ins = Math.round(pad * 0.42);
      c.save();
      c.globalAlpha = 0.22; c.strokeStyle = S.text; c.lineWidth = Math.max(1.5, 2.5 * u);
      rr(c, cx + ins, cy + ins, cw - 2 * ins, ch - 2 * ins, Math.max(0, r - ins));
      c.stroke();
      c.restore();
    }

    var y = cy + (ch - L.h) / 2;
    c.textAlign = center ? 'center' : 'left';

    // Opening quote mark
    if (S.mark) {
      c.save();
      c.globalAlpha = 0.3; c.fillStyle = S.text; setLS(c, 0);
      c.font = fontStr(f, L.markSize); c.textBaseline = 'alphabetic';
      c.fillText('“', ax, y + L.markSize * 0.75);
      c.restore();
    }

    // Quote lines
    c.fillStyle = S.text; c.textBaseline = 'middle';
    c.font = fontStr(f, L.fs); setLS(c, f.ls * L.fs);
    var ty = y + L.markH;
    L.lines.forEach(function (l, i) { c.fillText(l, ax, ty + i * L.lh + L.lh / 2); });
    setLS(c, 0);

    // Divider and attribution
    if (author) {
      var dy = ty + L.lines.length * L.lh + gapA;
      var dw = Math.round(72 * u);
      c.save();
      c.globalAlpha = 0.5; c.fillStyle = S.text;
      c.fillRect(center ? ax - dw / 2 : ax, dy, dw, divH);
      c.restore();
      var as = aSize, au = author.toUpperCase();
      c.font = authorFont(as); setLS(c, as * 0.14);
      while (as > 12 && c.measureText(au).width > availW) { as -= 1; c.font = authorFont(as); setLS(c, as * 0.14); }
      c.globalAlpha = 0.85; c.fillStyle = S.text;
      c.fillText(au, ax, dy + divH + gapB + aSize / 2);
      c.globalAlpha = 1; setLS(c, 0);
    }

    // Readouts
    $('dims').textContent = W + ' × ' + H + ' px · PNG';
    cv.setAttribute('aria-label', 'Quote card: ' + raw + (author ? ', ' + author : ''));
    var fits = L.h <= availH && L.maxW <= availW + 1;
    $('fitnote').hidden = S.auto || fits;
    $('o-fsize').textContent = S.auto ? 'Auto · ' + Math.round(L.fs / (f.scale * u)) + ' px' : S.fontSize + ' px';
  }

  /* ---------- Font loading ---------- */

  // Wait for a face before drawing with it, and redraw when late faces arrive.
  var loaded = {};
  var token = 0;
  function ensureFonts(f) {
    if (loaded[f.id]) return Promise.resolve();
    var jobs = [
      document.fonts.load(fontStr(f, 48), 'Aa“”—Éñ'),
      document.fonts.load(authorFont(24), 'Aa')
    ];
    return Promise.race([
      Promise.all(jobs.map(function (p) { return p.catch(function () {}); })),
      new Promise(function (res) { setTimeout(res, 3500); })
    ]).then(function () { loaded[f.id] = true; });
  }
  function render() {
    var my = ++token;
    ensureFonts(fontOf(S.font)).then(function () { if (my === token) draw(); });
  }
  var raf = 0;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(render); }

  /* ---------- Controls ---------- */

  var fontsEl = $('fonts'), sizesEl = $('sizes'), presetsEl = $('presets');

  FONTS.forEach(function (f) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'font'; b.dataset.id = f.id;
    var n = document.createElement('span');
    n.className = 'fname'; n.textContent = f.name;
    n.style.fontFamily = f.css + ', ' + f.fb;
    n.style.fontStyle = f.style; n.style.fontWeight = f.weight; n.style.fontSize = f.ui + 'px';
    var t = document.createElement('span');
    t.className = 'tag'; t.textContent = f.tag;
    b.appendChild(n); b.appendChild(t);
    b.addEventListener('click', function () { S.font = f.id; syncUI(); schedule(); });
    fontsEl.appendChild(b);
  });

  SIZES.forEach(function (z) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'size'; b.dataset.id = z.id;
    var k = 20 / Math.max(z.w, z.h);
    var ratio = document.createElement('span');
    ratio.className = 'ratio';
    ratio.style.width = Math.round(z.w * k) + 'px'; ratio.style.height = Math.round(z.h * k) + 'px';
    var txt = document.createElement('span');
    txt.textContent = z.name;
    var small = document.createElement('small');
    small.textContent = z.w + ' × ' + z.h;
    txt.appendChild(small);
    b.appendChild(ratio); b.appendChild(txt);
    b.addEventListener('click', function () { S.size = z.id; syncUI(); schedule(); });
    sizesEl.appendChild(b);
  });

  PRESETS.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'preset'; b.dataset.i = i;
    b.title = p.name; b.setAttribute('aria-label', p.name);
    b.style.background = 'linear-gradient(135deg,' + p.a + ',' + p.b + ')';
    var chip = document.createElement('i');
    chip.style.background = p.card;
    b.appendChild(chip);
    b.addEventListener('click', function () {
      S.bgA = p.a; S.bgB = p.b; S.card = p.card; S.text = p.text;
      syncUI(); schedule();
    });
    presetsEl.appendChild(b);
  });

  function syncOutputs() {
    $('o-opacity').textContent = S.opacity + '%';
    $('o-radius').textContent = S.radius + ' px';
    $('o-margin').textContent = S.margin + '%';
    if (!S.auto) $('o-fsize').textContent = S.fontSize + ' px';
  }
  function syncPresets() {
    Array.prototype.forEach.call(presetsEl.children, function (b) {
      var p = PRESETS[+b.dataset.i];
      var on = p.a === S.bgA && p.b === S.bgB && p.card === S.card && p.text === S.text;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function syncUI() {
    Array.prototype.forEach.call(fontsEl.children, function (b) { b.setAttribute('aria-pressed', b.dataset.id === S.font ? 'true' : 'false'); });
    Array.prototype.forEach.call(sizesEl.children, function (b) { b.setAttribute('aria-pressed', b.dataset.id === S.size ? 'true' : 'false'); });
    Array.prototype.forEach.call(document.querySelectorAll('[data-align]'), function (b) { b.setAttribute('aria-pressed', b.dataset.align === S.align ? 'true' : 'false'); });
    $('quote').value = S.quote; $('author').value = S.author;
    $('cBgA').value = S.bgA; $('cBgB').value = S.bgB; $('cCard').value = S.card; $('cText').value = S.text;
    $('opacity').value = S.opacity; $('radius').value = S.radius; $('margin').value = S.margin;
    $('fsize').value = S.fontSize; $('fsize').disabled = S.auto;
    ['auto', 'mark', 'frame'].forEach(function (k) { $(k).setAttribute('aria-pressed', S[k] ? 'true' : 'false'); });
    syncPresets(); syncOutputs();
  }

  function on(id, fn) {
    $(id).addEventListener('input', function (e) { fn(e.target); syncPresets(); syncOutputs(); schedule(); });
  }
  on('quote', function (t) { S.quote = t.value; });
  on('author', function (t) { S.author = t.value; });
  on('cBgA', function (t) { S.bgA = t.value; });
  on('cBgB', function (t) { S.bgB = t.value; });
  on('cCard', function (t) { S.card = t.value; });
  on('cText', function (t) { S.text = t.value; });
  on('opacity', function (t) { S.opacity = +t.value; });
  on('radius', function (t) { S.radius = +t.value; });
  on('margin', function (t) { S.margin = +t.value; });
  on('fsize', function (t) { S.fontSize = +t.value; });
  ['auto', 'mark', 'frame'].forEach(function (k) {
    $(k).addEventListener('click', function () { S[k] = !S[k]; syncUI(); schedule(); });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-align]'), function (b) {
    b.addEventListener('click', function () { S.align = b.dataset.align; syncUI(); schedule(); });
  });

  /* ---------- Save and copy ---------- */

  var statusT = 0;
  function say(msg) {
    var s = $('status');
    s.textContent = msg;
    clearTimeout(statusT);
    statusT = setTimeout(function () { s.textContent = ''; }, 4500);
  }
  function blobOf() {
    return new Promise(function (res, rej) {
      cv.toBlob(function (b) { b ? res(b) : rej(new Error('encode failed')); }, 'image/png');
    });
  }

  // Inside Claude, saving goes through the `downloads` capability. Anywhere
  // else window.claude does not exist and a normal download link is used.
  var claudeDownloads = (function () {
    try {
      if (window.claude && window.claude.use) {
        return Promise.resolve(window.claude.use('downloads')).catch(function () { return null; });
      }
    } catch (e) { /* fall through */ }
    return Promise.resolve(null);
  })();

  function saveWithLink(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  $('dl').addEventListener('click', function () {
    claudeDownloads.then(function (d) {
      return ensureFonts(fontOf(S.font)).then(function () {
        draw();
        return blobOf();
      }).then(function (blob) {
        var z = sizeOf(S.size);
        var name = 'quote-card-' + z.w + 'x' + z.h + '.png';
        if (d) return d.save({ filename: name, data: blob }).then(function () { say('Saved.'); });
        saveWithLink(blob, name);
        say('Download started.');
      }).catch(function (e) {
        say(e && e.code === 'declined' ? 'Save cancelled.' : 'Could not save the image. Try again.');
      });
    });
  });

  $('copy').addEventListener('click', function () {
    blobOf().then(function (blob) {
      return navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    }).then(function () {
      say('Image copied.');
    }).catch(function () {
      say('Copying is not available here. Use Download PNG instead.');
    });
  });

  /* ---------- Start ---------- */

  // Draw once with fallback fonts, then again when the real faces are in.
  syncUI();
  draw();
  render();
  $('gf').addEventListener('load', function () { loaded = {}; schedule(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { loaded = {}; schedule(); });
  }
})();
