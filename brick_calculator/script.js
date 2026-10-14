;(function () {
  const $ = (id) => document.getElementById(id)
  const TO_M = { m: 1, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254 }
  const num = (id) => Math.max(0, parseFloat($(id).value) || 0)
  const fmt = (n, d = 2) =>
    n.toLocaleString(undefined, { maximumFractionDigits: d })
  let lastSummary = ''

  /* ---------- Openings ---------- */
  function addOpening(name, w, h, q) {
    const div = document.createElement('div')
    div.className = 'opening'
    div.innerHTML =
      '<div><label>Label</label><input class="o-name" type="text" value="' +
      name +
      '"></div>' +
      '<div><label>Width</label><input class="o-w" type="number" min="0" step="any" value="' +
      w +
      '"></div>' +
      '<div><label>Height</label><input class="o-h" type="number" min="0" step="any" value="' +
      h +
      '"></div>' +
      '<div><label>Qty</label><input class="o-q" type="number" min="0" step="1" value="' +
      q +
      '"></div>' +
      '<button type="button" class="del" aria-label="Remove opening">✕</button>'
    div.querySelector('.del').addEventListener('click', () => {
      div.remove()
      calc()
    })
    div
      .querySelectorAll('input')
      .forEach((i) => i.addEventListener('input', calc))
    $('openings').appendChild(div)
  }

  /* ---------- Presets ---------- */
  function applyPreset() {
    const v = $('preset').value
    if (v === 'custom') return
    const [l, w, h, u] = v.split(',')
    $('bl').value = l
    $('bw').value = w
    $('bh').value = h
    $('bUnit').value = u
    $('mortar').value = u === 'mm' ? 10 : 0.5
  }
  function markCustom() {
    $('preset').value = 'custom'
  }

  function applyWallType() {
    const v = parseFloat($('wallType').value)
    if (!v) return
    const inches = v
    const unit = $('wallUnit').value
    $('wt').value = +((inches * 0.0254) / TO_M[unit]).toFixed(3)
  }

  /* ---------- Calculation ---------- */
  function calc() {
    const wu = TO_M[$('wallUnit').value]
    const bu = TO_M[$('bUnit').value]
    const unitName = $('wallUnit').value

    const L = num('wl') * wu,
      H = num('wh') * wu,
      T = num('wt') * wu
    const grossVol = L * H * T
    const grossArea = L * H

    let openVol = 0,
      openArea = 0
    document.querySelectorAll('.opening').forEach((row) => {
      const w = (parseFloat(row.querySelector('.o-w').value) || 0) * wu
      const h = (parseFloat(row.querySelector('.o-h').value) || 0) * wu
      const q = parseFloat(row.querySelector('.o-q').value) || 0
      openArea += w * h * q
      openVol += w * h * T * q
    })
    const netVol = Math.max(0, grossVol - openVol)
    const netArea = Math.max(0, grossArea - openArea)

    const bl = num('bl') * bu,
      bw = num('bw') * bu,
      bh = num('bh') * bu,
      mj = num('mortar') * bu
    const brickMortarVol = (bl + mj) * (bw + mj) * (bh + mj)
    const brickActualVol = bl * bw * bh

    const warn = $('warn')
    warn.style.display = 'none'
    if (openVol > grossVol && grossVol > 0) {
      warn.textContent = 'Openings are larger than the wall — check your sizes.'
      warn.style.display = 'block'
    }

    const base = brickMortarVol > 0 ? netVol / brickMortarVol : 0
    const baseCeil = Math.ceil(base - 1e-9)
    const wastePct = num('waste')
    const withWaste = Math.ceil(base * (1 + wastePct / 100) - 1e-9)

    $('finalBricks').textContent = fmt(withWaste, 0)
    $('baseBricks').textContent =
      fmt(baseCeil, 0) + ' bricks before ' + fmt(wastePct, 1) + '% wastage'
    $('altCount').textContent =
      netArea > 0 && withWaste > 0
        ? '≈ ' +
          fmt(withWaste / (netArea / (0.3048 * 0.3048)), 1) +
          ' bricks per sq ft of net wall'
        : ''

    // Working table
    // Column 1 is always feet; column 2 shows the unit chosen at the top (hidden if it is feet)
    const two = unitName !== 'ft'
    const FT3 = Math.pow(0.3048, 3),
      U3 = Math.pow(wu, 3)
    const uLabel = unitName + '³'
    const unitFull = $('wallUnit').selectedOptions[0].text.replace(
      /\s*\(.*\)/,
      '',
    )
    const fv = (n) => fmt(n, Math.abs(n) >= 1000 ? 0 : Math.abs(n) >= 1 ? 2 : 4)
    const m3 = (v) => fv(v / FT3) + ' ft³'
    const volCells = (v, sign) =>
      '<td class="v">' +
      (sign || '') +
      fv(v / FT3) +
      ' ft³</td>' +
      (two
        ? '<td class="v">' + (sign || '') + fv(v / U3) + ' ' + uLabel + '</td>'
        : '')
    const cntCell = (t) =>
      '<td class="v"' + (two ? ' colspan="2"' : '') + '>' + t + '</td>'
    const label = (name, note) =>
      '<td>' + name + (note ? '<small>' + note + '</small>' : '') + '</td>'
    const head =
      '<tr><th>Step</th><th class="v">Feet</th>' +
      (two ? '<th class="v">' + unitFull + '</th>' : '') +
      '</tr>'

    let html = head
    html +=
      '<tr>' +
      label(
        'Gross wall volume',
        'L × H × T = ' +
          fmt(num('wl')) +
          ' × ' +
          fmt(num('wh')) +
          ' × ' +
          fmt(num('wt')) +
          ' ' +
          unitName,
      ) +
      volCells(grossVol) +
      '</tr>'
    html +=
      '<tr>' +
      label('Openings volume', 'Σ width × height × thickness × qty') +
      volCells(openVol, '− ') +
      '</tr>'
    html += '<tr>' + label('Net wall volume') + volCells(netVol) + '</tr>'
    html +=
      '<tr>' +
      label('1 brick with mortar', '(L+m) × (W+m) × (H+m)') +
      volCells(brickMortarVol) +
      '</tr>'
    html +=
      '<tr>' +
      label('Bricks before wastage', 'Net volume ÷ brick volume') +
      cntCell(fmt(baseCeil, 0)) +
      '</tr>'
    html +=
      '<tr>' +
      label('Wastage', fmt(wastePct, 1) + '%') +
      cntCell('+ ' + fmt(withWaste - baseCeil, 0)) +
      '</tr>'
    html +=
      '<tr class="total">' +
      label('Total bricks to order') +
      cntCell(fmt(withWaste, 0)) +
      '</tr>'
    $('working').innerHTML = html

    // Rule of thumb
    const netAreaSqft = netArea / (0.3048 * 0.3048)
    const tIn = T / 0.0254
    let thumb
    if (Math.abs(tIn - 4.5) <= 0.5) {
      thumb =
        '4.5 in wall: about <b>' +
        fmt(netAreaSqft * 4.5, 0) +
        '–' +
        fmt(netAreaSqft * 5, 0) +
        '</b> bricks for ' +
        fmt(netAreaSqft, 1) +
        ' sq ft (4.5–5 per sq ft).'
    } else if (Math.abs(tIn - 9) <= 1) {
      thumb =
        '9 in wall: about <b>' +
        fmt(netAreaSqft * 9, 0) +
        '–' +
        fmt(netAreaSqft * 10, 0) +
        '</b> bricks for ' +
        fmt(netAreaSqft, 1) +
        ' sq ft (9–10 per sq ft).'
    } else {
      thumb =
        'Rules of thumb apply to 4.5 in (4.5–5 bricks/sq ft) and 9 in (9–10 bricks/sq ft) walls. Your wall is ' +
        fmt(tIn, 1) +
        ' in thick, so use the volume result above.'
    }
    $('thumb').innerHTML = thumb

    // Mortar
    const [c, , tot] = $('mix').value.split(',').map(Number)
    const solidBrickVol = base * brickActualVol
    const wetMortar = Math.max(0, netVol - solidBrickVol)
    const dry = wetMortar * (parseFloat($('dry').value) || 1.27)
    const cementM3 = dry / tot
    const sandM3 = (dry * c) / tot
    const cementBags = (cementM3 * 1440) / 50 // 1440 kg/m³, 50 kg bag
    let mhtml = head
    mhtml += '<tr>' + label('Wet mortar volume') + volCells(wetMortar) + '</tr>'
    mhtml +=
      '<tr>' + label('Dry volume', '× dry factor') + volCells(dry) + '</tr>'
    mhtml += '<tr>' + label('Cement volume') + volCells(cementM3) + '</tr>'
    mhtml += '<tr>' + label('Sand volume') + volCells(sandM3) + '</tr>'
    mhtml +=
      '<tr class="total">' +
      label('Cement bags', '50 kg bags') +
      cntCell(fmt(Math.ceil(cementBags), 0)) +
      '</tr>'
    $('mortarTable').innerHTML = mhtml

    // Cost
    const cur = $('currency').value.trim()
    const money = (n) => (cur ? cur + ' ' : '') + fmt(Math.round(n), 0)
    const rate = (n) => (cur ? cur + ' ' : '') + fmt(n, 2)
    const brickBasis = $('pBrickBasis').value
    const sandBasis = $('pSandBasis').value
    const brickRate = num('pBrick')
    const sandRate = num('pSand')
    const cementRate = num('pCement')
    const sandFt3 = sandM3 / FT3
    const bagsCeil = Math.ceil(cementBags)
    const brickCost =
      withWaste * (brickBasis === '1000' ? brickRate / 1000 : brickRate)
    const sandCost =
      sandBasis === 'm3'
        ? sandM3 * sandRate
        : sandBasis === '100ft3'
          ? (sandFt3 / 100) * sandRate
          : sandFt3 * sandRate
    const cementCost = bagsCeil * cementRate
    const totalCost = brickCost + sandCost + cementCost
    const sandUnit = { ft3: 'ft³', '100ft3': '100 ft³', m3: 'm³' }[sandBasis]
    const costRow = (name, note, qty, amt) =>
      '<tr>' +
      label(name, note) +
      '<td class="v">' +
      qty +
      '</td><td class="v">' +
      money(amt) +
      '</td></tr>'
    let chtml =
      '<tr><th>Item</th><th class="v">Qty</th><th class="v">Amount</th></tr>'
    chtml += costRow(
      'Bricks',
      rate(brickRate) + (brickBasis === '1000' ? ' / 1000 bricks' : ' / brick'),
      fmt(withWaste, 0),
      brickCost,
    )
    chtml += costRow(
      'Sand',
      rate(sandRate) + ' / ' + sandUnit,
      fv(sandFt3) + ' ft³' + (sandBasis === 'm3' ? ' (' + fv(sandM3) + ' m³)' : ''),
      sandCost,
    )
    chtml += costRow(
      'Cement',
      rate(cementRate) + ' / bag',
      fmt(bagsCeil, 0) + ' bags',
      cementCost,
    )
    chtml +=
      '<tr class="total">' +
      label('Total estimated cost') +
      '<td class="v" colspan="2">' +
      money(totalCost) +
      '</td></tr>'
    $('costTable').innerHTML = chtml
    $('costLine').textContent =
      totalCost > 0 ? 'Estimated material cost: ' + money(totalCost) : ''
    const costSummary =
      totalCost > 0
        ? '\nBricks: ' +
          money(brickCost) +
          '\nSand: ' +
          money(sandCost) +
          '\nCement: ' +
          money(cementCost) +
          '\nTotal cost: ' +
          money(totalCost)
        : ''

    lastSummary =
      'Brick estimate\n' +
      'Wall: ' +
      fmt(num('wl')) +
      ' × ' +
      fmt(num('wh')) +
      ' × ' +
      fmt(num('wt')) +
      ' ' +
      unitName +
      '\n' +
      'Net wall volume: ' +
      m3(netVol) +
      '\n' +
      'Bricks (no wastage): ' +
      fmt(baseCeil, 0) +
      '\n' +
      'Bricks (+' +
      fmt(wastePct, 1) +
      '% wastage): ' +
      fmt(withWaste, 0) +
      costSummary
  }

  /* ---------- Events ---------- */
  $('addOpening').addEventListener('click', () => {
    addOpening('Window', 4, 4, 1)
    calc()
  })
  $('preset').addEventListener('change', () => {
    applyPreset()
    calc()
  })
  ;['bl', 'bw', 'bh', 'bUnit'].forEach((id) =>
    $(id).addEventListener('input', markCustom),
  )
  $('wallType').addEventListener('change', () => {
    applyWallType()
    calc()
  })
  $('wallUnit').addEventListener('change', () => {
    $('wallType').value = ''
    calc()
  })
  $('wt').addEventListener('input', () => {
    $('wallType').value = ''
  })
  document.querySelectorAll('input, select').forEach((el) => {
    el.addEventListener('input', calc)
    el.addEventListener('change', calc)
  })
  $('copyBtn').addEventListener('click', () => {
    const done = () => {
      $('copyBtn').textContent = 'Copied ✓'
      setTimeout(() => ($('copyBtn').textContent = 'Copy summary'), 1500)
    }
    if (navigator.clipboard)
      navigator.clipboard.writeText(lastSummary).then(done, done)
    else done()
  })

  /* ---------- Remember prices in this browser ---------- */
  const PRICE_IDS = [
    'pBrick',
    'pBrickBasis',
    'pSand',
    'pSandBasis',
    'pCement',
    'currency',
  ]
  const savePrices = () => {
    try {
      const data = {}
      PRICE_IDS.forEach((id) => (data[id] = $(id).value))
      localStorage.setItem('brickCalcPrices', JSON.stringify(data))
    } catch (e) {}
  }
  try {
    const saved = JSON.parse(localStorage.getItem('brickCalcPrices') || '{}')
    PRICE_IDS.forEach((id) => {
      if (saved[id] != null) $(id).value = saved[id]
    })
  } catch (e) {}
  PRICE_IDS.forEach((id) => {
    $(id).addEventListener('input', savePrices)
    $(id).addEventListener('change', savePrices)
  })

  addOpening('Door', 3, 7, 1)
  addOpening('Window', 4, 4, 2)
  calc()
})()
