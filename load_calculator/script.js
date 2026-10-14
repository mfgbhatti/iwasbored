;(function () {
  // How each appliance is wired into the board:
  //   dedicated: one circuit per unit, on the power RCD
  //   kitchen:   shared kitchen socket circuits, on the power RCD
  //   fridge:    shared refrigeration circuits (two units each), on the general RCD
  //   socket:    shared general socket circuits, on the general RCD
  //   light:     shared lighting and fan circuits, on the general RCD
  // n = name, w = default watts, k = kind, c = MCB curve, min = smallest MCB (A)
  var APPLIANCES = [
    { n: 'Air conditioner', w: 1800, k: 'dedicated', c: 'C', min: 20 },
    { n: 'Refrigerator', w: 350, k: 'fridge' },
    { n: 'Deep freezer', w: 200, k: 'fridge' },
    { n: 'Washing machine', w: 500, k: 'dedicated', c: 'C' },
    { n: 'Microwave oven', w: 1200, k: 'kitchen' },
    { n: 'Electric kettle', w: 1800, k: 'kitchen' },
    { n: 'Electric iron', w: 1000, k: 'socket' },
    { n: 'Water pump (submersible)', w: 1100, k: 'dedicated', c: 'C' },
    { n: 'Ceiling fan', w: 75, k: 'light' },
    { n: 'LED TV', w: 100, k: 'socket' },
    { n: 'LED bulb', w: 10, k: 'light' },
    { n: 'Tube light', w: 40, k: 'light' },
    { n: 'Desktop computer', w: 300, k: 'socket' },
    { n: 'Laptop charger', w: 65, k: 'socket' },
    { n: 'Room heater', w: 2000, k: 'dedicated' },
    { n: 'Water heater (geyser)', w: 3000, k: 'dedicated' },
    { n: 'Toaster', w: 800, k: 'kitchen' },
    { n: 'Hair dryer', w: 1800, k: 'socket' },
    { n: 'Electric oven', w: 2000, k: 'dedicated' },
    { n: 'Water dispenser', w: 500, k: 'fridge' },
    { n: 'Other appliance', w: 100, k: 'dedicated', c: 'C' },
  ]

  // group 1 = power RCD, group 2 = general RCD
  // limit = most load (A) one shared circuit carries, max = most units on it
  var KINDS = {
    dedicated: { group: 1, sort: 0 },
    kitchen: { group: 1, sort: 1, shared: true, label: 'Kitchen sockets', curve: 'B', inA: 16, limit: 12.8, max: 99 },
    fridge: { group: 2, sort: 2, shared: true, label: 'Refrigeration', curve: 'C', inA: 16, limit: 12.8, max: 2 },
    socket: { group: 2, sort: 3, shared: true, label: 'General sockets', curve: 'B', inA: 16, limit: 12.8, max: 99 },
    light: { group: 2, sort: 4, shared: true, label: 'Lighting & fans', curve: 'B', inA: 10, limit: 8, max: 10 },
  }

  var MCB_SIZES = [6, 10, 16, 20, 25, 32, 40, 50, 63, 80, 100]
  var MAIN_SIZES = [32, 40, 50, 63, 80, 100]
  var RCD_SIZES = [25, 40, 63, 80, 100]
  // [cable mm², largest MCB it may sit behind]. Copper, PVC, in conduit, kept below tabulated ratings.
  var CABLES = [[1.5, 10], [2.5, 16], [4, 25], [6, 32], [10, 50], [16, 63], [25, 80], [35, 100]]
  // single-row sizes in modules (18 mm each), then two and three row boards
  var ENCLOSURES = [
    { mods: 12, rows: [12] },
    { mods: 16, rows: [16] },
    { mods: 18, rows: [18] },
    { mods: 24, rows: [12, 12] },
    { mods: 36, rows: [18, 18] },
    { mods: 48, rows: [16, 16, 16] },
  ]

  var rowsEl = document.getElementById('rows')
  var voltsEl = document.getElementById('volts')
  var divEl = document.getElementById('diversity')
  var vmsg = document.getElementById('vmsg')
  var dmsg = document.getElementById('dmsg')
  var totW = document.getElementById('totW')
  var totKW = document.getElementById('totKW')
  var totA = document.getElementById('totA')
  var totD = document.getElementById('totD')
  var totDW = document.getElementById('totDW')
  var vShow = document.getElementById('vShow')
  var divShow = document.getElementById('divShow')
  var hint = document.getElementById('hint')
  var designEl = document.getElementById('design')
  var uid = 0

  function fmt(n) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 })
  }

  function optionsHTML(selected) {
    return APPLIANCES.map(function (a, i) {
      return (
        '<option value="' +
        i +
        '"' +
        (i === selected ? ' selected' : '') +
        '>' +
        a.n +
        '</option>'
      )
    }).join('')
  }

  function addRow(index, watts, qty, focus) {
    var id = ++uid
    var el = document.createElement('div')
    el.className = 'row'
    el.innerHTML =
      '<div class="cell name"><label for="a' +
      id +
      '">Appliance</label>' +
      '<select id="a' +
      id +
      '" data-f="app">' +
      optionsHTML(index) +
      '</select></div>' +
      '<div class="cell watts"><label for="w' +
      id +
      '">Watts each</label>' +
      '<input id="w' +
      id +
      '" data-f="watts" type="number" inputmode="decimal" min="0" step="any" value="' +
      watts +
      '"></div>' +
      '<div class="cell qty"><label for="q' +
      id +
      '">Qty</label>' +
      '<input id="q' +
      id +
      '" data-f="qty" type="number" inputmode="numeric" min="0" step="1" value="' +
      qty +
      '"></div>' +
      '<output class="sub" data-f="sub"></output>' +
      '<button type="button" class="rm" data-f="rm" aria-label="Remove appliance">×</button>'
    rowsEl.appendChild(el)
    if (focus) el.querySelector('select').focus()
  }

  // ---- board design -------------------------------------------------------

  function pickSize(list, need) {
    for (var i = 0; i < list.length; i++) {
      if (list[i] >= need - 1e-9) return list[i]
    }
    return null
  }

  function cableFor(inA) {
    for (var i = 0; i < CABLES.length; i++) {
      if (CABLES[i][1] >= inA) return CABLES[i][0]
    }
    return null
  }

  function readLoads() {
    var items = []
    rowsEl.querySelectorAll('.row').forEach(function (r) {
      var a = APPLIANCES[r.querySelector('[data-f="app"]').value]
      var w = Math.max(0, parseFloat(r.querySelector('[data-f="watts"]').value) || 0)
      var q = Math.max(0, Math.round(parseFloat(r.querySelector('[data-f="qty"]').value) || 0))
      if (w > 0 && q > 0) items.push({ a: a, w: w, q: q })
    })
    return items
  }

  // Spread units over the fewest shared circuits, balancing the load between them.
  function packShared(units, limit, max) {
    if (!units.length) return []
    units.sort(function (x, y) {
      return y.amps - x.amps
    })
    var total = units.reduce(function (s, u) {
      return s + u.amps
    }, 0)
    var n = Math.max(Math.ceil(total / limit - 1e-9), Math.ceil(units.length / max), 1)
    var bins = []
    for (var i = 0; i < n; i++) bins.push({ amps: 0, units: [] })
    units.forEach(function (u) {
      var best = null
      bins.forEach(function (b) {
        if (b.units.length < max && b.amps + u.amps <= limit + 1e-9 && (!best || b.amps < best.amps)) best = b
      })
      if (!best) {
        best = { amps: 0, units: [] }
        bins.push(best)
      }
      best.amps += u.amps
      best.units.push(u)
    })
    return bins.filter(function (b) {
      return b.units.length
    })
  }

  function summarize(units) {
    var order = []
    var counts = {}
    units.forEach(function (u) {
      if (!counts[u.name]) {
        counts[u.name] = 0
        order.push(u.name)
      }
      counts[u.name]++
    })
    return order
      .map(function (name) {
        return counts[name] > 1 ? name + ' ×' + counts[name] : name
      })
      .join(', ')
  }

  function buildCircuits(items, v) {
    var out = []
    var seq = 0
    var counts = {}
    var totals = {}
    var pool = { kitchen: [], fridge: [], socket: [], light: [] }
    items.forEach(function (it) {
      totals[it.a.n] = (totals[it.a.n] || 0) + it.q
    })
    items.forEach(function (it) {
      var a = it.a
      var kind = KINDS[a.k]
      var amps = it.w / v
      for (var n = 0; n < it.q; n++) {
        if (!kind.shared || amps > kind.limit) {
          // own circuit: 125% of the load, never below the appliance's minimum
          counts[a.n] = (counts[a.n] || 0) + 1
          var inA = pickSize(MCB_SIZES, Math.max(amps * 1.25, a.min || 16))
          out.push({
            group: kind.group,
            sort: kind.shared ? kind.sort - 0.5 : 0,
            seq: seq++,
            label: totals[a.n] > 1 ? a.n + ' ' + counts[a.n] : a.n,
            detail: '',
            amps: amps,
            inA: inA,
            curve: kind.shared ? kind.curve : a.c || 'B',
            cable: inA ? cableFor(inA) : null,
          })
        } else {
          pool[a.k].push({ name: a.n, amps: amps })
        }
      }
    })
    Object.keys(pool).forEach(function (k) {
      var kind = KINDS[k]
      var bins = packShared(pool[k], kind.limit, kind.max)
      bins.forEach(function (b, i) {
        out.push({
          group: kind.group,
          sort: kind.sort,
          seq: seq++,
          label: kind.label + (bins.length > 1 ? ' ' + (i + 1) : ''),
          detail: summarize(b.units),
          amps: b.amps,
          inA: kind.inA,
          curve: kind.curve,
          cable: cableFor(kind.inA),
        })
      })
    })
    out.sort(function (x, y) {
      return x.group - y.group || x.sort - y.sort || x.seq - y.seq
    })
    out.forEach(function (c, i) {
      c.id = 'C' + (i + 1)
    })
    return out
  }

  function layout(devices, enc) {
    var rows = enc.rows.map(function (len) {
      return { len: len, used: 0, items: [] }
    })
    var r = 0
    for (var i = 0; i < devices.length; i++) {
      var d = devices[i]
      while (r < rows.length && rows[r].used + d.m > rows[r].len) r++
      if (r >= rows.length) return null
      rows[r].items.push(d)
      rows[r].used += d.m
    }
    return rows
  }

  function design(items, v, frac) {
    var circuits = buildCircuits(items, v)
    var totalW = items.reduce(function (s, it) {
      return s + it.w * it.q
    }, 0)
    var res = { circuits: circuits, totalW: totalW, demand: (totalW / v) * frac }
    if (!circuits.length) {
      res.empty = true
      return res
    }
    var tooBig = circuits.some(function (c) {
      return !c.inA
    })
    var largest = Math.max.apply(
      null,
      circuits.map(function (c) {
        return c.inA || 0
      }),
    )
    var mainIn = tooBig ? null : pickSize(MAIN_SIZES, Math.max(res.demand * 1.25, largest))
    if (!mainIn) {
      res.over = true
      return res
    }
    res.mainIn = mainIn
    res.incomerCable = cableFor(mainIn)
    res.rcdIn = pickSize(RCD_SIZES, mainIn)

    res.names = {}
    var idx = 0
    ;[1, 2].forEach(function (g) {
      if (
        circuits.some(function (c) {
          return c.group === g
        })
      ) {
        idx += 1
        res.names[g] = 'RCD ' + idx
      }
    })

    var devices = [
      { t: 'main', top: 'DP', bot: mainIn + 'A', m: 2 },
      { t: 'spd', top: 'SPD', bot: 'T2', m: 2 },
    ]
    ;[1, 2].forEach(function (g) {
      var list = circuits.filter(function (c) {
        return c.group === g
      })
      if (!list.length) return
      devices.push({ t: 'rcd' + g, top: res.names[g], bot: res.rcdIn + 'A', m: 2 })
      list.forEach(function (c) {
        devices.push({ t: 'mcb' + g, top: c.id, bot: c.inA + 'A', m: 1 })
      })
    })
    res.used = devices.reduce(function (s, d) {
      return s + d.m
    }, 0)

    var need = res.used + Math.max(2, Math.ceil(circuits.length * 0.2))
    for (var i = 0; i < ENCLOSURES.length; i++) {
      if (ENCLOSURES[i].mods < need) continue
      var rows = layout(devices, ENCLOSURES[i])
      if (rows) {
        res.enc = ENCLOSURES[i]
        res.rows = rows
        res.free = ENCLOSURES[i].mods - res.used
        break
      }
    }
    return res
  }

  function tr(cells) {
    return '<tr>' + cells.join('') + '</tr>'
  }

  function renderDesign(res, v, pct) {
    var head = '<h2>Distribution board</h2>'
    if (res.empty) {
      designEl.innerHTML = head + '<p class="note">Add an appliance with some watts to see the board design.</p>'
      return
    }
    if (res.over) {
      designEl.innerHTML =
        head +
        '<p class="warn"><strong>Too large for one single-phase board.</strong> Max demand is ' +
        res.demand.toFixed(1) +
        ' A, so the main breaker would go past 100 A. Use a three-phase supply or reduce the load.</p>'
      return
    }

    var names = res.names
    var nRcd = Object.keys(names).length
    var groupIds = {}
    res.circuits.forEach(function (c) {
      ;(groupIds[c.group] = groupIds[c.group] || []).push(c.id)
    })
    function span(g) {
      var ids = groupIds[g]
      return ids.length > 1 ? ids[0] + '–' + ids[ids.length - 1] : ids[0]
    }

    var facts =
      '<dl class="facts">' +
      '<div><dt>Main breaker</dt><dd>' + res.mainIn + ' A</dd></div>' +
      '<div><dt>RCDs</dt><dd>' + nRcd + ' × ' + res.rcdIn + ' A</dd></div>' +
      '<div><dt>Circuits</dt><dd>' + res.circuits.length + '</dd></div>' +
      '<div><dt>Enclosure</dt><dd>' + (res.enc ? res.enc.mods + ' modules' : '—') + '</dd></div>' +
      '</dl>'

    var incomer = [
      tr([
        '<td><strong>Main DP MCB</strong></td>',
        '<td class="mono">' + res.mainIn + ' A, 10 kA, Curve C</td>',
        '<td>Main isolator and protection. Sized for ' + res.demand.toFixed(1) +
          ' A max demand plus 25%. Minimum incomer cable ' + res.incomerCable + ' mm² copper.</td>',
      ]),
      tr([
        '<td><strong>SPD</strong></td>',
        '<td class="mono">Type 2, 20/40 kA, 1P+N</td>',
        '<td>Fit straight after the main DP MCB and ahead of the RCDs. Add the backup protection the maker specifies.</td>',
      ]),
    ]
    if (names[1]) {
      incomer.push(
        tr([
          '<td><span class="dot g1"></span><strong>' + names[1] + ' (power)</strong></td>',
          '<td class="mono">' + res.rcdIn + ' A, 30 mA, Type A</td>',
          '<td>Feeds ' + span(1) + ': air conditioners, heaters, pumps and kitchen sockets. Cuts power on earth leakage.</td>',
        ]),
      )
    }
    if (names[2]) {
      incomer.push(
        tr([
          '<td><span class="dot g2"></span><strong>' + names[2] + ' (general)</strong></td>',
          '<td class="mono">' + res.rcdIn + ' A, 30 mA, Type A or AC</td>',
          '<td>Feeds ' + span(2) + ': fridges, sockets, lights and fans.' +
            (names[1] ? ' A fault on ' + names[1] + ' leaves these on.' : '') + '</td>',
        ]),
      )
    }

    var schedule = res.circuits.map(function (c) {
      return tr([
        '<td class="mono"><strong>' + c.id + '</strong></td>',
        '<td>' + c.label + (c.detail ? '<span class="det">' + c.detail + '</span>' : '') + '</td>',
        '<td class="mono">' + c.amps.toFixed(1) + ' A</td>',
        '<td class="mono">' + c.inA + ' A · ' + c.curve + '</td>',
        '<td class="mono">' + c.cable + ' mm²</td>',
        '<td><span class="dot g' + c.group + '"></span>' + names[c.group] + '</td>',
      ])
    })

    var board
    if (res.rows) {
      var rowWord = res.rows.length === 1 ? 'single row' : res.rows.length + ' rows'
      board =
        '<p class="note">' + res.enc.mods + '-module enclosure, ' + rowWord + '. ' + res.used +
        ' modules used, ' + res.free + ' free for spares.</p>' +
        '<div class="board-scroll"><div class="board" role="img" aria-label="Board layout, left to right: main breaker, surge protector, then RCDs each followed by their circuits">' +
        res.rows
          .map(function (r) {
            var cells = r.items
              .map(function (d) {
                return '<div class="dev dev-' + d.t + '" style="grid-column: span ' + d.m + '"><b>' + d.top + '</b><span>' + d.bot + '</span></div>'
              })
              .join('')
            for (var i = 0; i < r.len - r.used; i++) cells += '<div class="free"></div>'
            return '<div class="brow" style="--n:' + r.len + '">' + cells + '</div>'
          })
          .join('') +
        '</div></div>' +
        '<ul class="legend">' +
        '<li><i class="sw-main"></i>Main DP MCB</li>' +
        '<li><i class="sw-spd"></i>SPD</li>' +
        (names[1] ? '<li><i class="sw-g1"></i>' + names[1] + ' and its circuits</li>' : '') +
        (names[2] ? '<li><i class="sw-g2"></i>' + names[2] + ' and its circuits</li>' : '') +
        '<li><i class="sw-free"></i>Free way</li>' +
        '</ul>'
    } else {
      board =
        '<p class="warn"><strong>Needs more than 48 modules.</strong> Split it into a main board feeding a sub-board.</p>'
    }

    designEl.innerHTML =
      head +
      facts +
      '<h3>Incomer and protection</h3>' +
      '<div class="tbl"><table><thead><tr><th>Part</th><th>Rating</th><th>Notes</th></tr></thead><tbody>' +
      incomer.join('') +
      '</tbody></table></div>' +
      '<h3>Circuit schedule</h3>' +
      '<div class="tbl"><table><thead><tr><th>Ckt</th><th>Load</th><th>Current</th><th>MCB (SP)</th><th>Cable</th><th>RCD</th></tr></thead><tbody>' +
      schedule.join('') +
      '</tbody></table></div>' +
      '<h3>Board layout</h3>' +
      board +
      '<h3>How this was worked out</h3>' +
      '<ul class="notes">' +
      '<li>Currents use ' + fmt(v) + ' V and a power factor of 1.</li>' +
      '<li>Main breaker: ' + fmt(pct) + '% of the connected load, plus 25%, rounded up to a standard size.</li>' +
      '<li>Air conditioners, heaters, pumps and washing machines get a circuit each. Fridges share circuits two at a time, lights and fans share 10 A circuits, sockets share 16 A circuits.</li>' +
      '<li>Each circuit MCB is at least 125% of its own load. Cables are copper, PVC insulated, in conduit. Go up a size for long runs or hot locations.</li>' +
      '<li>This is a starting point. A licensed electrician should check it against your local wiring rules and the supply authority before anything is bought or installed.</li>' +
      '</ul>'
  }

  // ---- calculator ---------------------------------------------------------

  function update() {
    var v = parseFloat(voltsEl.value)
    var ok = v > 0
    voltsEl.setAttribute('aria-invalid', ok ? 'false' : 'true')
    vmsg.hidden = ok

    var pct = parseFloat(divEl.value)
    var dok = pct >= 10 && pct <= 100
    divEl.setAttribute('aria-invalid', dok ? 'false' : 'true')
    dmsg.hidden = dok

    var rows = rowsEl.querySelectorAll('.row')
    var total = 0
    rows.forEach(function (r) {
      var w = Math.max(
        0,
        parseFloat(r.querySelector('[data-f="watts"]').value) || 0,
      )
      var q = Math.max(
        0,
        parseFloat(r.querySelector('[data-f="qty"]').value) || 0,
      )
      var line = w * q
      total += line
      r.querySelector('[data-f="sub"]').innerHTML =
        '<span class="sw">' +
        fmt(line) +
        ' W</span>' +
        '<span class="sa">' +
        (ok ? (line / v).toFixed(2) : '—') +
        ' A</span>'
      r.querySelector('[data-f="rm"]').disabled = rows.length < 2
    })

    totW.textContent = fmt(total)
    totKW.textContent = (total / 1000).toFixed(2) + ' kW'
    totA.textContent = ok ? (total / v).toFixed(2) : '—'
    vShow.textContent = ok ? fmt(v) : '—'
    totD.textContent = ok && dok ? ((total / v) * (pct / 100)).toFixed(2) : '—'
    totDW.textContent = dok ? fmt(total * (pct / 100)) + ' W' : '—'
    divShow.textContent = dok ? fmt(pct) : '—'

    if (!ok || !dok) {
      hint.textContent = 'Fix the highlighted field to see the board design.'
      designEl.innerHTML = ''
      return
    }

    var res = design(readLoads(), v, pct / 100)
    renderDesign(res, v, pct)
    if (res.empty) {
      hint.textContent = 'Add watts to see a suggested board.'
    } else if (res.over) {
      hint.textContent = 'This load is more than a 100 A single-phase board can carry.'
    } else {
      var nR = Object.keys(res.names).length
      hint.textContent =
        'Suggested board: ' + res.mainIn + ' A main, ' + nR +
        (nR === 1 ? ' RCD, ' : ' RCDs, ') + res.circuits.length +
        (res.circuits.length === 1 ? ' circuit' : ' circuits') +
        (res.enc ? ', ' + res.enc.mods + '-module enclosure' : '') + '. Details below.'
    }
  }

  rowsEl.addEventListener('change', function (e) {
    if (e.target.getAttribute('data-f') === 'app') {
      var row = e.target.closest('.row')
      row.querySelector('[data-f="watts"]').value = APPLIANCES[e.target.value].w
      update()
    }
  })
  rowsEl.addEventListener('input', update)
  rowsEl.addEventListener('click', function (e) {
    var b = e.target.closest('[data-f="rm"]')
    if (b && !b.disabled) {
      var next =
        b.closest('.row').nextElementSibling ||
        b.closest('.row').previousElementSibling
      b.closest('.row').remove()
      update()
      if (next) next.querySelector('select').focus()
    }
  })
  voltsEl.addEventListener('input', update)
  divEl.addEventListener('input', update)

  document.getElementById('add').addEventListener('click', function () {
    var used = {}
    rowsEl.querySelectorAll('[data-f="app"]').forEach(function (s) {
      used[s.value] = true
    })
    var idx = 0
    for (var i = 0; i < APPLIANCES.length; i++) {
      if (!used[i]) {
        idx = i
        break
      }
    }
    addRow(idx, APPLIANCES[idx].w, 1, true)
    update()
  })

  addRow(0, APPLIANCES[0].w, 1, false)
  update()
})()
