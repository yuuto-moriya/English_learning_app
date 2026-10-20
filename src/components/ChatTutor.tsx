import { useState, type ReactNode } from 'react'
import { Eye, GraduationCap, Loader2 } from 'lucide-react'
import { SpeakButton, cx } from './ui'
import { ApiError, explainMine, explainReply, type ChatTurn, type MineFeedback, type ReplyExplanation } from '@/lib/api'
import type { Accent } from '@/lib/tts'

/** AI と会話の「先生」役の部品。相手の英語の解説・自分の英語の詳しい評価を、押したときだけ読み込む（無料枠を使いすぎない） */

type Base = { level: string; scene: string; context: ChatTurn[] }

function useLoad<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async () => {
    if (busy || data) return
    setBusy(true)
    setError(null)
    try {
      setData(await load())
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '先生に接続できませんでした')
    } finally {
      setBusy(false)
    }
  }
  return { data, busy, error, run }
}

function Line({ en, accent }: { en: string; accent: Accent }) {
  return (
    <div className="flex items-start gap-2">
      <p className="en min-w-0 flex-1 text-[15.5px] leading-snug">{en}</p>
      <SpeakButton text={en} accent={accent} size="sm" />
    </div>
  )
}

function Label({ children }: { children: ReactNode }) {
  return <p className="text-[11.5px] font-semibold text-muted">{children}</p>
}

/** 訳は、意味を自分で考えてから開く（すぐ答えを見るより身につきやすい） */
function Translation({ ja }: { ja: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Label>訳</Label>
      {open ? (
        <p className="text-[13.5px] leading-relaxed">{ja}</p>
      ) : (
        <button onClick={() => setOpen(true)} className="flex min-h-8 items-center gap-1 text-[12.5px] font-semibold text-brand">
          <Eye className="h-3.5 w-3.5" strokeWidth={2} />
          意味を考えてから、訳を見る
        </button>
      )}
    </div>
  )
}

/** 相手の英語の解説：訳・大事な表現・ポイント・返し方の例 */
export function ReplyExplain({ text, base, accent }: { text: string; base: Base; accent: Accent }) {
  const [open, setOpen] = useState(false)
  const { data, busy, error, run } = useLoad<ReplyExplanation>(() => explainReply(text, base))
  if (!open)
    return (
      <button
        onClick={() => {
          setOpen(true)
          void run()
        }}
        className="flex min-h-8 items-center gap-1 rounded-full px-2 text-[12px] font-semibold text-muted active:bg-surface-2"
      >
        <GraduationCap className="h-4 w-4" strokeWidth={1.8} />
        解説
      </button>
    )
  return (
    <div className="mt-2 w-full space-y-2.5 rounded-[12px] bg-surface-2 p-3" aria-live="polite">
      {busy && (
        <p className="flex items-center gap-2 text-[12.5px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          先生が解説を書いています…
        </p>
      )}
      {error && <p className="text-[12.5px] text-ng">{error}</p>}
      {data && (
        <>
          {data.ja && <Translation ja={data.ja} />}
          {data.phrases.length > 0 && (
            <div>
              <Label>大事な表現</Label>
              <ul className="mt-0.5 space-y-1">
                {data.phrases.map((p) => (
                  <li key={p.en} className="text-[13.5px] leading-snug">
                    <span className="en font-semibold">{p.en}</span>
                    <span className="text-muted"> … {p.ja}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.point && (
            <div>
              <Label>ポイント</Label>
              <p className="text-[13px] leading-relaxed">{data.point}</p>
            </div>
          )}
          {data.answers.length > 0 && (
            <div className="space-y-1">
              <Label>こう返せます</Label>
              {data.answers.map((a) => (
                <Line key={a} en={a} accent={accent} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/** 自分の英語の詳しい評価：よかった点・直し・理由・くだけた言い方・ていねいな言い方 */
export function MineExplain({ text, base, accent, className }: { text: string; base: Base; accent: Accent; className?: string }) {
  const [open, setOpen] = useState(false)
  const { data, busy, error, run } = useLoad<MineFeedback>(() => explainMine(text, base))
  if (!open)
    return (
      <button
        onClick={() => {
          setOpen(true)
          void run()
        }}
        className={cx('flex min-h-8 items-center gap-1 rounded-full px-2 text-[12px] font-semibold text-muted active:bg-surface-2', className)}
      >
        <GraduationCap className="h-3.5 w-3.5" strokeWidth={2} />
        詳しく
      </button>
    )
  return (
    <div className="mt-1.5 w-full space-y-2 rounded-[14px] border border-line bg-surface p-3" aria-live="polite">
      {busy && (
        <p className="flex items-center gap-2 text-[12.5px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          先生が見ています…
        </p>
      )}
      {error && <p className="text-[12.5px] text-ng">{error}</p>}
      {data && (
        <>
          {data.good && (
            <div>
              <Label>よかったところ</Label>
              <p className="text-[13px] leading-relaxed">{data.good}</p>
            </div>
          )}
          {data.fix && (
            <div>
              <Label>直すと</Label>
              <Line en={data.fix} accent={accent} />
              {data.why && <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{data.why}</p>}
            </div>
          )}
          {data.casual && (
            <div>
              <Label>くだけた言い方</Label>
              <Line en={data.casual} accent={accent} />
            </div>
          )}
          {data.polite && (
            <div>
              <Label>ていねいな言い方</Label>
              <Line en={data.polite} accent={accent} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
