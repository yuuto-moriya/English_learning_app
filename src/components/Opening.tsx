import { useEffect, useRef, type CSSProperties } from 'react'
import { BRAND } from './Brand'
import { applyTheme, getSettings } from '@/lib/settings'

/** Blender でレンダリングした 3D ロゴの連番（scripts/blender/logo.py → public/opening/） */
const FRAMES = 14
const frameSrc = (k: number) => `/opening/copper-${String(k).padStart(2, '0')}.webp`
const PATINA_SRC = '/opening/patina.webp'
/** 背景はテーマに関係なく墨色（銅と緑青がいちばん映える） */
export const OPENING_BG = '#0e0f11'

const letters = BRAND.name.toUpperCase().split('')

function preload(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = src
  })
}

/**
 * 起動時のオープニング。ブランドの考え（新しい銅 → 使い込んで緑青）をそのまま動きにする。
 * 1. 磨いた銅のメダル（3D の「EP」）が、斜めから正面へ回り込む
 * 2. 緑青（パティーナ）がメダルの上に広がり、光がひと筋流れる
 * 3. 「ELIZA PATINA」が1文字ずつ現れ、ひとことが出て、アプリへ
 * タップでいつでも飛ばせる。「視差効果を減らす」の設定のときは動かさずに短く見せる。
 */
export function Opening({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const medal = useRef<HTMLDivElement>(null)
  const copper = useRef<HTMLImageElement>(null)
  const patina = useRef<HTMLDivElement>(null)
  const sheen = useRef<HTMLDivElement>(null)
  const word = useRef<HTMLParagraphElement>(null)
  const line = useRef<HTMLDivElement>(null)
  const tagline = useRef<HTMLParagraphElement>(null)
  const done = useRef(false)
  const skipRef = useRef<() => void>(() => undefined)

  useEffect(() => {
    // index.html で先に出している同じ色の幕を外し、ステータスバーの色も合わせる
    document.getElementById('boot')?.remove()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', OPENING_BG)

    let alive = true
    let kill = () => undefined as void
    const finish = () => {
      if (done.current) return
      done.current = true
      // ステータスバーの色をテーマの色に戻す
      applyTheme(getSettings().theme)
      onDone()
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ;(async () => {
      // 最初の数コマと緑青の画像を読み込んでから始める（長く待たない）
      await Promise.race([
        Promise.all([PATINA_SRC, ...Array.from({ length: FRAMES }, (_, k) => frameSrc(k))].map(preload)),
        new Promise((r) => setTimeout(r, 900)),
      ])
      const { gsap } = await import('gsap')
      if (!alive) return
      const els = { r: root.current!, m: medal.current!, c: copper.current!, p: patina.current!, s: sheen.current!, w: word.current!, l: line.current!, t: tagline.current! }
      const chars = Array.from(els.w.querySelectorAll('span'))

      if (reduced) {
        gsap.set([els.m, els.p, els.w, ...chars, els.l, els.t], { opacity: 1, clearProps: 'transform' })
        els.p.style.setProperty('--r', '160%')
        const tl = gsap.timeline({ onComplete: finish })
        tl.to(els.r, { opacity: 0, duration: 0.4, delay: 1.1 })
        kill = () => void tl.kill()
        skipRef.current = () => {
          tl.kill()
          gsap.to(els.r, { opacity: 0, duration: 0.2, onComplete: finish })
        }
        return
      }

      const frame = { f: 0 }
      let shown = -1
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: finish })
      tl.fromTo(els.m, { opacity: 0, y: 22, scale: 0.86 }, { opacity: 1, y: 0, scale: 1, duration: 1.0 }, 0)
        // 3D の連番をめくって、メダルを斜めから正面へ回す
        .to(
          frame,
          {
            f: FRAMES - 1,
            duration: 0.85,
            ease: 'power2.out',
            onUpdate: () => {
              const k = Math.round(frame.f)
              if (k !== shown) {
                shown = k
                els.c.src = frameSrc(k)
              }
            },
          },
          0,
        )
        // 緑青が左上から広がる（年月の早送り）
        .fromTo(els.p, { '--r': '0%' }, { '--r': '160%', duration: 1.05, ease: 'power1.inOut' }, 0.8)
        // 光がひと筋、メダルの上を流れる
        .fromTo(els.s, { xPercent: -120, opacity: 0 }, { xPercent: 120, opacity: 1, duration: 0.9, ease: 'power2.inOut' }, 1.15)
        .to(els.s, { opacity: 0, duration: 0.25 }, 1.8)
        // 文字は字間を詰めながら1文字ずつ
        .fromTo(els.w, { letterSpacing: '0.62em' }, { letterSpacing: '0.28em', duration: 1.2, ease: 'expo.out' }, 1.0)
        .fromTo(chars, { opacity: 0, y: 8, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.6, stagger: 0.035 }, 1.0)
        .fromTo(els.l, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.6, ease: 'expo.out' }, 1.55)
        .fromTo(els.t, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.6 }, 1.7)
        // アプリへ
        .to(els.m, { scale: 0.96, duration: 0.5, ease: 'power2.in' }, 2.65)
        .to(els.r, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 2.7)
      kill = () => void tl.kill()
      skipRef.current = () => {
        tl.kill()
        gsap.to(els.r, { opacity: 0, duration: 0.25, ease: 'power1.in', onComplete: finish })
      }
    })()

    return () => {
      alive = false
      kill()
    }
  }, [onDone])

  return (
    <div
      ref={root}
      className="fixed inset-0 z-[100] flex select-none flex-col items-center justify-center px-6"
      // 中央をほんの少し明るくして、奥行きを出す
      style={{ background: `radial-gradient(120% 70% at 50% 40%, #1b1c20 0%, ${OPENING_BG} 62%)` }}
      onClick={() => skipRef.current()}
      role="img"
      aria-label={`${BRAND.name}。${BRAND.tagline}`}
    >
      {/* 画像はメダルの周りに余白があるので、表示は大きめに取る（メダル自体は約 190px） */}
      <div ref={medal} className="relative -my-8 aspect-square w-[min(84vw,330px)] opacity-0">
        <img ref={copper} src={frameSrc(0)} alt="" draggable={false} className="absolute inset-0 h-full w-full" />
        {/* 緑青の姿を、円の広がるマスクで重ねていく */}
        <div
          ref={patina}
          className="absolute inset-0"
          style={
            {
              '--r': '0%',
              WebkitMaskImage: 'radial-gradient(circle at 30% 26%, #000 var(--r), transparent calc(var(--r) + 22%))',
              maskImage: 'radial-gradient(circle at 30% 26%, #000 var(--r), transparent calc(var(--r) + 22%))',
            } as CSSProperties
          }
        >
          <img src={PATINA_SRC} alt="" draggable={false} className="h-full w-full" />
        </div>
        {/* 光の筋（メダルの形で切り抜く） */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{
            WebkitMaskImage: `url(${PATINA_SRC})`,
            maskImage: `url(${PATINA_SRC})`,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
          }}
        >
          <div
            ref={sheen}
            className="absolute inset-y-0 w-full opacity-0"
            style={{ background: 'linear-gradient(105deg, transparent 35%, rgb(255 246 235 / 0.42) 50%, transparent 65%)' }}
          />
        </div>
      </div>

      <p ref={word} className="en mt-2 whitespace-nowrap text-[19px] font-medium text-[#efe8df]" style={{ letterSpacing: '0.28em', marginRight: '-0.28em' }}>
        {letters.map((ch, i) => (
          <span key={i} className="inline-block opacity-0">
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </p>
      <div ref={line} className="mt-4 h-px w-10 origin-center bg-[#2aa596] opacity-0" />
      <p ref={tagline} className="mt-4 text-[12.5px] tracking-[0.06em] text-[#a7a29b] opacity-0">
        {BRAND.tagline}
      </p>
    </div>
  )
}
