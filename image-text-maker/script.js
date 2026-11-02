;(() => {
  const $ = (id) => document.getElementById(id)
  const canvas = $('c'),
    ctx = canvas.getContext('2d')
  let img = null

  // ---- fonts (web = loaded from Google Fonts; falls back if offline) ----
  const FONTS = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Impact', value: 'Impact, Haettenschweiler, sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Times New Roman', value: "'Times New Roman', serif" },
    { label: 'Courier New', value: "'Courier New', monospace" },
    { label: 'Comic Sans', value: "'Comic Sans MS', cursive" },
    {
      label: 'Jamil Noori Nastaleeq',
      value: "'JameelNoriNastaleeq', serif",
      web: 'JameelNoriNastaleeq',
    },
    {
      label: 'Noto Nastaleeq',
      value: "'NotoNastaleeq', serif",
      web: 'NotoNastaleeq',
    },
    {
      label: 'Noto Naskh Arabic',
      value: "'Noto Naskh Arabic', serif",
      web: 'Noto Naskh Arabic',
    },
    { label: 'Amiri', value: "'Amiri', serif", web: 'Amiri' },
  ]

  const TEXTS = [1, 2].map((n) => ({
    text: $('text' + n),
    font: $('font' + n),
    align: $('align' + n),
    size: $('size' + n),
    sizeVal: $('sizeVal' + n),
    y: $('y' + n),
    yVal: $('yVal' + n),
    color: $('color' + n),
  }))

  TEXTS.forEach((t) => {
    FONTS.forEach((f) => t.font.add(new Option(f.label, f.value)))
    t.font.selectedIndex = 0
  })

  function loadWebFonts() {
    const jobs = []
    FONTS.filter((f) => f.web).forEach((f) => {
      jobs.push(document.fonts.load(`20px "${f.web}"`, 'اردو'))
      jobs.push(document.fonts.load(`bold 20px "${f.web}"`, 'اردو'))
    })
    return Promise.allSettled(jobs)
  }

  const RTL_RE = /[\u0590-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/

  // ---- text wrapping: returns [{ t: lineText, last: isLastLineOfParagraph }] ----
  function wrap(text, maxW) {
    const lines = []
    text.split('\n').forEach((par) => {
      const words = par.split(' ')
      let line = ''
      const para = []
      words.forEach((w) => {
        const test = line ? line + ' ' + w : w
        if (ctx.measureText(test).width > maxW && line) {
          para.push(line)
          line = w
        } else line = test
      })
      para.push(line)
      para.forEach((l, i) => lines.push({ t: l, last: i === para.length - 1 }))
    })
    return lines
  }

  // ---- output size (same presets as Quote Card Studio) ----
  const SIZES = [
    { id: 'orig', name: 'Original', w: 0, h: 0 },
    { id: 'sq', name: 'Square', w: 1080, h: 1080 },
    { id: 'pt', name: 'Portrait 4:5', w: 1080, h: 1350 },
    { id: 'ls', name: 'Landscape 16:9', w: 1920, h: 1080 },
    { id: 'st', name: 'Story 9:16', w: 1080, h: 1920 },
    { id: 'ln', name: 'Link preview', w: 1200, h: 630 },
  ]
  let outId = 'orig'
  const outSize = () => SIZES.find((z) => z.id === outId)

  const sizesEl = $('sizes')
  SIZES.forEach((z) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'size'
    b.dataset.id = z.id
    const ratio = document.createElement('span')
    ratio.className = 'ratio'
    if (z.w) {
      const k = 20 / Math.max(z.w, z.h)
      ratio.style.width = Math.round(z.w * k) + 'px'
      ratio.style.height = Math.round(z.h * k) + 'px'
    } else {
      ratio.style.width = ratio.style.height = '14px'
    }
    const txt = document.createElement('span')
    txt.textContent = z.name
    const small = document.createElement('small')
    small.dataset.dims = z.id
    small.textContent = z.w ? z.w + ' × ' + z.h : 'image size'
    txt.appendChild(small)
    b.appendChild(ratio)
    b.appendChild(txt)
    b.addEventListener('click', () => {
      outId = z.id
      syncSizeUI()
      draw()
    })
    sizesEl.appendChild(b)
  })

  function syncSizeUI() {
    Array.prototype.forEach.call(sizesEl.children, (b) =>
      b.setAttribute('aria-pressed', b.dataset.id === outId ? 'true' : 'false'),
    )
    const custom = outId !== 'orig'
    ;['fit', 'posX', 'posY', 'fitBg'].forEach((id) => {
      $(id).disabled = !custom
    })
    $('posXVal').textContent = $('posX').value
    $('posYVal').textContent = $('posY').value
    const o = sizesEl.querySelector('[data-dims="orig"]')
    o.textContent = img
      ? img.naturalWidth + ' × ' + img.naturalHeight
      : 'image size'
  }

  // ---- drawing ----
  function draw() {
    if (!img) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      $('dims').textContent = ''
      return
    }
    const z = outSize()
    const iw = img.naturalWidth,
      ih = img.naturalHeight
    const W = z.w || iw,
      H = z.h || ih
    canvas.width = W
    canvas.height = H
    if (z.w) {
      // Fill = scale to cover and crop; Fit = scale to fit and pad with the chosen color.
      ctx.fillStyle = $('fitBg').value
      ctx.fillRect(0, 0, W, H)
      const s =
        $('fit').value === 'cover'
          ? Math.max(W / iw, H / ih)
          : Math.min(W / iw, H / ih)
      const dw = iw * s,
        dh = ih * s
      const dx = ((W - dw) * parseFloat($('posX').value)) / 100
      const dy = ((H - dh) * parseFloat($('posY').value)) / 100
      ctx.drawImage(img, dx, dy, dw, dh)
    } else {
      ctx.drawImage(img, 0, 0)
    }
    TEXTS.forEach(drawText)
    drawWatermark()
    $('dims').textContent = W + ' × ' + H + ' px · PNG'
  }

  function drawText(t) {
    let text = t.text.value
    if (!text.trim()) return
    if ($('upper').checked) text = text.toUpperCase()

    const W = canvas.width,
      H = canvas.height
    const fs = Math.round((W * parseFloat(t.size.value)) / 100)
    const sw = (fs * parseFloat($('strokeW').value)) / 100
    const rtl = RTL_RE.test(text)

    ctx.save()
    ctx.font = `${$('bold').checked ? 'bold ' : ''}${fs}px ${t.font.value}`
    ctx.textBaseline = 'middle'
    ctx.direction = rtl ? 'rtl' : 'ltr'
    ctx.lineJoin = 'round'

    const left = W * 0.05,
      right = W * 0.95,
      boxW = right - left
    const al = t.align.value
    const justify = al === 'justify'
    const drawAlign = justify ? (rtl ? 'right' : 'left') : al
    const cx =
      drawAlign === 'left' ? left : drawAlign === 'right' ? right : W / 2
    ctx.textAlign = drawAlign

    const lines = wrap(text, boxW)
    // Nastaliq script is tall, so give it more line spacing
    const lh = fs * (/Nastaliq/i.test(t.font.value) ? 1.9 : 1.2)
    const totalH = lh * lines.length
    const cy = (H * parseFloat(t.y.value)) / 100
    const startY = cy - totalH / 2 + lh / 2

    if ($('band').checked) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)'
      ctx.fillRect(0, cy - totalH / 2 - fs * 0.3, W, totalH + fs * 0.6)
    }

    const useShadow = $('shadow').checked
    const setShadow = (on) => {
      if (on) {
        ctx.shadowColor = $('shadowColor').value
        ctx.shadowBlur = (fs * parseFloat($('shadowBlur').value)) / 100
        ctx.shadowOffsetX = ctx.shadowOffsetY =
          (fs * parseFloat($('shadowDist').value)) / 100
      } else {
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = ctx.shadowOffsetY = 0
      }
    }
    const paint = (str, x, y, mw) => {
      if (sw > 0) {
        setShadow(useShadow)
        ctx.lineWidth = sw
        ctx.strokeStyle = $('stroke').value
        mw ? ctx.strokeText(str, x, y, mw) : ctx.strokeText(str, x, y)
        setShadow(false)
      } else {
        setShadow(useShadow)
      }
      ctx.fillStyle = t.color.value
      mw ? ctx.fillText(str, x, y, mw) : ctx.fillText(str, x, y)
    }

    lines.forEach((line, i) => {
      const y = startY + i * lh
      const words = line.t.split(' ').filter(Boolean)

      if (justify && !line.last && words.length > 1) {
        // spread words so the line fills the whole box
        const widths = words.map((w) => ctx.measureText(w).width)
        const space =
          (boxW - widths.reduce((a, b) => a + b, 0)) / (words.length - 1)
        if (space >= 0) {
          let x = rtl ? right : left
          words.forEach((w, k) => {
            paint(w, x, y)
            x += (rtl ? -1 : 1) * (widths[k] + space)
          })
          return
        }
      }
      paint(line.t, cx, y, boxW)
    })
    ctx.restore()
  }

  // ---- watermark: logo with URL text underneath, bottom-left ----
  const WM_TEXT = 'https://urduforum.org/'
  const logo = new Image()
  let logoReady = false
  logo.onload = () => {
    logoReady = true
    draw()
  }
  logo.onerror = () => {
    logoReady = false
    $('hint').textContent =
      'urduforum-logo.png was not found next to this page. Put it in the same folder, or pick it with "Logo file".'
  }
  logo.src = 'urduforum-logo.png'

  $('wmFile').addEventListener('change', (e) => {
    const f = e.target.files[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    logo.onload = () => {
      logoReady = true
      draw()
      URL.revokeObjectURL(url)
    }
    logo.src = url
  })

  function drawWatermark() {
    if (!$('wm').checked) return
    const W = canvas.width,
      H = canvas.height
    const h = (W * parseFloat($('wmSize').value)) / 100 // logo height
    const margin = W * 0.02
    const hasLogo = logoReady && logo.naturalWidth

    const textFs = Math.round(h * 0.3)
    const textH = textFs * 1.3
    const gap = hasLogo ? h * 0.12 : 0
    const blockH = (hasLogo ? h : 0) + gap + textH
    const top = H - margin - blockH

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.6)'
    ctx.shadowBlur = h * 0.15

    if (hasLogo) {
      const w = (h * logo.naturalWidth) / logo.naturalHeight
      ctx.drawImage(logo, margin, top, w, h)
    }

    ctx.direction = 'ltr'
    ctx.font = `bold ${textFs}px Arial, sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(WM_TEXT, margin, top + (hasLogo ? h + gap : 0) + textH / 2)
    ctx.restore()
  }

  // ---- load main image ----
  $('file').addEventListener('change', (e) => {
    const f = e.target.files[0]
    if (!f) return
    const url = URL.createObjectURL(f)
    const i = new Image()
    i.onload = () => {
      img = i
      $('download').disabled = false
      $('hint').textContent = ''
      syncSizeUI()
      draw()
      URL.revokeObjectURL(url)
    }
    i.src = url
  })

  // ---- controls ----
  const controlIds = [
    'stroke',
    'strokeW',
    'bold',
    'upper',
    'band',
    'shadow',
    'shadowColor',
    'shadowBlur',
    'shadowDist',
    'wm',
    'wmSize',
    'fit',
    'posX',
    'posY',
    'fitBg',
  ]
  function onChange() {
    $('posXVal').textContent = $('posX').value
    $('posYVal').textContent = $('posY').value
    TEXTS.forEach((t) => {
      t.sizeVal.textContent = t.size.value
      t.yVal.textContent = t.y.value
    })
    $('strokeVal').textContent = $('strokeW').value
    $('shadowBlurVal').textContent = $('shadowBlur').value
    $('shadowDistVal').textContent = $('shadowDist').value
    $('wmSizeVal').textContent = $('wmSize').value
    draw()
  }
  controlIds.forEach((id) => $(id).addEventListener('input', onChange))
  TEXTS.forEach((t) =>
    [t.text, t.font, t.align, t.size, t.y, t.color].forEach((el) =>
      el.addEventListener('input', onChange),
    ),
  )

  syncSizeUI()

  // redraw once web fonts finish loading
  loadWebFonts().then(draw)

  // ---- download ----
  $('download').onclick = () => {
    try {
      canvas.toBlob((b) => {
        const a = document.createElement('a')
        a.href = URL.createObjectURL(b)
        a.download =
          'image-with-text-' + canvas.width + 'x' + canvas.height + '.png'
        a.click()
        setTimeout(() => URL.revokeObjectURL(a.href), 1000)
      }, 'image/png')
    } catch (err) {
      alert(
        'The browser blocked saving because the logo was loaded from a local file. ' +
          'Either pick the logo with "Logo file", or serve this folder with a local web server ' +
          '(for example: python -m http.server) and open http://localhost:8000.',
      )
    }
  }
})()
