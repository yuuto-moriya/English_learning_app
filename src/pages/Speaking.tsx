import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Eye, EyeOff, Repeat, Shuffle, Play } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { SourcePicker, SpeedPicker } from '@/components/PracticeControls'
import { SpeakCheck } from '@/components/SpeakCheck'
import { Button, Card, Segmented, SpeakButton, cx } from '@/components/ui'
import { sentencePool, type Sentence, type Source } from '@/lib/sentences'
import { speak, stopSpeaking, type Accent } from '@/lib/tts'
import { speakingMessage, type GuideLine } from '@/lib/guide'
import { shuffle } from '@/lib/vocab'
import { useStandalone } from '@/lib/hooks'

/** シャドーイングの5ステップ（濱田 2016 等で用いられる一般的な手順を参考） */
const STEPS = [
  { title: 'リスニング', desc: '文字を見ずに2〜3回聞き、内容をつかむ', showText: false, showJa: false },
  { title: 'マンブリング', desc: '小声でつぶやくように、音声のすぐ後を追う', showText: false, showJa: false },
  { title: '意味の確認', desc: '英文と和訳を見て、分からない語や音のつながりを確認', showText: true, showJa: true },
  { title: 'シンクロ・リーディング', desc: '英文を見ながら、音声と同時に声に出して読む', showText: true, showJa: false },
  { title: 'シャドーイング', desc: '英文を見ずに、音声の0.5秒ほど後をはっきり追いかける', showText: false, showJa: false },
]

export default function Speaking() {
  const [params] = useSearchParams()
  const initialText = params.get('text')
  const [mode, setMode] = useState<'repeat' | 'shadow'>(params.get('mode') === 'shadow' ? 'shadow' : 'repeat')
  const [sources, setSources] = useState<Source[]>(['scene'])
  const [level, setLevel] = useState(3)
  const [rate, setRate] = useState(0.85)
  const [pool, setPool] = useState<Sentence[]>([])
  const [cur, setCur] = useState<Sentence | null>(
    initialText ? { en: initialText, ja: '', lv: 0, src: 'general', accent: (params.get('accent') as Accent) ?? 'en-US' } : null,
  )
  const [step, setStep] = useState(0)
  const [showText, setShowText] = useState(true)
  const [guide, setGuide] = useState<GuideLine | null>(null)
  const standalone = useStandalone()
  /** 「3回連続」再生の世代番号。他の操作・アンマウントで増やしてループを止める */
  const runId = useRef(0)

  useEffect(() => {
    let alive = true
    sentencePool(sources, level, Math.max(1, level - 2)).then((p) => {
      if (!alive) return
      setPool(p)
      setCur((c) => c ?? shuffle(p)[0] ?? null)
    })
    return () => {
      alive = false
    }
  }, [sources, level])
  useEffect(
    () => () => {
      runId.current++
      stopSpeaking()
    },
    [],
  )

  /** 連続再生を止める（読み上げ中の音声も止める） */
  const stopPlayback = () => {
    runId.current++
    stopSpeaking()
  }

  const repeat3 = async (text: string, accent: Accent) => {
    const run = ++runId.current
    for (let k = 0; k < 3; k++) {
      const ok = await speak(text, { accent, rate })
      if (!ok || runId.current !== run) break
    }
  }

  const nextSentence = () => {
    stopPlayback()
    setCur(shuffle(pool)[0] ?? null)
    setStep(0)
    setGuide(null)
  }

  const st = STEPS[step]
  const textVisible = mode === 'repeat' ? showText : st.showText
  const jaVisible = mode === 'repeat' ? showText : st.showJa

  const header = useMemo(
    () => (mode === 'shadow' ? 'シャドーイング' : '発音チェック'),
    [mode],
  )

  return (
    <div>
      <PageHeader title={header} subtitle="お手本を聞いて、まねして話す" back="/practice" />
      <div className="space-y-3 px-4 pb-8">
        <Segmented
          value={mode}
          onChange={(m) => {
            stopPlayback()
            setMode(m)
            setStep(0)
          }}
          options={[
            { value: 'repeat', label: 'リピート採点' },
            { value: 'shadow', label: 'シャドーイング' },
          ]}
        />
        {guide ? (
          <Guide pose={guide.pose} text={guide.text} size={72} />
        ) : (
          <Guide
            who="moka"
            pose={mode === 'shadow' ? 'think' : 'cheer'}
            size={72}
            text={
              mode === 'shadow'
                ? 'イヤホン推奨だよ♪ 5つのステップで、聞こえた音をそのまま再現しよう。'
                : '強く読む語とリズムをまねするのがコツだよ♪ まずお手本を2回聞こう！'
            }
          />
        )}

        <Card className="space-y-4">
          <SourcePicker sources={sources} onSources={setSources} level={level} onLevel={setLevel} />
          <SpeedPicker rate={rate} onRate={setRate} />
        </Card>

        {cur && (
          <Card>
            {mode === 'shadow' && (
              <div className="mb-3">
                <div className="flex gap-1">
                  {STEPS.map((s, i) => (
                    <button
                      key={s.title}
                      onClick={() => setStep(i)}
                      className={cx('h-1.5 flex-1 rounded-full', i <= step ? 'bg-rail' : 'bg-surface-2')}
                      aria-label={s.title}
                    />
                  ))}
                </div>
                <p className="mt-2 text-[13px] font-bold text-rail">
                  STEP {step + 1}　{st.title}
                </p>
                <p className="text-[12px] text-muted">{st.desc}</p>
              </div>
            )}
            <div className="min-h-16">
              {textVisible ? (
                <p className="text-[19px] font-semibold leading-relaxed">{cur.en}</p>
              ) : (
                <p className="text-[15px] text-muted">（英文は隠れています）</p>
              )}
              {jaVisible && cur.ja && <p className="mt-1 text-[13px] text-muted">{cur.ja}</p>}
            </div>
            {/* このエリアのボタン操作（お手本・ゆっくり等）は進行中の「3回連続」を止める */}
            <div className="mt-3 flex flex-wrap items-center gap-2" onClickCapture={() => runId.current++}>
              <Button onClick={() => speak(cur.en, { accent: cur.accent, rate })}>
                <Play className="h-4 w-4" />
                お手本
              </Button>
              <SpeakButton text={cur.en} accent={cur.accent} rate={0.6} label="ゆっくり" />
              {mode === 'shadow' && (
                <Button variant="secondary" onClick={() => repeat3(cur.en, cur.accent)}>
                  <Repeat className="h-4 w-4" />
                  3回連続
                </Button>
              )}
              {mode === 'repeat' && (
                <button onClick={() => setShowText((v) => !v)} className="ml-auto flex items-center gap-1 text-xs font-semibold text-muted">
                  {showText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showText ? '英文を隠す' : '英文を表示'}
                </button>
              )}
            </div>
          </Card>
        )}

        {mode === 'shadow' ? (
          <div className="flex gap-2">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              前へ
            </Button>
            {step < STEPS.length - 1 ? (
              <Button className="flex-1" onClick={() => setStep((s) => s + 1)}>
                次のステップ
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => {
                  stopPlayback()
                  setMode('repeat')
                }}
              >
                発音チェックへ
              </Button>
            )}
          </div>
        ) : (
          cur && (
            <Card>
              <SpeakCheck text={cur.en} accent={cur.accent} source="speaking" onScored={(r) => setGuide(speakingMessage(r.pron))} />
            </Card>
          )
        )}

        <Button variant="ghost" block onClick={nextSentence}>
          <Shuffle className="h-4 w-4" />
          別の文にする
        </Button>

        {standalone && (
          <p className="text-[11px] leading-relaxed text-muted">
            ※ホーム画面アプリでは端末の音声認識が使えないため、自動採点にはAzure Speechの設定が必要です（設定画面を参照）。
          </p>
        )}
      </div>
    </div>
  )
}
