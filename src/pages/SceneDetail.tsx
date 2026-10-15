import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { Pause, Play, Languages, SkipForward, Lightbulb } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { SpeakCheck } from '@/components/SpeakCheck'
import { Button, Card, Empty, Segmented, SpeakButton, SectionTitle, cx } from '@/components/ui'
import { getScene } from '@/data/scenes'
import { speak, stopSpeaking, type Accent } from '@/lib/tts'
import { speakingMessage, type GuideLine } from '@/lib/guide'
import type { Scene } from '@/lib/types'

function voiceFor(scene: Scene, sp: string): Accent {
  // 話者ごとに英米の音声を分け、両方の発音に触れられるようにする
  const base: Accent = scene.group === 'rail' ? 'en-GB' : 'en-US'
  const other: Accent = base === 'en-US' ? 'en-GB' : 'en-US'
  return sp === scene.roles[0].id ? base : other
}

export default function SceneDetail() {
  const { id } = useParams()
  const scene = id ? getScene(id) : undefined
  const [mode, setMode] = useState<'listen' | 'role'>('listen')
  const [showJa, setShowJa] = useState(true)
  const [playing, setPlaying] = useState<number | null>(null)
  const cancel = useRef(false)

  useEffect(
    () => () => {
      cancel.current = true
      stopSpeaking()
    },
    [],
  )

  if (!scene) return <Empty>シーンが見つかりません</Empty>

  const playAll = async () => {
    cancel.current = false
    for (let i = 0; i < scene.lines.length; i++) {
      if (cancel.current) break
      setPlaying(i)
      await speak(scene.lines[i].en, { accent: voiceFor(scene, scene.lines[i].sp) })
      await new Promise((r) => setTimeout(r, 350))
    }
    setPlaying(null)
  }
  const stopAll = () => {
    cancel.current = true
    stopSpeaking()
    setPlaying(null)
  }
  const roleName = (sp: string) => scene.roles.find((r) => r.id === sp)?.name ?? sp

  return (
    <div>
      <PageHeader title={`${scene.emoji} ${scene.title}`} subtitle={scene.titleEn} back="/scenes" />
      <div className="space-y-3 px-4 pb-8">
        <Card>
          <p className="text-[12px] font-bold text-muted">この場面のゴール</p>
          <p className="mt-0.5 text-[15px] font-semibold">{scene.goal}</p>
        </Card>

        <SectionTitle>キーフレーズ</SectionTitle>
        <Card className="divide-y divide-line p-0">
          {scene.phrases.map((p, i) => (
            <div key={i} className="flex items-start gap-3 p-3">
              <div className="flex-1">
                <p className="text-[15px] font-semibold leading-snug">{p.en}</p>
                <p className="text-[12.5px] text-muted">{p.ja}</p>
                {p.note && <p className="mt-0.5 text-[11px] text-rail">💡 {p.note}</p>}
              </div>
              <SpeakButton text={p.en} accent={scene.group === 'rail' ? 'en-GB' : 'en-US'} size="sm" />
            </div>
          ))}
        </Card>

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
          <>
            <div className="flex gap-2">
              {playing === null ? (
                <Button className="flex-1" onClick={playAll}>
                  <Play className="h-4 w-4" />
                  会話を通して再生
                </Button>
              ) : (
                <Button variant="secondary" className="flex-1" onClick={stopAll}>
                  <Pause className="h-4 w-4" />
                  停止
                </Button>
              )}
              <Button variant="secondary" onClick={() => setShowJa((v) => !v)} aria-label="和訳の表示切替">
                <Languages className="h-4 w-4" />
                {showJa ? '和訳OFF' : '和訳ON'}
              </Button>
            </div>
            <div className="space-y-2">
              {scene.lines.map((l, i) => {
                const mine = l.sp === scene.roles[scene.roles.length - 1].id
                return (
                  <div key={i} className={cx('flex gap-2', mine && 'flex-row-reverse')}>
                    <div
                      className={cx(
                        'max-w-[85%] rounded-2xl border px-3 py-2 transition',
                        mine ? 'rounded-tr-sm border-brand/30 bg-brand-soft' : 'rounded-tl-sm border-line bg-surface',
                        playing === i && 'ring-2 ring-brand',
                      )}
                    >
                      <p className="text-[11px] font-bold text-muted">{roleName(l.sp)}</p>
                      <p className="text-[15px] leading-snug">{l.en}</p>
                      {showJa && <p className="mt-0.5 text-[12px] text-muted">{l.ja}</p>}
                    </div>
                    <SpeakButton text={l.en} accent={voiceFor(scene, l.sp)} size="sm" className="self-center" />
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <RolePlay scene={scene} />
        )}

        {scene.tip && (
          <Card className="flex gap-3">
            <Lightbulb className="h-5 w-5 shrink-0 text-warn" />
            <p className="text-[13px] leading-relaxed">{scene.tip}</p>
          </Card>
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
  const line = scene.lines[i]
  const mine = line?.sp === role

  useEffect(() => {
    if (!line || mine) return
    let alive = true
    speak(line.en, { accent: voiceFor(scene, line.sp) }).then(() => {
      if (alive) setTimeout(() => alive && setI((x) => x + 1), 400)
    })
    return () => {
      alive = false
    }
  }, [i]) // eslint-disable-line react-hooks/exhaustive-deps

  if (i < 0)
    return (
      <Card className="space-y-3">
        <p className="text-[13px] font-bold text-muted">あなたの役を選んでください</p>
        <Segmented value={role} onChange={setRole} options={scene.roles.map((r) => ({ value: r.id, label: r.name }))} />
        <p className="text-[12px] text-muted">相手のセリフは自動で再生されます。自分の番では日本語を見て英語で言ってみよう（ヒントで英文表示）。</p>
        <Button
          block
          onClick={() => {
            speak(' ')
            setI(0)
          }}
        >
          ロールプレイ開始
        </Button>
      </Card>
    )

  if (!line)
    return (
      <Card className="space-y-3 text-center">
        <Guide pose="celebrate" text="会話を最後までやりきったワン！役を交代してもう一度やると効果倍増！" />
        <Button block onClick={() => setI(-1)}>
          もう一度
        </Button>
      </Card>
    )

  return (
    <div className="space-y-2">
      {scene.lines.slice(0, i).map((l, k) => (
        <div key={k} className={cx('text-[13px]', l.sp === role ? 'text-right text-brand-strong' : 'text-muted')}>
          <b>{l.sp === role ? 'You' : scene.roles.find((r) => r.id === l.sp)?.name}:</b> {l.en}
        </div>
      ))}
      <Card className={cx(mine && 'border-2 border-brand/40')}>
        <p className="text-[11px] font-bold text-muted">{mine ? 'あなたの番' : scene.roles.find((r) => r.id === line.sp)?.name}</p>
        {mine ? (
          <>
            <p className="mt-1 text-[16px] font-semibold">{line.ja}</p>
            {hint ? (
              <p className="mt-2 text-[15px] text-brand-strong">{line.en}</p>
            ) : (
              <button onClick={() => setHint(true)} className="mt-2 text-sm font-semibold text-brand">
                ヒント（英文を表示）
              </button>
            )}
            <div className="mt-3">
              <SpeakCheck
                text={line.en}
                accent={voiceFor(scene, line.sp)}
                source={`scene:${scene.id}`}
                compact
                onScored={(r) => setGuide(speakingMessage(r.pron))}
              />
            </div>
            {guide && <Guide pose={guide.pose} text={guide.text} size={56} compact className="mt-2" />}
            <div className="mt-3 flex gap-2">
              <SpeakButton text={line.en} accent={voiceFor(scene, line.sp)} label="お手本" />
              <Button
                className="ml-auto"
                onClick={() => {
                  setHint(false)
                  setGuide(null)
                  setI(i + 1)
                }}
              >
                <SkipForward className="h-4 w-4" />
                次へ
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-1 text-[16px]">{line.en}</p>
        )}
      </Card>
    </div>
  )
}
