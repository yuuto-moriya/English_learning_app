import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownUp, Copy, Check, Loader2, Mic, Square, Star, Trash2, X, BookMarked, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { Button, Card, Segmented, SpeakButton, SectionTitle, cx } from '@/components/ui'
import { ApiError, transcribe, translate } from '@/lib/api'
import { db } from '@/lib/db'
import { findTerms, hasJapanese, modalTips, type GlossaryHit } from '@/lib/glossary'
import { useHealth } from '@/lib/hooks'
import { WavRecorder } from '@/lib/recorder'

type Dir = 'auto' | 'ja-en' | 'en-ja'
type MicLang = 'ja-JP' | 'en-US'

const MIC_LANGS: { value: MicLang; label: string }[] = [
  { value: 'ja-JP', label: '日本語' },
  { value: 'en-US', label: 'English' },
]

export default function Translate() {
  const health = useHealth()
  const [dir, setDir] = useState<Dir>('auto')
  const [src, setSrc] = useState('')
  const [out, setOut] = useState('')
  const [outLang, setOutLang] = useState<'en' | 'ja'>('en')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hits, setHits] = useState<GlossaryHit[]>([])
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)
  const [recording, setRecording] = useState(false)
  /** 音声入力の認識言語（自動判定時は日本語、英語→日本語では英語が既定） */
  const [micLang, setMicLang] = useState<MicLang>('ja-JP')
  const rec = useRef<WavRecorder | null>(null)
  /** マイク起動中（権限ダイアログ待ちなど）の連打で2つ目の録音を始めないためのフラグ */
  const starting = useRef(false)
  const mounted = useRef(true)
  const history = useLiveQuery(() => db.translations.orderBy('at').reverse().limit(30).toArray(), [])

  // 画面を離れたら録音を破棄してマイクを解放
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      rec.current?.cancel()
      rec.current = null
    }
  }, [])

  // 原文の専門用語をリアルタイムに検出（オフラインでも動作）
  useEffect(() => {
    const t = setTimeout(() => {
      findTerms(`${src}\n${out}`).then(setHits)
    }, 250)
    return () => clearTimeout(t)
  }, [src, out])

  const resolveDir = (): { from: 'ja' | 'en'; to: 'ja' | 'en' } => {
    if (dir === 'ja-en') return { from: 'ja', to: 'en' }
    if (dir === 'en-ja') return { from: 'en', to: 'ja' }
    return hasJapanese(src) ? { from: 'ja', to: 'en' } : { from: 'en', to: 'ja' }
  }

  const run = async () => {
    const text = src.trim()
    if (!text) return
    setBusy(true)
    setError(null)
    const { from, to } = resolveDir()
    try {
      const r = await translate(text, to, from)
      setOut(r.text)
      setOutLang(to)
      await db.translations.add({ at: Date.now(), from, to, src: text, out: r.text })
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 503
            ? '翻訳APIが未設定です。下の用語チェックはオフラインでも使えます。'
            : e.message
          : 'オフラインのため翻訳できません。用語チェックは利用できます。',
      )
    } finally {
      setBusy(false)
    }
  }

  const changeDir = (d: Dir) => {
    setDir(d)
    if (d === 'en-ja') setMicLang('en-US')
    else if (d === 'ja-en') setMicLang('ja-JP')
  }

  /** 録音を止めて文字起こし。state ではなく rec.current だけを見るので、自動停止から呼んでも古い値を掴まない */
  const stopMic = async () => {
    const r = rec.current
    if (!r) return
    rec.current = null
    setRecording(false)
    setBusy(true)
    try {
      const result = await r.stop()
      URL.revokeObjectURL(result.url)
      const text = await transcribe(result.wav, micLang)
      if (mounted.current && text) setSrc((s) => ((s ? s + ' ' : '') + text).slice(0, 5000))
    } catch (e) {
      if (mounted.current) setError(e instanceof ApiError ? e.message : '音声入力に失敗しました')
    } finally {
      if (mounted.current) setBusy(false)
    }
  }
  // 28秒の自動停止は、録音開始時点ではなく最新の stopMic を呼ぶ
  const stopRef = useRef(stopMic)
  useEffect(() => {
    stopRef.current = stopMic
  })

  const startMic = async () => {
    if (rec.current || starting.current) return
    starting.current = true
    setError(null)
    const r = new WavRecorder()
    r.onAutoStop = () => {
      void stopRef.current()
    }
    try {
      await r.start()
      if (!mounted.current) {
        r.cancel()
        return
      }
      rec.current = r
      setRecording(true)
    } catch {
      r.cancel()
      if (mounted.current) setError('マイクを使用できません')
    } finally {
      starting.current = false
    }
  }

  const toggleMic = () => (rec.current ? stopMic() : startMic())

  const copyOut = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable')
      await navigator.clipboard.writeText(out)
      setCopyFailed(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
      setCopyFailed(true)
      setTimeout(() => setCopyFailed(false), 3000)
    }
  }

  const swap = () => {
    if (!out) return
    setSrc(out)
    setOut('')
    changeDir(outLang === 'en' ? 'en-ja' : 'ja-en')
  }

  const tips = outLang === 'en' ? modalTips(out) : modalTips(src)
  const englishText = outLang === 'en' ? out : src

  return (
    <div>
      <PageHeader title="翻訳" subtitle="日本語 ⇄ 英語・保線用語チェック付き" settings />
      <div className="space-y-3 px-4 pb-8">
        <Segmented
          value={dir}
          onChange={changeDir}
          options={[
            { value: 'auto', label: '自動判定' },
            { value: 'ja-en', label: '日本語→英語' },
            { value: 'en-ja', label: '英語→日本語' },
          ]}
        />
        <Card className="p-0">
          <textarea
            value={src}
            onChange={(e) => setSrc(e.target.value.slice(0, 5000))}
            rows={5}
            placeholder="翻訳したい文章を入力（例：明日の夜間、下り線で道床つき固めを行います。）"
            className="w-full resize-none rounded-t-[22px] bg-transparent p-4 text-[16px] leading-relaxed outline-none"
          />
          <div className="flex flex-wrap items-center gap-2 border-t border-line px-3 py-2">
            {health?.speech && (
              <>
                <button
                  onClick={toggleMic}
                  disabled={busy && !recording}
                  className={cx(
                    'flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40',
                    recording ? 'bg-ng text-white' : 'bg-surface-2 text-ink',
                  )}
                  aria-label="音声入力"
                >
                  {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
                </button>
                <div className="flex rounded-full bg-surface-2 p-0.5" role="group" aria-label="音声入力の言語">
                  {MIC_LANGS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setMicLang(l.value)}
                      disabled={recording}
                      aria-pressed={micLang === l.value}
                      className={cx(
                        'h-8 rounded-full px-2 text-[11px] font-semibold transition disabled:opacity-60',
                        micLang === l.value ? 'bg-surface text-ink shadow-sm' : 'text-muted',
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </>
            )}
            {src && (
              <button onClick={() => { setSrc(''); setOut('') }} className="rounded-full p-2 text-muted" aria-label="クリア">
                <X className="h-5 w-5" />
              </button>
            )}
            <span className="ml-auto text-[11px] text-muted">{src.length}/5000</span>
            <Button onClick={run} disabled={!src.trim() || busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              翻訳
            </Button>
          </div>
        </Card>

        {error && (
          <div className="flex gap-2 rounded-2xl bg-warn/10 p-3 text-[13px]">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warn" />
            <span>
              {error}{' '}
              {health && !health.translator && (
                <Link to="/settings" className="font-semibold text-brand">
                  設定方法
                </Link>
              )}
            </span>
          </div>
        )}

        {out && (
          <Card className="animate-pop">
            <div className="flex items-start gap-2">
              <p className="flex-1 whitespace-pre-wrap text-[17px] leading-relaxed">{out}</p>
            </div>
            <div className="mt-3 flex items-center gap-2">
              {outLang === 'en' && (
                <>
                  <SpeakButton text={out} />
                  <SpeakButton text={out} accent="en-GB" label="英国音" />
                </>
              )}
              <button
                onClick={copyOut}
                className="flex h-10 items-center gap-1 rounded-full bg-surface-2 px-3 text-xs font-semibold"
              >
                {copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
                コピー
              </button>
              <button onClick={swap} className="ml-auto flex h-10 items-center gap-1 rounded-full bg-surface-2 px-3 text-xs font-semibold">
                <ArrowDownUp className="h-4 w-4" />
                入れ替え
              </button>
            </div>
            {copyFailed && (
              <p role="alert" className="mt-2 text-[12px] text-ng">
                コピーできませんでした。訳文を長押しして選択・コピーしてください。
              </p>
            )}
          </Card>
        )}

        {tips.length > 0 && englishText && (
          <Card className="space-y-1 ring-rail/30">
            {tips.map((t) => (
              <p key={t} className="text-[12.5px]">⚖️ {t}</p>
            ))}
          </Card>
        )}

        <SectionTitle>
          <span className="inline-flex items-center gap-1">
            <BookMarked className="h-3.5 w-3.5" />
            検出した保線用語（{hits.length}）
          </span>
        </SectionTitle>
        {hits.length === 0 ? (
          <Guide
            who="chocola"
            pose="greet"
            size={72}
            text="文章に保線用語があると、英国(EN)・米国の言い方とJISの日本語を並べて表示するよ。機械翻訳の訳語チェックに使ってね！"
          />
        ) : (
          <Card className="divide-y divide-line p-0">
            {hits.map((h) => (
              <Link key={h.word.id} to={`/words/${h.word.id}`} className="flex items-center gap-3 p-3 active:bg-surface-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">
                    🇬🇧 {h.word.w}
                    {h.word.us && <span className="ml-2 font-semibold text-muted">🇺🇸 {h.word.us}</span>}
                  </p>
                  <p className="text-[12.5px] text-muted">{h.word.ja}</p>
                  {h.word.refs && <p className="mt-0.5 truncate text-[10.5px] text-rail">{h.word.refs.join(' / ')}</p>}
                </div>
                <span className="shrink-0 rounded-md bg-rail-soft px-1.5 py-0.5 text-[10px] font-bold text-rail">「{h.matched}」</span>
              </Link>
            ))}
          </Card>
        )}

        {history && history.length > 0 && (
          <>
            <SectionTitle>履歴</SectionTitle>
            <div className="space-y-2">
              {history.map((h) => (
                <Card
                  key={h.id}
                  className="p-3"
                  onClick={() => {
                    setSrc(h.src)
                    setOut(h.out)
                    setOutLang(h.to as 'en' | 'ja')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  <p className="line-clamp-2 text-[13px] text-muted">{h.src}</p>
                  <p className="mt-0.5 line-clamp-2 text-[14px] font-semibold">{h.out}</p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        db.translations.update(h.id!, { fav: !h.fav })
                      }}
                      className="p-1.5"
                      aria-label="お気に入り"
                    >
                      <Star className={cx('h-4 w-4', h.fav ? 'fill-warn text-warn' : 'text-muted')} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        db.translations.delete(h.id!)
                      }}
                      className="p-1.5 text-muted"
                      aria-label="削除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
