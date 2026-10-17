import { useCallback, useEffect, useLayoutEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CharImage } from './Guide'
import { Button, cx } from './ui'
import { useSettings } from '@/lib/settings'

export interface TourStep {
  /** 照らす要素（data-tour の値）。省略すると画面中央にカードだけ出す */
  target?: string
  title: string
  body: ReactNode
}

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PAD = 6

function findTarget(name?: string): HTMLElement | null {
  if (!name) return null
  // 同じ data-tour が複数あるときは、画面に見えている最初のもの
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`))
  return all.find((el) => el.getClientRects().length > 0) ?? null
}

/**
 * 使い方ツアー（コーチマーク）。画面を暗くして、説明する場所だけを明るく切り抜く。
 * 「次へ」で進み、「スキップ」でいつでも終われる。終わったら onDone。
 */
export function Tour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const guide = useSettings((s) => s.guide)
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [vh, setVh] = useState(() => window.innerHeight)
  const step = steps[i]
  const last = i === steps.length - 1

  const measure = useCallback(() => {
    setVh(window.innerHeight)
    const el = findTarget(step?.target)
    if (!el) return setRect(null)
    const r = el.getBoundingClientRect()
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 })
  }, [step])

  useLayoutEffect(() => {
    const el = findTarget(step?.target)
    if (el) {
      const r = el.getBoundingClientRect()
      // 画面の外なら中央まで送ってから測る
      if (r.top < 70 || r.bottom > window.innerHeight - 110) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    measure()
    const t = setTimeout(measure, 380)
    return () => clearTimeout(t)
  }, [step, measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [measure])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  if (!step) return null
  // 説明カードは、照らした場所の下に入ればその下、入らなければ上。対象がなければ中央
  const below = rect ? rect.top + rect.height + 12 + 230 < vh : false
  const cardStyle = rect
    ? below
      ? { top: rect.top + rect.height + 12 }
      : { bottom: Math.max(12, vh - rect.top + 12) }
    : { top: '50%', transform: 'translateY(-50%)' }

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="使い方ガイド">
      {/* 下の画面を操作できないようにする（暗幕） */}
      <div className={cx('absolute inset-0', !rect && 'bg-black/55')} />
      {rect && (
        <div
          className="pointer-events-none absolute rounded-[18px] transition-all duration-300 ease-out"
          style={{ ...rect, boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.55), 0 0 0 2px rgb(255 255 255 / 0.9)' }}
        />
      )}
      <div
        key={i}
        className="absolute inset-x-4 mx-auto max-w-[360px] animate-rise rounded-[20px] border border-line bg-surface p-4 shadow-float"
        style={cardStyle}
      >
        <div className="flex items-start gap-3">
          {guide && !rect && <CharImage pose={last ? 'celebrate' : 'greet'} size={64} className="-ml-1 -mt-1" />}
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-semibold tabular-nums text-muted">
              {i + 1} / {steps.length}
            </p>
            <p className="mt-0.5 text-[17px] font-bold leading-snug">{step.title}</p>
            <div className="mt-1.5 text-[13.5px] leading-relaxed text-ink/85">{step.body}</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {!last && (
            <button onClick={onDone} className="min-h-10 px-2 text-[13px] font-medium text-muted">
              スキップ
            </button>
          )}
          <div className="ml-auto flex gap-2">
            {i > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setI(i - 1)}>
                戻る
              </Button>
            )}
            <Button variant="ink" size="sm" onClick={() => (last ? onDone() : setI(i + 1))}>
              {last ? 'はじめる' : '次へ'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** ホームの使い方ツアー（はじめての人に1回だけ。設定からもう一度見られる） */
export const HOME_TOUR: TourStep[] = [
  {
    title: 'ようこそ！使い方を30秒でご案内します',
    body: 'Tetsu English は、単語・リスニング・発音・会話・翻訳をひとつで練習できるアプリです。主な場所を順番に見ていきましょう。',
  },
  {
    target: 'mode',
    title: 'モードの切り替え',
    body: '一般・ビジネス・IT・鉄道をタップすると、そのモードの単語・例文・会話に切り替わります。右のボタンをオンにすると、いくつでも組み合わせられます。',
  },
  {
    target: 'today',
    title: '今日の学習',
    body: '復習の時期が来た単語と、新しい単語を自動で組み合わせます。答えてから確認する「思い出す練習」で、記憶に残りやすくなります。',
  },
  {
    target: 'week',
    title: '続けた日の記録',
    body: '学習した日に色がつきます。タップすると、12週間の記録と、これからの復習の予定が見られます。',
  },
  {
    target: 'tab-words',
    title: '単語帳',
    body: '全単語を検索できます。「苦手」「保存した単語（★）」だけを集めて練習することもできます。',
  },
  {
    target: 'tab-practice',
    title: '練習',
    body: 'リスニング・聞き分け・ディクテーション・瞬間英作文・発音チェック・シャドーイング・耳で復習。覚えた単語を使える英語にします。',
  },
  {
    target: 'tab-scenes',
    title: 'シーン会話',
    body: '自己紹介・会議・障害報告・保線の安全ミーティングなど、場面ごとの会話を聞いて、ロールプレイで話してみましょう。',
  },
  {
    target: 'tab-translate',
    title: '翻訳と同時通訳',
    body: '入力しながら・話しながら訳せます。「同時通訳」では、話しているそばから訳が流れ、対面の会話モードもあります。',
  },
  {
    target: 'settings',
    title: '設定',
    body: '読み上げの発音（アメリカ・イギリス・オーストラリア・インドなど）と声、速度、効果音、1日の目安、データのバックアップはここから。',
  },
  {
    title: '準備OK！',
    body: 'まずは「学習をはじめる」から。この案内は、設定の「使い方ガイド」からいつでも見直せます。',
  },
]

/** 翻訳画面のヘルプ */
export const TRANSLATE_TOUR: TourStep[] = [
  {
    target: 'interpreter',
    title: '同時通訳',
    body: '話しているそばから訳を表示します。日本語→英語・英語→日本語のほか、交互に話す「会話」モードがあります。',
  },
  {
    target: 'mic',
    title: '音声入力',
    body: 'マイクを押して話すと、入力欄に文字が出ます。止めると訳を読み上げます（設定でオフにできます）。',
  },
  {
    target: 'glossary',
    title: '保線用語のチェック',
    body: '文章に保線用語があると、英国・米国の言い方と JIS の日本語を並べて表示します。オフラインでも使えます。',
  },
]
