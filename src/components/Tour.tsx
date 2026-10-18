import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
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
/** 説明カードの高さの見積もり（照らす場所がカードに隠れないよう、上に送る量の目安） */
const CARD_EST = 270

/** 説明カードを置く位置（画面の下端からの距離）。タブバーがあればそのすぐ上、なければ画面の下 */
function dockOffset(vh: number): number | null {
  const bar = document.querySelector<HTMLElement>('nav[aria-label="メインメニュー"] > div')
  const r = bar?.getBoundingClientRect()
  return r && r.height > 0 ? Math.max(16, vh - r.top + 10) : null
}

function findTarget(name?: string): HTMLElement | null {
  if (!name) return null
  // 同じ data-tour が複数あるときは、画面に見えている最初のもの
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`))
  return all.find((el) => el.getClientRects().length > 0) ?? null
}

/**
 * 使い方ツアー（コーチマーク）。画面を暗くして、説明する場所だけを明るく切り抜く。
 * 「次へ」で進み、「スキップ」でいつでも終われる。終わったら onDone。
 * 説明カードはいつも同じ場所（タブバーのすぐ上）に下端をそろえて置き、「次へ」が動かないようにする。
 * 照らす場所はカードの上に見えるよう、必要なら画面を送る。ページの終わりで送れず隠れてしまうときだけ、カードを上に置く。
 */
export function Tour({ steps, onDone }: { steps: TourStep[]; onDone: () => void }) {
  const guide = useSettings((s) => s.guide)
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [vh, setVh] = useState(() => window.innerHeight)
  const [dock, setDock] = useState<number | null>(null)
  const card = useRef<HTMLDivElement>(null)
  const [cardH, setCardH] = useState(CARD_EST)
  const step = steps[i]
  const last = i === steps.length - 1

  /** 照らす場所を測る。値が変わったときだけ更新する（毎フレーム呼んでも再描画が増えない） */
  const measure = useCallback(() => {
    const h = window.innerHeight
    setVh((v) => (v === h ? v : h))
    const d = dockOffset(h)
    setDock((v) => (v === d ? v : d))
    const ch = card.current?.offsetHeight
    if (ch) setCardH((v) => (Math.abs(v - ch) < 1 ? v : ch))
    const el = findTarget(step?.target)
    if (!el) return setRect((v) => (v === null ? v : null))
    const r = el.getBoundingClientRect()
    const next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 }
    setRect((v) =>
      v && Math.abs(v.top - next.top) < 0.5 && Math.abs(v.left - next.left) < 0.5 && Math.abs(v.width - next.width) < 0.5 && Math.abs(v.height - next.height) < 0.5
        ? v
        : next,
    )
  }, [step])

  useLayoutEffect(() => {
    const el = findTarget(step?.target)
    // タブバーなど固定の場所は送らない。それ以外は、カードより上（画面の上のほう）に入るよう送ってから測る
    if (el && !el.closest('nav')) {
      const r = el.getBoundingClientRect()
      const limit = window.innerHeight - (dockOffset(window.innerHeight) ?? 40) - CARD_EST
      if (r.top < 70 || r.bottom > limit) window.scrollBy({ top: r.top - 80, behavior: 'smooth' })
    }
    measure()
  }, [step, measure])

  // スクロール中・見出しが縮むとき・あとから内容が読み込まれて位置が変わるときも、照らす場所がずれないよう毎フレーム測り直す
  useEffect(() => {
    let id = 0
    const loop = () => {
      measure()
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [measure])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDone()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  if (!step) return null
  // 説明カードは、どのステップでも下端の位置をそろえる（ボタンが同じ場所に来る）
  const bottom = dock === null ? 40 : Math.min(dock, vh - 200)
  // ページの終わりに近くて画面を送れず、照らす場所がカードに隠れるときだけ、カードを画面の上に置く
  const cardBottom = vh - bottom
  const covered = !!rect && rect.top < cardBottom && rect.top + rect.height > cardBottom - cardH - 8
  const cardStyle = covered
    ? { top: 'calc(env(safe-area-inset-top) + 12px)' }
    : { bottom: dock === null ? 'calc(env(safe-area-inset-bottom) + 16px)' : bottom }

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="使い方ガイド">
      {/* 下の画面を操作できないようにする（暗幕） */}
      <div className={cx('absolute inset-0', !rect && 'bg-black/55')} />
      {rect && (
        <div
          className="pointer-events-none absolute rounded-[18px]"
          style={{ ...rect, boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.55), 0 0 0 2px rgb(255 255 255 / 0.9)' }}
        />
      )}
      <div
        key={i}
        ref={card}
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
    body: 'Eliza Patina（イライザ・パティーナ）は、単語・リスニング・発音・会話・翻訳をひとつで練習できるアプリです。話すほど、使うほど、あなたの英語に味が出ます。主な場所を順番に見ていきましょう。',
  },
  {
    target: 'mode',
    title: 'モードの切り替え',
    body: '一般・ビジネス・IT・鉄道をタップすると、そのモードだけに切り替わります（塗りつぶしがいまのモード）。「すべて」で全コース、「組み合わせる」で好きなコースを足したり外したりできます。色とチェックがついたコースが出題に含まれます。',
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
    body: '全単語を検索できます。「苦手」「保存した単語」だけを集めて練習することもできます。',
  },
  {
    target: 'tab-practice',
    title: '練習',
    body: 'リスニング・聞き分け・ディクテーション・瞬間英作文・発音チェック・シャドーイング・耳で復習。家事や身支度のあいだは、時間を決めて流しっぱなしにできる「ながら練習」も。覚えた単語を使える英語にします。',
  },
  {
    target: 'tab-scenes',
    title: 'シーン会話',
    body: '自己紹介・カフェ・会議・電話・障害報告など、場面ごとの会話を聞いて、ロールプレイで話してみましょう。',
  },
  {
    target: 'tab-translate',
    title: '翻訳と同時通訳',
    body: '入力しながら・話しながら訳せます。「同時通訳」では、話しているそばから訳が流れ、対面の会話モードもあります。',
  },
  {
    target: 'settings',
    title: '設定',
    body: '読み上げの発音（アメリカ・イギリス・オーストラリア・インドなど）と声、高音質の声の入れ方、速度、効果音、1日の目安、データのバックアップはここから。',
  },
  {
    title: '声を高音質にするには',
    body: '通信できるときは高品質音声で読みます。通信できないときのために、iPhone の「設定 → アクセシビリティ → リーダーと読み上げ → 声 → 英語 → 声」で「プレミアム」か「拡張」の声をダウンロードしておくと安心です（日本語の声も同じように「声 → 日本語 → 声」で）。くわしい手順と、いまの声の状態は、このアプリの設定の「音声」にあります。',
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
    title: '専門用語のチェック（鉄道）',
    body: '鉄道（保線）のモードを選んでいると、文章に保線用語があれば、英国・米国の言い方と JIS の日本語を並べて表示します。オフラインでも使えます。',
  },
]
