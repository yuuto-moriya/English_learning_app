import { useEffect, type ReactNode } from 'react'
import { Check, Gauge, Snail, Volume2, X } from 'lucide-react'
import { play as playCue } from '@/lib/sounds'
import { enterSession } from '@/lib/routes'
import { TIER_LABEL, type Tier } from '@/lib/distractors'
import { BottomBar, Button, Card, ProgressBar, cx } from './ui'

/**
 * 練習の1回分（ラウンド）で共通に使う部品。どの練習でも同じ見た目・同じ言葉にそろえる。
 * - 左上の × で「やめる」、上に進み具合（バーと「3/10」）
 * - 大きな黒い丸（スピーカー）で聞く、「ゆっくり」はカタツムリ（0.6倍）
 * - 回答後は下のバーに「正解／不正解」と「次へ」
 * - 最後は結果のカード（大きな数字と「10問中8問正解」）
 */

/** 「ゆっくり」の速さ（すべての画面で同じ） */
export const SLOW_RATE = 0.6

export function SessionShell({
  children,
  onClose,
  progress,
  label,
}: {
  children: ReactNode
  onClose: () => void
  progress?: { value: number; max: number }
  /** 進み具合の数字の代わりに出す文字（時間で区切る練習の残り時間など） */
  label?: ReactNode
}) {
  // 練習の最中はタブバーを隠す（単語学習と同じ集中モード）
  useEffect(() => enterSession(), [])
  return (
    <div className="px-4">
      {/* pt-safe はスクロールしても固定されるヘッダー側に付け、ステータスバー／Dynamic Island の下に潜らないようにする */}
      <div className="glass sticky top-0 z-10 -mx-4 px-4 pt-safe">
        <div className="flex h-14 items-center gap-3">
          <button
            onClick={onClose}
            aria-label="やめる"
            className="-ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-2"
          >
            <X className="h-[22px] w-[22px]" strokeWidth={1.9} />
          </button>
          {progress && <ProgressBar value={progress.value} max={progress.max} className="h-[5px] flex-1" />}
          {progress && (
            <span className="min-w-12 text-right text-[12px] font-medium tabular-nums text-muted">
              {label ?? `${Math.min(progress.value + 1, progress.max)} / ${progress.max}`}
            </span>
          )}
        </div>
      </div>
      <div className="pt-3">{children}</div>
    </div>
  )
}

/** 聞き取りの問題の大きな再生ボタン */
export function ListenButton({ onClick, label = 'もう一度聞く' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-[84px] w-[84px] items-center justify-center rounded-full bg-ink text-bg transition active:scale-95"
    >
      <Volume2 className="h-9 w-9" strokeWidth={1.8} />
    </button>
  )
}

/** ゆっくり聞く（文字つき） */
export function SlowButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Snail className="h-4 w-4" strokeWidth={1.8} />
      ゆっくり
    </Button>
  )
}

/** 選択肢の難しさ（似た選択肢の多さ）。レベルと覚え具合で自動で変わる */
export function TierBadge({ tier }: { tier: Tier }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-medium text-muted" title="選択肢の難しさ（レベルと覚え具合で自動調整）">
      <Gauge className="h-3.5 w-3.5" strokeWidth={1.9} />
      {TIER_LABEL[tier]}
    </span>
  )
}

/** 選択肢。回答後は正解を緑、選んだまちがいを赤、ほかを薄く表示する */
export function ChoiceButton({
  index,
  state,
  disabled,
  onClick,
  children,
}: {
  /** 1〜4 の番号（省略すると出さない） */
  index?: number
  /** selected は正誤を出さない選択（レベル診断など） */
  state: 'idle' | 'selected' | 'correct' | 'wrong' | 'dim'
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      data-choice
      disabled={disabled}
      onClick={onClick}
      className={cx(
        'flex min-h-[54px] w-full items-center gap-3 rounded-[14px] border px-4 py-3 text-left text-[15px] leading-snug transition duration-150 active:scale-[0.99]',
        state === 'correct'
          ? 'border-ok bg-ok-soft'
          : state === 'wrong'
            ? 'animate-shake border-ng bg-ng-soft'
            : state === 'dim'
              ? 'border-line bg-surface opacity-50'
              : state === 'selected'
                ? 'border-ink bg-surface'
                : 'border-line bg-surface',
      )}
    >
      {index !== undefined && <span className="w-4 shrink-0 text-[12px] font-medium tabular-nums text-faint">{index}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {state === 'correct' && <Check className="h-4 w-4 shrink-0 text-ok" strokeWidth={2.6} />}
      {state === 'wrong' && <X className="h-4 w-4 shrink-0 text-ng" strokeWidth={2.6} />}
    </button>
  )
}

/** 選択肢の状態（回答前は idle） */
export function choiceState(answered: boolean, isAnswer: boolean, isPicked: boolean): 'idle' | 'correct' | 'wrong' | 'dim' {
  if (!answered) return 'idle'
  if (isAnswer) return 'correct'
  return isPicked ? 'wrong' : 'dim'
}

/** 正解・不正解の表示（丸いバッジ＋文字）。aside は右端に添える情報 */
export function Verdict({ ok, label, aside }: { ok: boolean; label?: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className={cx('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white', ok ? 'bg-ok' : 'bg-ng')}>
        {ok ? <Check className="h-4 w-4" strokeWidth={3} /> : <X className="h-4 w-4" strokeWidth={3} />}
      </span>
      <span className={cx('min-w-0 text-[17px] font-bold', ok ? 'text-ok' : 'text-ng')}>{label ?? (ok ? '正解' : '不正解')}</span>
      {aside && <span className="ml-auto flex shrink-0 items-center gap-2 text-[12px] text-muted">{aside}</span>}
    </div>
  )
}

/** 回答後に画面下に出すバー（正解・不正解と「次へ」） */
export function FeedbackBar({
  ok,
  label,
  aside,
  children,
  last,
  onNext,
}: {
  ok: boolean
  label?: ReactNode
  aside?: ReactNode
  children?: ReactNode
  /** 最後の問題なら「結果を見る」 */
  last?: boolean
  onNext: () => void
}) {
  return (
    <BottomBar tone={ok ? 'ok' : 'ng'}>
      <Verdict ok={ok} label={label} aside={aside} />
      {children}
      <Button block size="lg" variant="ink" onClick={onNext}>
        {last ? '結果を見る' : '次へ'}
      </Button>
    </BottomBar>
  )
}

/** 「10問中8問正解」 */
export const scoreCaption = (correct: number, total: number) => `${total}問中${correct}問正解`

/** 1回分の結果（大きな数字）。表示したときに終わりの効果音を鳴らす */
export function ResultCard({ value, unit = '%', caption, children }: { value: number; unit?: string; caption: ReactNode; children?: ReactNode }) {
  useEffect(() => playCue('complete'), [])
  return (
    <Card>
      <p className="text-[44px] font-semibold leading-none tracking-tight tabular-nums">
        {value}
        <span className="text-[18px] font-medium text-muted">{unit}</span>
      </p>
      <p className="mt-2 text-[13px] text-muted">{caption}</p>
      {children && <div className="mt-4 border-t border-line pt-3">{children}</div>}
    </Card>
  )
}
