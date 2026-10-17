import { useEffect, useState } from 'react'
import { Check, Volume2 } from 'lucide-react'
import { ACCENTS, NEURAL_VOICES, type Accent } from '@/lib/accents'
import { useSettings } from '@/lib/settings'
import { listVoices, speak, voiceQuality, voicesFor, warmUpSpeech } from '@/lib/tts'
import { Tag, cx } from './ui'

const SAMPLE = 'Nice to meet you. Shall we practice some English together today?'

const labelOfLang = (lang: string) => ACCENTS.find((a) => a.id.toLowerCase() === lang.replace('_', '-').toLowerCase())?.label ?? lang

/** 端末の声の一覧（声の読み込みが遅れる端末があるので、変化を待って取り直す） */
function useDeviceVoices() {
  const [n, setN] = useState(0)
  useEffect(() => {
    const bump = () => setN((x) => x + 1)
    const t = setTimeout(bump, 800)
    window.speechSynthesis?.addEventListener?.('voiceschanged', bump)
    return () => {
      clearTimeout(t)
      window.speechSynthesis?.removeEventListener?.('voiceschanged', bump)
    }
  }, [])
  return n
}

/**
 * 英語の発音（国・地域）と声の選択。iPhone の「読み上げコンテンツ → 声 → 英語」のように国ごとに選べる。
 * neural = 高品質音声（Azure）を使うとき。使わないときは端末に入っている声から選ぶ。
 */
export function AccentPicker({ neural }: { neural: boolean }) {
  const s = useSettings()
  useDeviceVoices()
  const [open, setOpen] = useState<Accent>(s.accent)

  const preview = (a: Accent, voice?: string) => {
    warmUpSpeech()
    if (voice) {
      // 声を選んだらその声で試聴する
      if (neural) s.set({ neural: { ...s.neural, [a]: voice } })
      else s.set({ deviceVoice: { ...s.deviceVoice, [a]: voice } })
    }
    void speak(SAMPLE, { accent: a })
  }

  return (
    <div>
      <p className="text-[15px]">英語の発音（国・地域）</p>
      <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">一般会話・ビジネス・IT の読み上げに使います。タップして声を選び、試聴できます。</p>
      <div className="mt-2.5 overflow-hidden rounded-[14px] border border-line">
        {ACCENTS.map((a, k) => {
          const on = s.accent === a.id
          const expanded = open === a.id
          const device = listVoices(a.id)
          const near = device.length ? null : voicesFor(a.id)[0]
          return (
            <div key={a.id} className={cx(k > 0 && 'hairline-t')}>
              <div className="flex items-center">
                <button
                  aria-pressed={on}
                  onClick={() => {
                    s.set({ accent: a.id })
                    setOpen(a.id)
                  }}
                  className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 py-2 pl-3.5 text-left"
                >
                  <span
                    className={cx(
                      'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
                      on ? 'border-ink bg-ink text-bg' : 'border-line-strong',
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[15px] font-medium">
                      {a.label}
                      <Tag>{a.short}</Tag>
                    </span>
                    <span className="block text-[11.5px] leading-snug text-muted">{a.note}</span>
                  </span>
                </button>
                <button
                  aria-label={`${a.label}の発音を試聴`}
                  onClick={() => preview(a.id)}
                  className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted active:bg-surface-2"
                >
                  <Volume2 className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </button>
              </div>
              {expanded && (
                <div className="animate-fade-in px-3.5 pb-3 pl-[46px]">
                  {neural ? (
                    <div className="flex flex-wrap gap-1.5">
                      {NEURAL_VOICES[a.id].map((v) => {
                        const sel = (s.neural[a.id] ?? NEURAL_VOICES[a.id][0].id) === v.id
                        return (
                          <button
                            key={v.id}
                            aria-pressed={sel}
                            onClick={() => preview(a.id, v.id)}
                            className={cx(
                              'min-h-9 rounded-full border px-3 text-[13px] transition active:scale-95',
                              sel ? 'border-ink bg-ink text-bg' : 'border-line-strong text-ink',
                            )}
                          >
                            {v.name}
                            <span className="ml-1 opacity-60">{v.gender === 'F' ? '女性' : '男性'}</span>
                          </button>
                        )
                      })}
                    </div>
                  ) : device.length ? (
                    <div className="flex flex-wrap gap-1.5">
                      {device.slice(0, 8).map((v) => {
                        const sel = (s.deviceVoice[a.id] || device[0].name) === v.name
                        return (
                          <button
                            key={v.name}
                            aria-pressed={sel}
                            onClick={() => preview(a.id, v.name)}
                            className={cx(
                              'min-h-9 rounded-full border px-3 text-[13px] transition active:scale-95',
                              sel ? 'border-ink bg-ink text-bg' : 'border-line-strong text-ink',
                            )}
                          >
                            {v.name.replace(/\s*\(.*\)$/, '')}
                            {voiceQuality(v) >= 85 && <span className="ml-1 opacity-60">高品質</span>}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-[12px] leading-relaxed text-muted">
                      この端末には{a.label}英語の声がありません。
                      {near ? `近い発音（${labelOfLang(near.lang)}）の声で読みます。` : ''}
                      上の「iPhone で高音質の声を入れる方法」で追加できます。
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {s.studyCats.rail && (
        <div className="mt-4">
          <p className="text-[15px]">鉄道（保線）の発音</p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">保線用語は EN 規格（英国表記）が基本なので、はじめはイギリスです。</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                aria-pressed={s.railAccent === a.id}
                onClick={() => s.set({ railAccent: a.id })}
                className={cx(
                  'min-h-9 rounded-full border px-3 text-[13px] transition active:scale-95',
                  s.railAccent === a.id ? 'border-ink bg-ink text-bg' : 'border-line-strong text-ink',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
