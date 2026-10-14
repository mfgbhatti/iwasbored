/*
 * print-estimates.js
 * Prints ONLY the estimations (total bricks, step-by-step working, mortar estimate)
 * plus a short summary of the inputs. Inputs, tips and buttons are not printed.
 *
 * Usage: put this file next to brick-calculator.html and add, before </body>:
 *   <script src="print-estimates.js"></script>
 * It hooks the button with id="printBtn" and also works with Ctrl+P / Cmd+P.
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var val = function (id) { return $(id) ? $(id).value : ''; };
  var optText = function (id) {
    var el = $(id);
    return el && el.selectedOptions[0] ? el.selectedOptions[0].text : '';
  };

  /* ---------- Print-only styles (injected once) ---------- */
  function injectStyles() {
    if ($('print-estimates-style')) return;
    var css =
      '#print-sheet { display: none; }' +
      '@media print {' +
      '  @page { margin: 14mm; }' +
      '  body { background: #fff !important; }' +
      '  body > .wrap { display: none !important; }' +
      '  #print-sheet { display: block !important; color: #000; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; line-height: 1.45; }' +
      '  #print-sheet * { color: #000 !important; background: transparent !important; box-shadow: none !important; }' +
      '  #print-sheet h1 { font-size: 20pt; margin: 0 0 2pt; }' +
      '  #print-sheet h2 { font-size: 12pt; margin: 16pt 0 6pt; padding-bottom: 3pt; border-bottom: 1.5pt solid #000; }' +
      '  #print-sheet .ps-date { font-size: 9pt; color: #444 !important; margin-bottom: 10pt; }' +
      '  #print-sheet .ps-total { border: 2pt solid #000; padding: 10pt; text-align: center; margin: 8pt 0; }' +
      '  #print-sheet .ps-total .n { font-size: 28pt; font-weight: 700; line-height: 1.1; }' +
      '  #print-sheet .ps-total .s { font-size: 10pt; }' +
      '  #print-sheet table { width: 100%; border-collapse: collapse; font-size: 10pt; }' +
      '  #print-sheet th, #print-sheet td { padding: 4pt 0; border-bottom: 0.5pt solid #999 !important; text-align: left; vertical-align: top; }' +
      '  #print-sheet th { font-size: 8.5pt; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1.5pt solid #000 !important; }' +
      '  #print-sheet .v { text-align: right; white-space: nowrap; padding-left: 10pt; }' +
      '  #print-sheet td small { display: block; font-size: 8pt; color: #555 !important; font-weight: 400; }' +
      '  #print-sheet tr.total td { border-top: 1.5pt solid #000 !important; font-weight: 700; }' +
      '  #print-sheet .ps-inputs td:first-child { width: 38%; }' +
      '  #print-sheet table, #print-sheet tr { page-break-inside: avoid; }' +
      '}';
    var style = document.createElement('style');
    style.id = 'print-estimates-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ---------- Build the printable sheet from the current results ---------- */
  function buildSheet() {
    var sheet = $('print-sheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.id = 'print-sheet';
      document.body.appendChild(sheet);
    }

    var wu = val('wallUnit');
    var bu = val('bUnit');
    var cur = val('currency').trim();
    cur = cur ? cur + ' ' : '';

    // Inputs summary
    var rows = [
      ['Wall (L × H × T)', val('wl') + ' × ' + val('wh') + ' × ' + val('wt') + ' ' + wu],
      ['Brick size', val('bl') + ' × ' + val('bw') + ' × ' + val('bh') + ' ' + bu],
      ['Mortar joint', val('mortar') + ' ' + bu],
      ['Wastage', val('waste') + ' %'],
      ['Mortar mix (cement : sand)', optText('mix')],
      ['Brick price', cur + val('pBrick') + ' ' + optText('pBrickBasis')],
      ['Sand price', cur + val('pSand') + ' ' + optText('pSandBasis')],
      ['Cement price', cur + val('pCement') + ' per bag']
    ];
    var openingList = [];
    document.querySelectorAll('.opening').forEach(function (row) {
      var q = row.querySelector('.o-q').value;
      if (!parseFloat(q)) return;
      openingList.push(
        q + ' × ' + (row.querySelector('.o-name').value || 'Opening') + ' (' +
        row.querySelector('.o-w').value + ' × ' + row.querySelector('.o-h').value + ' ' + wu + ')'
      );
    });
    rows.splice(1, 0, ['Openings', openingList.length ? openingList.join(', ') : 'None']);

    var inputsHtml = '<table class="ps-inputs">' + rows.map(function (r) {
      return '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>';
    }).join('') + '</table>';

    var now = new Date();
    sheet.innerHTML =
      '<h1>Brick Estimate</h1>' +
      '<div class="ps-date">' + esc(now.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })) + '</div>' +
      '<div class="ps-total"><div class="s">Bricks to order (with wastage)</div>' +
        '<div class="n">' + esc($('finalBricks').textContent) + '</div>' +
        '<div class="s">' + esc($('baseBricks').textContent) + '</div>' +
        '<div class="s"><b>' + esc($('costLine').textContent) + '</b></div></div>' +
      '<h2>Inputs</h2>' + inputsHtml +
      '<h2>Step-by-step working</h2><table>' + $('working').innerHTML + '</table>' +
      '<h2>Mortar estimate</h2><table>' + $('mortarTable').innerHTML + '</table>' +
      '<h2>Cost estimate</h2><table>' + $('costTable').innerHTML + '</table>';
  }

  /* ---------- Hooks ---------- */
  injectStyles();

  // Build the sheet right before any print (button, Ctrl+P, browser menu)
  window.addEventListener('beforeprint', buildSheet);

  var btn = $('printBtn');
  if (btn) {
    btn.addEventListener('click', function () {
      buildSheet();
      window.print();
    });
  }

  // Expose for manual use: printEstimates()
  window.printEstimates = function () { buildSheet(); window.print(); };
})();
