import { useEffect, useRef, type CSSProperties } from 'react'
import { BRAND } from './Brand'
import { applyTheme, getSettings } from '@/lib/settings'

/** Blender でレンダリングした 3D のエンブレムの連番（scripts/blender/emblem_art.py・logo.py → public/opening/） */
const FRAMES = 14
const frameSrc = (k: number) => `/opening/copper-${String(k).padStart(2, '0')}.webp`
const PATINA_SRC = '/opening/patina.webp'
/** 背景はテーマに関係なく墨色（銅と緑青がいちばん映える） */
export const OPENING_BG = '#0e0f11'


function preload(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = src
  })
}

/**
 * 起動時のオープニング。ブランドの考え（新しい銅 → 使い込んで緑青）をそのまま動きにする。
 * 1. 磨いたばかりの銅に緑青色のエナメルを埋めたエンブレム（ヴィンテージの看板の組み方）が、斜めから正面へ回り込む
 * 2. 年月を経た姿（銅のくすみ・酸化の斑点）が左上から広がり、光がひと筋流れる
 * 3. 線とひとことが出て、読める間だけ止まってから、アプリへ（全体で約5.5秒）
 * タップでいつでも飛ばせる。「視差効果を減らす」の設定のときは動かさずに短く見せる。
 */
export function Opening({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const medal = useRef<HTMLDivElement>(null)
  const copper = useRef<HTMLImageElement>(null)
  const copperNext = useRef<HTMLImageElement>(null)
  const patina = useRef<HTMLDivElement>(null)
  const sheen = useRef<HTMLDivElement>(null)
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
      const els = { r: root.current!, m: medal.current!, c: copper.current!, n: copperNext.current!, p: patina.current!, s: sheen.current!, l: line.current!, t: tagline.current! }

      if (reduced) {
        gsap.set([els.m, els.p, els.l, els.t], { opacity: 1, clearProps: 'transform' })
        els.p.style.setProperty('--r', '160%')
        const tl = gsap.timeline({ onComplete: finish })
        tl.to(els.r, { opacity: 0, duration: 0.4, delay: 2 })
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
      tl.fromTo(els.m, { opacity: 0, y: 26, scale: 0.86 }, { opacity: 1, y: 0, scale: 1, duration: 1.5 }, 0)
        // 3D の連番をめくって、メダルを斜めから正面へ回す（となりのコマと重ねてなめらかに）
        .to(
          frame,
          {
            f: FRAMES - 1,
            duration: 1.8,
            ease: 'power2.out',
            onUpdate: () => {
              const k = Math.min(Math.floor(frame.f), FRAMES - 1)
              if (k !== shown) {
                shown = k
                els.c.src = frameSrc(k)
                els.n.src = frameSrc(Math.min(k + 1, FRAMES - 1))
              }
              els.n.style.opacity = String(frame.f - k)
            },
          },
          0,
        )
        // 緑青が左上から広がる（年月の早送り）
        .fromTo(els.p, { '--r': '0%' }, { '--r': '160%', duration: 1.7, ease: 'power1.inOut' }, 2.0)
        // 光がひと筋、メダルの上を流れる
        .fromTo(els.s, { xPercent: -120, opacity: 0 }, { xPercent: 120, opacity: 1, duration: 1.2, ease: 'power2.inOut' }, 2.7)
        .to(els.s, { opacity: 0, duration: 0.35 }, 3.6)
        // 細い線が伸び、ひとこと（字間を詰めながら）
        .fromTo(els.l, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.8, ease: 'expo.out' }, 3.0)
        .fromTo(els.t, { opacity: 0, y: 6, letterSpacing: '0.3em' }, { opacity: 1, y: 0, letterSpacing: '0.06em', duration: 1.2, ease: 'expo.out' }, 3.15)
        // ひとことを読める間だけ止めてから、アプリへ
        .to(els.m, { scale: 0.96, duration: 0.6, ease: 'power2.in' }, 5.0)
        .to(els.r, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 5.05)
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
      <div ref={medal} className="relative aspect-square w-[min(80vw,310px)] opacity-0">
        <img ref={copper} src={frameSrc(0)} alt="" draggable={false} className="absolute inset-0 h-full w-full" />
        <img ref={copperNext} src={frameSrc(1)} alt="" draggable={false} className="absolute inset-0 h-full w-full opacity-0" />
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

      <div ref={line} className="mt-9 h-px w-10 origin-center bg-[#2aa596] opacity-0" />
      <p ref={tagline} className="mt-4 text-[12.5px] tracking-[0.06em] text-[#a7a29b] opacity-0">
        {BRAND.tagline}
      </p>
    </div>
  )
}
