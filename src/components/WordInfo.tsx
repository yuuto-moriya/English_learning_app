import { Snail } from 'lucide-react'
import type { Word } from '@/lib/types'
import { RAIL_SUBS } from '@/lib/types'
import { speak, type Accent } from '@/lib/tts'
import { CategoryBadge, LevelBadge, Marked, SpeakButton, Tag } from './ui'
import { accentFor } from '@/lib/settings'
import { SLOW_RATE } from './Session'

export const POS_JA: Record<string, string> = {
  n: '名詞',
  v: '動詞',
  adj: '形容詞',
  adv: '副詞',
  prep: '前置詞',
  conj: '接続詞',
  pron: '代名詞',
  det: '限定詞',
  aux: '助動詞',
  int: '間投詞',
  num: '数詞',
}

function SlowButton({ text, accent }: { text: string; accent: Accent }) {
  return (
    <button
      aria-label="ゆっくり"
      // iOSではタップ処理の中で同期的に speak() しないと再生されないことがあるため、動的importは使わない
      onClick={(e) => {
        e.stopPropagation()
        speak(text, { accent, rate: SLOW_RATE })
      }}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface text-ink transition active:scale-90"
    >
      <Snail className="h-[18px] w-[18px]" strokeWidth={1.9} />
    </button>
  )
}

/** 見出し語・発音記号・音声（英米） */
export function WordHead({ word, big }: { word: Word; big?: boolean }) {
  const isRail = word.cat === 'rail'
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <CategoryBadge cat={word.cat} />
        <LevelBadge lv={word.lv} />
        {word.sub && <span className="text-[12px] text-muted">{RAIL_SUBS[word.sub]}</span>}
        {!isRail && <span className="text-[12px] text-muted">{POS_JA[word.pos] ?? word.pos}</span>}
      </div>
      {isRail ? (
        <div className="mt-3 space-y-3">
          <PronRow tag="英・EN" term={word.w} ipa={word.ipaUk} accent="en-GB" big={big} />
          {word.us ? (
            <PronRow tag="米" term={word.us} ipa={word.ipa} accent="en-US" />
          ) : (
            word.ipa && <PronRow tag="米" term={word.w} ipa={word.ipa} accent="en-US" sameTerm />
          )}
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className={big ? 'en text-[42px] font-medium leading-[1.05] tracking-tight' : 'en text-[30px] font-medium leading-tight'}>{word.w}</p>
            {word.ipa && <p className="ipa mt-1.5 text-[15px] text-muted">/{word.ipa}/</p>}
          </div>
          <SpeakButton text={word.w} accent={accentFor(word.cat)} size={big ? 'lg' : 'md'} />
          <SlowButton text={word.w} accent={accentFor(word.cat)} />
        </div>
      )}
    </div>
  )
}

function PronRow({
  tag,
  term,
  ipa,
  accent,
  big,
  sameTerm,
}: {
  tag: string
  term: string
  ipa?: string
  accent: Accent
  big?: boolean
  sameTerm?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5">
          <Tag>{tag}</Tag>
          {sameTerm && <span className="text-[11.5px] text-muted">同じつづり</span>}
        </p>
        {!sameTerm && <p className={big ? 'en mt-1 text-[34px] font-medium leading-[1.1] tracking-tight' : 'en mt-1 text-[24px] font-medium leading-tight'}>{term}</p>}
        {ipa && <p className="ipa mt-1 text-[14px] text-muted">/{ipa}/</p>}
      </div>
      <SpeakButton text={term} accent={accent} />
      <SlowButton text={term} accent={accent} />
    </div>
  )
}

/** 意味・例文・解説 */
export function WordBody({ word, hideMeaning }: { word: Word; hideMeaning?: boolean }) {
  return (
    <div className="space-y-5">
      {!hideMeaning && (
        <div>
          <p className="text-[20px] font-semibold leading-snug">{word.ja}</p>
          {word.jis && <p className="mt-1 text-[12.5px] text-muted">JIS 用語：{word.jis}</p>}
        </div>
      )}
      {word.ex.map((e, i) => (
        <div key={i} className="border-l-2 border-line-strong pl-3.5">
          <div className="flex items-start gap-2">
            <p className="en flex-1 text-[18px] leading-[1.45]">
              <Marked text={e.en} />
            </p>
            <SpeakButton text={e.en} accent={accentFor(word.cat)} size="sm" />
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{e.ja}</p>
        </div>
      ))}
      {word.note && (
        <div>
          <p className="text-[12px] font-semibold text-muted">解説</p>
          <p className="mt-1 text-[14px] leading-relaxed">{word.note}</p>
        </div>
      )}
      {word.refs && word.refs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {word.refs.map((r) => (
            <span key={r} className="rounded-md border border-line px-2 py-0.5 text-[11px] text-muted">
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
