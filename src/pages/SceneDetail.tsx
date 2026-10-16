import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useParams } from 'react-router'
import { Lightbulb, Pause, Play, SkipForward, Target } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { SpeakCheck } from '@/components/SpeakCheck'
import { Button, Card, Empty, Segmented, SectionTitle, SpeakButton, Toggle, cx } from '@/components/ui'
import { getScene, sceneAccent } from '@/data/scenes'
import { prefetchSpeech, speak, stopSpeaking, warmUpSpeech, type Accent, type VoiceRole } from '@/lib/tts'
import { speakingMessage, type GuideLine } from '@/lib/guide'
import type { Scene } from '@/lib/types'

/** 話者ごとの声。英米の音声を分けて両方の発音に触れられるようにし、高品質音声では話者の性別も変える */
function voiceFor(scene: Scene, sp: string): { accent: Accent; voice: VoiceRole } {
  const base: Accent = sceneAccent(scene)
  const other: Accent = base === 'en-US' ? 'en-GB' : 'en-US'
  const first = sp === scene.roles[0].id
  return { accent: first ? base : other, voice: first ? 'main' : 'alt' }
}

export default function SceneDetail() {
  const { id } = useParams()
  const scene = id ? getScene(id) : undefined
  const [mode, setMode] = useState<'listen' | 'role'>('listen')
  const [showJa, setShowJa] = useState(true)
  const [playing, setPlaying] = useState<number | null>(null)
  /** 通し再生の世代番号。停止・アンマウント・新しい再生で増やし、古いループを止める */
  const runId = useRef(0)

  useEffect(() => {
    if (scene) prefetchSpeech(scene.lines.map((l) => ({ text: l.en, ...voiceFor(scene, l.sp) })))
    return () => {
      runId.current++
      stopSpeaking()
    }
  }, [scene])

  if (!scene)
    return (
      <div>
        <PageHeader title="シーン会話" back="/scenes" />
        <div className="px-4">
          <Empty>シーンが見つかりません</Empty>
        </div>
      </div>
    )

  const playAll = async () => {
    warmUpSpeech()
    const run = ++runId.current
    for (let i = 0; i < scene.lines.length; i++) {
      setPlaying(i)
      const ok = await speak(scene.lines[i].en, voiceFor(scene, scene.lines[i].sp))
      if (!ok || runId.current !== run) break
      await new Promise((r) => setTimeout(r, 350))
      if (runId.current !== run) break
    }
    if (runId.current === run) setPlaying(null)
  }
  const stopAll = () => {
    runId.current++
    stopSpeaking()
    setPlaying(null)
  }
  /** 通し再生中に個別の読み上げボタンが押されたら、通し再生を止めてからその文を再生する */
  const interruptPlayAll = (e: MouseEvent) => {
    if (playing !== null && (e.target as Element).closest('button')) stopAll()
  }
  const roleName = (sp: string) => scene.roles.find((r) => r.id === sp)?.name ?? sp
  const phraseVoice = voiceFor(scene, scene.roles[0].id)

  return (
    <div>
      <PageHeader title={scene.title} back="/scenes" />
      <div className="px-4 pb-10">
        <p className="en -mt-3 px-1 text-[17px] italic text-muted">{scene.titleEn}</p>
        <Card className="mt-4 flex items-start gap-3">
          <Target className="mt-0.5 h-5 w-5 shrink-0 text-brand" strokeWidth={1.8} />
          <div>
            <p className="text-[12px] font-medium text-muted">この場面のゴール</p>
            <p className="mt-0.5 text-[15px] font-medium leading-snug">{scene.goal}</p>
          </div>
        </Card>

        <SectionTitle>キーフレーズ</SectionTitle>
        <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
          {scene.phrases.map((p, i) => (
            <div key={i} className={cx('flex items-start gap-3 py-3 pl-4 pr-3', i > 0 && 'hairline-t')} onClickCapture={interruptPlayAll}>
              <div className="min-w-0 flex-1">
                <p className="en text-[18px] leading-snug">{p.en}</p>
                <p className="mt-0.5 text-[13px] text-muted">{p.ja}</p>
                {p.note && <p className="mt-1 text-[12px] leading-snug text-muted">― {p.note}</p>}
              </div>
              <SpeakButton text={p.en} {...phraseVoice} size="sm" />
            </div>
          ))}
        </div>

        <SectionTitle>会話</SectionTitle>
        <Segmented
          value={mode}
          onChange={(m) => {
            stopAll()
            setMode(m)
          }}
          options={[
            { value: 'listen', label: '聞いて理解' },
            { value: 'role', label: 'ロールプレイ' },
          ]}
        />

        {mode === 'listen' ? (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              {playing === null ? (
                <Button variant="ink" className="flex-1" onClick={playAll}>
                  <Play className="h-4 w-4 fill-current" />
                  会話を通して聞く
                </Button>
              ) : (
                <Button variant="outline" className="flex-1" onClick={stopAll}>
                  <Pause className="h-4 w-4 fill-current" />
                  停止
                </Button>
              )}
            </div>
            <Toggle label="和訳を表示" checked={showJa} onChange={setShowJa} />
            <div className="space-y-2.5" onClickCapture={interruptPlayAll}>
              {scene.lines.map((l, i) => {
                const mine = l.sp === scene.roles[scene.roles.length - 1].id
                return (
                  <div key={i} className={cx('flex items-end gap-2', mine && 'flex-row-reverse')}>
                    <div
                      className={cx(
                        'max-w-[84%] rounded-[18px] px-3.5 py-2.5 transition-shadow',
                        mine ? 'rounded-br-[6px] bg-brand-soft' : 'rounded-bl-[6px] bg-surface-2',
                        playing === i && 'shadow-[0_0_0_2px_var(--brand)]',
                      )}
                    >
                      <p className="text-[11px] font-semibold text-muted">{roleName(l.sp)}</p>
                      <p className="en mt-0.5 text-[17px] leading-snug">{l.en}</p>
                      {showJa && <p className="mt-1 text-[12.5px] leading-snug text-muted">{l.ja}</p>}
                    </div>
                    <SpeakButton text={l.en} {...voiceFor(scene, l.sp)} size="sm" />
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <RolePlay scene={scene} />
          </div>
        )}

        {scene.tip && (
          <div className="mt-6 flex gap-3 rounded-[18px] bg-surface-2 p-4">
            <Lightbulb className="h-5 w-5 shrink-0 text-warn" strokeWidth={1.8} />
            <p className="text-[13.5px] leading-relaxed">{scene.tip}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function RolePlay({ scene }: { scene: Scene }) {
  const [role, setRole] = useState(scene.roles[scene.roles.length - 1].id)
  const [i, setI] = useState(-1)
  const [hint, setHint] = useState(false)
  const [guide, setGuide] = useState<GuideLine | null>(null)
  /** 相手のセリフの再生に失敗・中断された行（自動で進まないので手動操作を出す） */
  const [stalledAt, setStalledAt] = useState<number | null>(null)
  const playRun = useRef(0)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const line = scene.lines[i]
  const mine = line?.sp === role

  /** 相手のセリフを再生し、最後まで読めたときだけ次へ進む */
  const playPartner = (idx: number) => {
    const l = scene.lines[idx]
    if (!l) return
    const run = ++playRun.current
    clearTimeout(advanceTimer.current)
    speak(l.en, voiceFor(scene, l.sp)).then((ok) => {
      if (playRun.current !== run) return
      if (!ok) {
        setStalledAt(idx)
        return
      }
      advanceTimer.current = setTimeout(() => {
        if (playRun.current === run) setI((x) => (x === idx ? x + 1 : x))
      }, 400)
    })
  }

  useEffect(() => {
    if (!line || mine) return
    playPartner(i)
    return () => {
      playRun.current++
      clearTimeout(advanceTimer.current)
    }
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  if (i < 0)
    return (
      <Card className="space-y-4">
        <p className="text-[13px] font-medium text-muted">あなたの役</p>
        <Segmented value={role} onChange={setRole} options={scene.roles.map((r) => ({ value: r.id, label: r.name }))} />
        <p className="text-[12.5px] leading-relaxed text-muted">相手のセリフは自動で再生されます。自分の番では日本語を見て英語で言ってみよう（ヒントで英文を表示）。</p>
        <Button
          block
          variant="ink"
          onClick={() => {
            warmUpSpeech()
            setI(0)
          }}
        >
          ロールプレイを始める
        </Button>
      </Card>
    )

  if (!line)
    return (
      <Card className="space-y-4 text-center">
        <Guide pose="celebrate" text="会話を最後までやりきったワン！役を交代してもう一度やると効果倍増！" />
        <Button
          block
          variant="ink"
          onClick={() => {
            setStalledAt(null)
            setI(-1)
          }}
        >
          もう一度
        </Button>
      </Card>
    )

  return (
    <div className="space-y-2">
      {scene.lines.slice(0, i).map((l, k) => (
        <div key={k} className={cx('text-[13px] leading-snug', l.sp === role ? 'text-right text-ink' : 'text-muted')}>
          <span className="font-semibold">{l.sp === role ? 'You' : scene.roles.find((r) => r.id === l.sp)?.name}:</span> <span className="en text-[15px]">{l.en}</span>
        </div>
      ))}
      <Card className={cx('mt-3', mine && 'border-ink')}>
        <p className="text-[11.5px] font-semibold text-muted">{mine ? 'あなたの番' : scene.roles.find((r) => r.id === line.sp)?.name}</p>
        {mine ? (
          <>
            <p className="mt-1 text-[17px] font-medium leading-snug">{line.ja}</p>
            {hint ? (
              <p className="en mt-2 text-[18px] text-brand-strong">{line.en}</p>
            ) : (
              <button onClick={() => setHint(true)} className="mt-2 min-h-9 text-[13px] font-medium text-brand">
                ヒント（英文を表示）
              </button>
            )}
            <div className="mt-4">
              <SpeakCheck
                text={line.en}
                accent={voiceFor(scene, line.sp).accent}
                source={`scene:${scene.id}`}
                compact
                onScored={(r) => setGuide(speakingMessage(r.pron))}
              />
            </div>
            {guide && <Guide pose={guide.pose} text={guide.text} size={48} compact className="mt-3" />}
            <div className="mt-4 flex gap-2">
              <SpeakButton text={line.en} {...voiceFor(scene, line.sp)} label="お手本" />
              <Button
                variant="ink"
                size="sm"
                className="ml-auto"
                onClick={() => {
                  setHint(false)
                  setGuide(null)
                  setI(i + 1)
                }}
              >
                次へ
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="en mt-1 text-[18px] leading-snug">{line.en}</p>
            {stalledAt === i && (
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStalledAt(null)
                    playPartner(i)
                  }}
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  もう一度聞く
                </Button>
                <Button
                  variant="ink"
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    setStalledAt(null)
                    setI(i + 1)
                  }}
                >
                  次へ
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
