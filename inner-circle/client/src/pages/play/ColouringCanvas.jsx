import { useCallback, useEffect, useRef, useState } from 'react'
import { Eraser, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useT } from '../../i18n'

const SWATCHES = [
  { key: 'sage', hex: '#6e9169' },
  { key: 'mint', hex: '#a7c9a4' },
  { key: 'cream', hex: '#efe2bc' },
  { key: 'sky', hex: '#a9c6d9' },
  { key: 'amber', hex: '#dcae55' },
  { key: 'rose', hex: '#c07f7a' },
]
const BRUSHES = [
  { key: 'thin', size: 4 },
  { key: 'medium', size: 9 },
  { key: 'thick', size: 18 },
]

export default function ColouringCanvas() {
  const { toast } = useApp()
  const t = useT()
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const lastPt = useRef(null)
  const [color, setColor] = useState(SWATCHES[0].hex)
  const [brush, setBrush] = useState(BRUSHES[1].size)
  const [eraser, setEraser] = useState(false)

  const paintBackground = useCallback((ctx, w, h) => {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return undefined
    const ctx = canvas.getContext('2d')

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const snapshot = document.createElement('canvas')
      snapshot.width = canvas.width
      snapshot.height = canvas.height
      if (canvas.width > 0 && canvas.height > 0) {
        snapshot.getContext('2d').drawImage(canvas, 0, 0)
      }
      const cssW = wrap.clientWidth
      const cssH = 280
      canvas.style.height = `${cssH}px`
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      paintBackground(ctx, canvas.width, canvas.height)
      if (snapshot.width > 0 && snapshot.height > 0) {
        ctx.save()
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.drawImage(snapshot, 0, 0, canvas.width, canvas.height)
        ctx.restore()
      }
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [paintBackground])

  const toPoint = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      scale: scaleX,
    }
  }

  const down = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    canvas.setPointerCapture?.(e.pointerId)
    drawing.current = true
    lastPt.current = toPoint(e)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = eraser ? '#ffffff' : color
    ctx.beginPath()
    ctx.arc(lastPt.current.x, lastPt.current.y, (brush * lastPt.current.scale) / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  const move = (e) => {
    if (!drawing.current) return
    const pt = toPoint(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = eraser ? '#ffffff' : color
    ctx.lineWidth = brush * pt.scale
    ctx.beginPath()
    ctx.moveTo(lastPt.current.x, lastPt.current.y)
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    lastPt.current = pt
  }

  const up = () => {
    drawing.current = false
    lastPt.current = null
  }

  const clearAll = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    paintBackground(ctx, canvas.width, canvas.height)
    toast(t('play.toast.freshPage'))
  }

  return (
    <div className="game-shell">
      <div className="play-tools">
        <div className="palette-row" role="group" aria-label={t('play.colour.colours')}>
          {SWATCHES.map((s) => (
            <button
              key={s.hex}
              type="button"
              className={`palette-swatch ${!eraser && color === s.hex ? 'palette-swatch-on' : ''}`}
              style={{ background: s.hex }}
              aria-label={t('play.colour.swatchLabel', { name: t(`play.colour.swatches.${s.key}`) })}
              aria-pressed={!eraser && color === s.hex}
              onClick={() => { setColor(s.hex); setEraser(false) }}
            />
          ))}
        </div>
        <div className="chip-row" role="group" aria-label={t('play.colour.brushSize')}>
          {BRUSHES.map((b) => (
            <button
              key={b.size}
              type="button"
              className={`chip ${brush === b.size && !eraser ? 'chip-on' : ''}`}
              aria-pressed={brush === b.size && !eraser}
              onClick={() => { setBrush(b.size); setEraser(false) }}
            >
              {t(`play.colour.brushes.${b.key}`)}
            </button>
          ))}
          <button
            type="button"
            className={`chip ${eraser ? 'chip-on' : ''}`}
            aria-pressed={eraser}
            onClick={() => setEraser(true)}
          >
            <Eraser size={14} /> {t('play.colour.eraser')}
          </button>
          <button type="button" className="btn btn-outline btn-sm" onClick={clearAll}>
            <Trash2 size={14} /> {t('play.colour.clear')}
          </button>
        </div>
      </div>
      <div ref={wrapRef} className="colour-wrap">
        <canvas
          ref={canvasRef}
          className="colour-canvas"
          aria-label={t('play.colour.canvasLabel')}
          role="img"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          onPointerCancel={up}
        />
      </div>
      <p className="tiny muted center" style={{ margin: '0.6rem 0 0' }}>
        {t('play.colour.footer')}
      </p>
    </div>
  )
}
