import { Link } from 'react-router'
import { Snail } from 'lucide-react'
import type { Word } from '@/lib/types'
import { RAIL_SUBS } from '@/lib/types'
import { speak } from '@/lib/tts'
import { CategoryBadge, LevelBadge, Marked, SpeakButton } from './ui'

const POS_JA: Record<string, string> = {
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

/** 見出し語・発音記号・音声（英米） */
export function WordHead({ word, big }: { word: Word; big?: boolean }) {
  const isRail = word.cat === 'rail'
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        <CategoryBadge cat={word.cat} />
        <LevelBadge lv={word.lv} />
        {word.sub && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">{RAIL_SUBS[word.sub]}</span>}
        {!isRail && <span className="text-[11px] text-muted">{POS_JA[word.pos] ?? word.pos}</span>}
      </div>
      {isRail ? (
        <div className="mt-2 space-y-2">
          <PronRow flag="🇬🇧" tag="英/EN" term={word.w} ipa={word.ipaUk} accent="en-GB" big={big} />
          {word.us ? (
            <PronRow flag="🇺🇸" tag="米" term={word.us} ipa={word.ipa} accent="en-US" big={false} />
          ) : (
            word.ipa && <PronRow flag="🇺🇸" tag="米" term={word.w} ipa={word.ipa} accent="en-US" big={false} sameTerm />
          )}
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className={big ? 'text-[34px] font-extrabold leading-tight tracking-tight' : 'text-2xl font-extrabold'}>{word.w}</p>
            {word.ipa && <p className="ipa text-[15px] text-muted">/{word.ipa}/</p>}
          </div>
          <SpeakButton text={word.w} size="lg" />
          <SpeakButton text={word.w} rate={0.6} label="ゆっくり" />
        </div>
      )}
    </div>
  )
}

function PronRow({
  flag,
  tag,
  term,
  ipa,
  accent,
  big,
  sameTerm,
}: {
  flag: string
  tag: string
  term: string
  ipa?: string
  accent: 'en-US' | 'en-GB'
  big?: boolean
  sameTerm?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold text-muted">
          {flag} {tag}
          {sameTerm && '（同じ表記）'}
        </p>
        {!sameTerm && <p className={big ? 'text-[28px] font-extrabold leading-tight' : 'text-xl font-bold'}>{term}</p>}
        {ipa && <p className="ipa text-[14px] text-muted">/{ipa}/</p>}
      </div>
      <SpeakButton text={term} accent={accent} />
      <button
        aria-label="ゆっくり再生"
        // iOSではタップ処理の中で同期的に speak() しないと再生されないことがあるため、動的importは使わない
        onClick={() => speak(term, { accent, rate: 0.6 })}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-muted transition active:scale-90"
      >
        <Snail className="h-4 w-4" />
      </button>
    </div>
  )
}

/** 意味・例文・解説 */
export function WordBody({ word, hideMeaning }: { word: Word; hideMeaning?: boolean }) {
  return (
    <div className="space-y-4">
      {!hideMeaning && (
        <div>
          <p className="text-[12px] font-bold text-muted">意味</p>
          <p className="mt-0.5 text-[18px] font-bold leading-snug">{word.ja}</p>
          {word.jis && <p className="mt-1 text-xs text-muted">JIS用語：{word.jis}</p>}
        </div>
      )}
      {word.ex.map((e, i) => (
        <div key={i} className="rounded-2xl bg-surface-2 p-3.5">
          <div className="flex items-start gap-2">
            <p className="flex-1 text-[16px] leading-relaxed">
              <Marked text={e.en} />
            </p>
            <SpeakButton text={e.en} accent={word.cat === 'rail' ? 'en-GB' : 'en-US'} size="sm" />
          </div>
          <p className="mt-1 text-[13px] text-muted">{e.ja}</p>
        </div>
      ))}
      {word.note && (
        <div>
          <p className="text-[12px] font-bold text-muted">解説</p>
          <p className="mt-0.5 text-[14px] leading-relaxed">{word.note}</p>
        </div>
      )}
      {word.refs && word.refs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {word.refs.map((r) => (
            <span key={r} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold text-muted">
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function WordLink({ word }: { word: Word }) {
  return (
    <Link to={`/words/${word.id}`} className="text-sm font-semibold text-brand">
      詳しく見る
    </Link>
  )
}
