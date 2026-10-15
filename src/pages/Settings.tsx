import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { CheckCircle2, ChevronRight, Download, Upload, XCircle, RefreshCw, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Button, Card, Chip, Segmented, SectionTitle, Toggle } from '@/components/ui'
import { applyTheme, useSettings, type Theme } from '@/lib/settings'
import { listVoices, speak, ttsAvailable } from '@/lib/tts'
import { getHealth, type Health } from '@/lib/api'
import { db, exportAll, importAll } from '@/lib/db'
import { LEVELS } from '@/lib/types'

export default function Settings() {
  const s = useSettings()
  const [voicesUS, setVoicesUS] = useState<SpeechSynthesisVoice[]>([])
  const [voicesUK, setVoicesUK] = useState<SpeechSynthesisVoice[]>([])
  const [health, setHealth] = useState<Health | null | undefined>(undefined)
  const [msg, setMsg] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = () => {
      setVoicesUS(listVoices('en-US'))
      setVoicesUK(listVoices('en-GB'))
    }
    load()
    const t = setTimeout(load, 800)
    window.speechSynthesis?.addEventListener?.('voiceschanged', load)
    getHealth(true).then(setHealth)
    return () => {
      clearTimeout(t)
      window.speechSynthesis?.removeEventListener?.('voiceschanged', load)
    }
  }, [])

  const setTheme = (t: Theme) => {
    s.set({ theme: t })
    applyTheme(t)
  }

  const doExport = async () => {
    const json = await exportAll()
    const blob = new Blob([json], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `tetsu-english-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    setMsg('バックアップを書き出しました')
  }

  const doImport = async (f: File) => {
    try {
      await importAll(await f.text())
      setMsg('バックアップを読み込みました。アプリを再読み込みします…')
      setTimeout(() => location.reload(), 800)
    } catch (e) {
      setMsg(String((e as Error).message))
    }
  }

  const reset = async () => {
    if (!confirm('学習履歴をすべて削除します。よろしいですか？（元に戻せません）')) return
    await Promise.all([db.cards.clear(), db.logs.clear(), db.daily.clear(), db.speaking.clear()])
    setMsg('学習履歴を削除しました')
  }

  return (
    <div>
      <PageHeader title="設定" back />
      <div className="px-4 pb-10">
        <SectionTitle>表示</SectionTitle>
        <Card className="space-y-3">
          <p className="text-[13px] font-semibold text-muted">テーマ</p>
          <Segmented
            value={s.theme}
            onChange={setTheme}
            options={[
              { value: 'system', label: '自動' },
              { value: 'light', label: 'ライト' },
              { value: 'dark', label: 'ダーク' },
            ]}
          />
          <Toggle label="案内役のテツを表示" checked={s.guide} onChange={(v) => s.set({ guide: v })} />
        </Card>

        <SectionTitle>学習</SectionTitle>
        <Card className="space-y-4">
          <div>
            <div className="flex justify-between text-[15px]">
              <span>1日の新出語</span>
              <b>{s.dailyNew}語</b>
            </div>
            <input type="range" min={0} max={40} step={5} value={s.dailyNew} onChange={(e) => s.set({ dailyNew: Number(e.target.value) })} className="mt-2 w-full accent-[var(--brand)]" />
            <p className="text-[11px] text-muted">新出語を増やすと翌日以降の復習も増えます。最初は10語がおすすめ。</p>
          </div>
          <div>
            <p className="text-[15px]">目標の記憶保持率</p>
            <div className="mt-2">
              <Segmented
                value={String(s.retention)}
                onChange={(v) => s.set({ retention: Number(v) })}
                options={[
                  { value: '0.85', label: '85%' },
                  { value: '0.9', label: '90%★' },
                  { value: '0.95', label: '95%' },
                ]}
              />
            </div>
            <p className="mt-1 text-[11px] text-muted">FSRSは、この確率で思い出せる直前に復習を予定します（★推奨。高くすると復習回数が増えます）。</p>
          </div>
          <div>
            <p className="text-[15px]">学習するカテゴリ</p>
            <div className="mt-2 flex gap-2">
              {(
                [
                  ['general', '一般'],
                  ['business', 'ビジネス'],
                  ['rail', '保線'],
                ] as const
              ).map(([k, v]) => (
                <Chip key={k} active={s.studyCats[k]} onClick={() => s.set({ studyCats: { ...s.studyCats, [k]: !s.studyCats[k] } })}>
                  {v}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[15px]">一般・ビジネスの新出語レベル</p>
            <p className="mt-2 text-[12px] text-muted">下限</p>
            <div className="no-scrollbar mt-1 flex gap-2 overflow-x-auto">
              {LEVELS.slice(0, 5).map((l) => (
                <Chip key={l.lv} active={s.minLevel === l.lv} onClick={() => s.set({ minLevel: l.lv, maxLevel: Math.max(s.maxLevel, l.lv) })}>
                  Lv{l.lv} {l.cefr}
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-muted">上限</p>
            <div className="no-scrollbar mt-1 flex gap-2 overflow-x-auto">
              {LEVELS.slice(0, 5).map((l) => (
                <Chip key={l.lv} active={s.maxLevel === l.lv} onClick={() => s.set({ maxLevel: l.lv, minLevel: Math.min(s.minLevel, l.lv) })}>
                  Lv{l.lv} {l.cefr}
                </Chip>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted">範囲内の低いレベルから順に出題します。保線用語はこの設定に関係なく出題されます。</p>
          </div>
        </Card>

        <SectionTitle>音声</SectionTitle>
        <Card className="space-y-3">
          {!ttsAvailable && <p className="text-sm text-ng">この端末は音声合成に対応していません</p>}
          <Toggle label="単語を自動で読み上げる" checked={s.autoPlay} onChange={(v) => s.set({ autoPlay: v })} />
          <div>
            <div className="flex justify-between text-[15px]">
              <span>読み上げ速度</span>
              <b>{s.rate.toFixed(2)}x</b>
            </div>
            <input type="range" min={0.6} max={1.2} step={0.05} value={s.rate} onChange={(e) => s.set({ rate: Number(e.target.value) })} className="mt-2 w-full accent-[var(--brand)]" />
          </div>
          <VoiceSelect label="🇺🇸 米国英語の音声" voices={voicesUS} value={s.voiceUS} onChange={(v) => s.set({ voiceUS: v })} accent="en-US" />
          <VoiceSelect label="🇬🇧 英国英語の音声" voices={voicesUK} value={s.voiceUK} onChange={(v) => s.set({ voiceUK: v })} accent="en-GB" />
          <p className="text-[11px] leading-relaxed text-muted">
            iPhoneでは「設定 → アクセシビリティ → 読み上げコンテンツ → 声 → 英語」で高品質（拡張・プレミアム）音声をダウンロードすると、より自然な発音になります。
          </p>
        </Card>

        <SectionTitle>クラウド機能（翻訳・発音評価）</SectionTitle>
        <Card className="space-y-3">
          <ApiRow label="翻訳（Azure Translator）" ok={health?.translator} loading={health === undefined} />
          <ApiRow label="発音評価・音声入力（Azure Speech）" ok={health?.speech} loading={health === undefined} />
          {health === null && <p className="text-[12px] text-muted">サーバーに接続できません（オフライン、またはローカル開発サーバーで起動中）。</p>}
          {health?.tokenRequired && (
            <div>
              <p className="text-[13px] font-semibold">アクセストークン</p>
              <input
                value={s.apiToken}
                onChange={(e) => s.set({ apiToken: e.target.value })}
                type="password"
                autoComplete="off"
                placeholder="管理者が設定したトークン"
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-[15px] outline-none focus:border-brand"
              />
            </div>
          )}
          <Button variant="secondary" onClick={() => getHealth(true).then(setHealth)}>
            <RefreshCw className="h-4 w-4" />
            接続を確認
          </Button>
          <p className="text-[11px] leading-relaxed text-muted">
            APIキーはCloudflare Pagesの環境変数に保存され、端末には送られません。設定手順はリポジトリのREADMEを参照してください。未設定でも単語学習・リスニング・シャドーイング・用語チェックは利用できます。
          </p>
        </Card>

        <SectionTitle>データ</SectionTitle>
        <Card className="space-y-2">
          <p className="text-[12px] text-muted">学習データはこの端末内（IndexedDB）にのみ保存されます。機種変更の際はバックアップを使ってください。</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={doExport}>
              <Download className="h-4 w-4" />
              書き出し
            </Button>
            <Button variant="secondary" onClick={() => file.current?.click()}>
              <Upload className="h-4 w-4" />
              読み込み
            </Button>
          </div>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
          <Button variant="ghost" className="text-ng" onClick={reset}>
            <Trash2 className="h-4 w-4" />
            学習履歴をリセット
          </Button>
          {msg && <p className="text-sm text-ok">{msg}</p>}
        </Card>

        <SectionTitle>このアプリについて</SectionTitle>
        <Card className="p-0">
          <Link to="/research" className="flex items-center justify-between p-4">
            <span className="text-[15px]">学習法の根拠（研究・論文）とクレジット</span>
            <ChevronRight className="h-5 w-5 text-muted" />
          </Link>
        </Card>
        <p className="mt-4 text-center text-[11px] text-muted">Tetsu English v0.1.0</p>
      </div>
    </div>
  )
}

function ApiRow({ label, ok, loading }: { label: string; ok?: boolean; loading: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px]">{label}</span>
      {loading ? (
        <span className="text-xs text-muted">確認中…</span>
      ) : ok ? (
        <span className="flex items-center gap-1 text-xs font-bold text-ok">
          <CheckCircle2 className="h-4 w-4" />
          利用可能
        </span>
      ) : (
        <span className="flex items-center gap-1 text-xs font-bold text-muted">
          <XCircle className="h-4 w-4" />
          未設定
        </span>
      )}
    </div>
  )
}

function VoiceSelect({
  label,
  voices,
  value,
  onChange,
  accent,
}: {
  label: string
  voices: SpeechSynthesisVoice[]
  value: string
  onChange: (v: string) => void
  accent: 'en-US' | 'en-GB'
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold">{label}</p>
      <div className="mt-1 flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-[14px]"
        >
          <option value="">自動（おすすめ）</option>
          {voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
        <Button variant="secondary" onClick={() => speak('The track inspection starts at midnight.', { accent })}>
          試聴
        </Button>
      </div>
    </div>
  )
}
