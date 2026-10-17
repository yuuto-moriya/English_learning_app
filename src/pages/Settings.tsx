import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { Check, CheckCircle2, ChevronRight, Download, RefreshCw, Trash2, Upload, XCircle } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { CharImage } from '@/components/Guide'
import { Button, Card, Segmented, SectionTitle, Toggle, cx } from '@/components/ui'
import { CAST_ORDER, CHARACTERS } from '@/lib/characters'
import { applyTheme, formatMinutes, MINUTE_CHOICES, newPerDay, PLAN_LABEL, useSettings, type PlanWhen, type Theme } from '@/lib/settings'
import { refreshNeural, ttsAvailable } from '@/lib/tts'
import { AccentPicker } from '@/components/AccentPicker'
import { getHealth, type Health } from '@/lib/api'
import { db, exportAll, importAll } from '@/lib/db'
import { CATEGORIES, LEVELS } from '@/lib/types'

export default function Settings() {
  const s = useSettings()
  const nav = useNavigate()
  const { hash } = useLocation()
  const [health, setHealth] = useState<Health | null | undefined>(undefined)
  const [msg, setMsg] = useState<string | null>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getHealth(true).then(setHealth)
  }, [])

  // ホームの「コースを変更」から来たときは、その項目までスクロール
  useEffect(() => {
    if (!hash) return
    const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 150)
    return () => clearTimeout(t)
  }, [hash])

  const setTheme = (t: Theme) => {
    s.set({ theme: t })
    applyTheme(t)
  }

  const doExport = async () => {
    const json = await exportAll()
    const name = `michi-backup-${new Date().toISOString().slice(0, 10)}.json`
    const blob = new Blob([json], { type: 'application/json' })
    // iPhone のホーム画面アプリではダウンロードリンクが使えないことがあるため、共有シート（ファイルに保存）を優先
    const f = new File([blob], name, { type: 'application/json' })
    if (navigator.canShare?.({ files: [f] })) {
      try {
        await navigator.share({ files: [f], title: 'Michi のバックアップ' })
        setMsg('バックアップを書き出しました')
        return
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
      }
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
    setMsg('バックアップを書き出しました')
  }

  const doImport = async (f: File) => {
    try {
      await importAll(await f.text())
      setMsg('バックアップを読み込みました。アプリを再読み込みします…')
      setTimeout(() => location.reload(), 800)
    } catch (e) {
      setMsg(e instanceof SyntaxError ? 'ファイルを読み込めませんでした（JSON形式ではありません）' : String((e as Error).message))
    }
  }

  const reset = async () => {
    if (!confirm('学習履歴をすべて削除します。よろしいですか？（元に戻せません）')) return
    await Promise.all([db.cards.clear(), db.logs.clear(), db.daily.clear(), db.speaking.clear(), db.marks.clear()])
    setMsg('学習履歴を削除しました')
  }

  const neuralOk = !!health?.tts

  return (
    <div>
      <PageHeader title="設定" back />
      <div className="px-4 pb-12">
        <SectionTitle>
          <span id="courses" className="scroll-mt-24">学習するコース</span>
        </SectionTitle>
        <Card className="p-0">
          {CATEGORIES.map((c, k) => {
            const on = s.studyCats[c.key]
            return (
              <button
                key={c.key}
                aria-pressed={on}
                onClick={() => {
                  const next = { ...s.studyCats, [c.key]: !on }
                  // すべて外すと学習する単語がなくなるので、最低1つは残す
                  if (Object.values(next).some(Boolean)) s.set({ studyCats: next })
                }}
                className={cx('flex w-full items-center gap-3 px-4 py-3 text-left', k > 0 && 'hairline-t')}
              >
                <span className={cx('h-2 w-2 shrink-0 rounded-full', c.dot)} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-medium">{c.label}</span>
                  <span className="block text-[12px] leading-snug text-muted">{c.desc}</span>
                </span>
                <span
                  className={cx(
                    'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-[1.5px]',
                    on ? 'border-ink bg-ink text-bg' : 'border-line-strong',
                  )}
                >
                  {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                </span>
              </button>
            )
          })}
        </Card>
        <p className="mt-2 px-1 text-[11.5px] leading-relaxed text-muted">選んだコースの単語が新しく出題され、練習とシーン会話の最初の選択にもなります。外したコースの復習は止まります（記録は残ります）。</p>

        <SectionTitle>学習</SectionTitle>
        <Card className="space-y-5">
          <div>
            <p className="text-[15px]">学習する時間帯</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(Object.keys(PLAN_LABEL) as PlanWhen[]).map((w) => (
                <button
                  key={w}
                  aria-pressed={s.planWhen === w}
                  onClick={() => s.set({ planWhen: w })}
                  className={cx(
                    'min-h-9 rounded-full border px-3 text-[13px] transition',
                    s.planWhen === w ? 'border-ink bg-ink text-bg' : 'border-line-strong text-ink',
                  )}
                >
                  {PLAN_LABEL[w]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[15px]">1日の目安</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {MINUTE_CHOICES.map((m) => (
                <button
                  key={m}
                  aria-pressed={s.dailyMinutes === m}
                  // 目安の時間に合わせて、1日の新しい単語もおすすめの数にする（下で個別に変えられる）
                  onClick={() => s.set({ dailyMinutes: m, dailyNew: newPerDay(m) })}
                  className={cx(
                    'min-h-9 rounded-full border px-3 text-[13px] tabular-nums transition',
                    s.dailyMinutes === m ? 'border-ink bg-ink text-bg' : 'border-line-strong text-ink',
                  )}
                >
                  {formatMinutes(m)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[15px]">
              <span>1日の新しい単語</span>
              <b className="font-semibold tabular-nums">{s.dailyNew}語</b>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              step={1}
              value={s.dailyNew}
              onChange={(e) => s.set({ dailyNew: Number(e.target.value) })}
              aria-label="1日の新しい単語"
              className="mt-2 w-full accent-[var(--brand)]"
            />
            <p className="text-[11.5px] leading-relaxed text-muted">
              新しい語を増やすと、翌日以降の復習も増えます。10分なら6語前後が続けやすい目安です。長い時間を選んだときも新しい単語は30語までにして、残りの時間は復習や練習にあてるのがおすすめです。
            </p>
          </div>
          <div>
            <p className="text-[15px]">目標の記憶保持率</p>
            <div className="mt-2">
              <Segmented
                size="sm"
                value={String(s.retention)}
                onChange={(v) => s.set({ retention: Number(v) })}
                options={[
                  { value: '0.85', label: '85%' },
                  { value: '0.9', label: '90%（推奨）' },
                  { value: '0.95', label: '95%' },
                ]}
              />
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">FSRS は、この確率で思い出せる直前に復習を入れます。高くすると復習の回数が増えます。</p>
          </div>
          <div>
            <p className="text-[15px]">新しい単語のレベル（一般会話・ビジネス）</p>
            <p className="mt-2 text-[12px] text-muted">下限</p>
            <div className="mt-1">
              <Segmented
                size="sm"
                value={String(s.minLevel)}
                onChange={(v) => s.set({ minLevel: Number(v), maxLevel: Math.max(s.maxLevel, Number(v)) })}
                options={LEVELS.slice(0, 5).map((l) => ({ value: String(l.lv), label: l.cefr }))}
              />
            </div>
            <p className="mt-2 text-[12px] text-muted">上限</p>
            <div className="mt-1">
              <Segmented
                size="sm"
                value={String(s.maxLevel)}
                onChange={(v) => s.set({ maxLevel: Number(v), minLevel: Math.min(s.minLevel, Number(v)) })}
                options={LEVELS.slice(0, 5).map((l) => ({ value: String(l.lv), label: l.cefr }))}
              />
            </div>
            <Link to="/welcome?step=check" className="mt-3 flex items-center gap-0.5 text-[13px] font-medium text-brand">
              レベルを診断し直す
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>

        <SectionTitle>音声</SectionTitle>
        <Card className="space-y-4">
          {!ttsAvailable && !neuralOk && <p className="text-[13px] text-ng">この端末は音声合成に対応していません</p>}
          <div>
            <p className="text-[15px]">読み上げの方式</p>
            <div className="mt-2">
              <Segmented
                size="sm"
                value={s.voiceEngine}
                onChange={(v) => {
                  s.set({ voiceEngine: v })
                  void refreshNeural(true)
                }}
                options={[
                  { value: 'auto', label: '高品質を優先' },
                  { value: 'device', label: '端末の音声のみ' },
                ]}
              />
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">
              {neuralOk
                ? '高品質音声（Azure のニューラル音声）が使えます。一度聞いた音声は端末に保存され、次からはオフラインでも再生できます。'
                : '高品質音声はサーバーの Azure Speech が未設定のため使えません。端末の音声で読み上げます。'}
            </p>
          </div>
          <AccentPicker neural={neuralOk && s.voiceEngine === 'auto'} />
          {(!neuralOk || s.voiceEngine === 'device') && (
            <p className="text-[11.5px] leading-relaxed text-muted">
              iPhone では「設定 → アクセシビリティ → 読み上げコンテンツ → 声 → 英語」で、名前に「拡張」「プレミアム」と付いた声をダウンロードすると自然な発音になります（おすすめ：Ava、Zoe、Evan、Daniel など）。
            </p>
          )}
          <div>
            <div className="flex justify-between text-[15px]">
              <span>読み上げ速度</span>
              <b className="font-semibold tabular-nums">{s.rate.toFixed(2)}×</b>
            </div>
            <input
              type="range"
              min={0.6}
              max={1.2}
              step={0.05}
              value={s.rate}
              onChange={(e) => s.set({ rate: Number(e.target.value) })}
              aria-label="読み上げ速度"
              className="mt-2 w-full accent-[var(--brand)]"
            />
          </div>
          <Toggle label="単語を自動で読み上げる" checked={s.autoPlay} onChange={(v) => s.set({ autoPlay: v })} />
          <Toggle
            label="リスニングでいろいろな声を使う"
            desc="聞き取りの問題で毎回ちがう話者の声にします（話者の多様性）"
            checked={s.varyVoices}
            onChange={(v) => s.set({ varyVoices: v })}
          />
          <Toggle
            label="リスニングでいろいろな国の英語を混ぜる"
            desc="アメリカ・イギリス・オーストラリア・インドなどの発音を混ぜて出題します"
            checked={s.mixAccents}
            onChange={(v) => s.set({ mixAccents: v })}
          />
          <Toggle label="効果音" desc="正解・不正解、録音の開始・終了などを音でお知らせします" checked={s.sounds} onChange={(v) => s.set({ sounds: v })} />
        </Card>

        <SectionTitle>表示</SectionTitle>
        <Card className="space-y-3">
          <Segmented
            value={s.theme}
            onChange={setTheme}
            options={[
              { value: 'system', label: '自動' },
              { value: 'light', label: 'ライト' },
              { value: 'dark', label: 'ダーク' },
            ]}
          />
          <Toggle label="キャラクターを表示" checked={s.guide} onChange={(v) => s.set({ guide: v })} />
        </Card>

        <SectionTitle>ヘルプ</SectionTitle>
        <Card className="space-y-2">
          <p className="text-[13px] leading-relaxed text-muted">モードの切り替え・学習・練習・翻訳と同時通訳など、主な機能をホーム画面で順番に案内します。</p>
          <Button
            block
            variant="secondary"
            onClick={() => {
              s.set({ tourDone: false })
              nav('/', { viewTransition: true })
            }}
          >
            使い方ガイドをもう一度見る
          </Button>
        </Card>

        <SectionTitle>なかまたち</SectionTitle>
        <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
          {CAST_ORDER.map((id, k) => {
            const c = CHARACTERS[id]
            return (
              <div key={id} className={cx('flex items-center gap-3 py-2.5 pl-3 pr-4', k > 0 && 'hairline-t')}>
                <CharImage who={id} pose="greet" size={56} />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium">
                    {c.name}
                    <span className="ml-2 text-[11.5px] text-muted">{c.breed}</span>
                  </p>
                  <p className={`text-[12px] font-semibold ${c.tint}`}>{c.role}</p>
                  <p className="mt-0.5 text-[12px] leading-snug text-muted">{c.intro}</p>
                </div>
              </div>
            )
          })}
        </div>

        <SectionTitle>クラウド機能</SectionTitle>
        <Card className="space-y-3">
          <ApiRow label="翻訳（Azure Translator）" ok={health?.translator} loading={health === undefined} />
          <ApiRow label="発音評価・音声入力（Azure Speech）" ok={health?.speech} loading={health === undefined} />
          <ApiRow label="高品質音声（Azure ニューラル音声）" ok={health?.tts} loading={health === undefined} />
          {health === null && <p className="text-[12px] text-muted">サーバーに接続できません（オフライン、またはローカル開発サーバーで起動中）。</p>}
          {health?.tokenRequired && (
            <div>
              <p className="text-[13px] font-medium">アクセストークン</p>
              <input
                value={s.apiToken}
                onChange={(e) => s.set({ apiToken: e.target.value })}
                type="password"
                autoComplete="off"
                placeholder="管理者が設定したトークン"
                className="mt-1 w-full rounded-[12px] bg-surface-2 px-3.5 py-2.5 text-[16px] outline-none focus:ring-2 focus:ring-ink/15"
              />
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              getHealth(true).then((h) => {
                setHealth(h)
                void refreshNeural()
              })
            }
          >
            <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
            接続を確認
          </Button>
          <p className="text-[11.5px] leading-relaxed text-muted">
            APIキーはサーバー（Vercel）の環境変数に保存され、端末には送られません。高品質音声で送るのは読み上げる英文だけで、学習の記録は送りません。未設定でも単語学習・リスニング・シャドーイング・用語チェックは使えます。
          </p>
        </Card>

        <SectionTitle>データ</SectionTitle>
        <Card className="space-y-3">
          <p className="text-[12.5px] leading-relaxed text-muted">学習データはこの端末内（IndexedDB）にだけ保存されます。機種変更のときはバックアップを使ってください。</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={doExport}>
              <Download className="h-4 w-4" strokeWidth={1.8} />
              書き出し
            </Button>
            <Button variant="secondary" onClick={() => file.current?.click()}>
              <Upload className="h-4 w-4" strokeWidth={1.8} />
              読み込み
            </Button>
          </div>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && doImport(e.target.files[0])} />
          <Button variant="danger" block onClick={reset}>
            <Trash2 className="h-4 w-4" strokeWidth={1.8} />
            学習履歴をリセット
          </Button>
          {msg && <p className="text-[13px] text-ok">{msg}</p>}
        </Card>

        <SectionTitle>このアプリについて</SectionTitle>
        <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
          <Link to="/research" className="flex items-center justify-between py-3.5 pl-4 pr-3 active:bg-surface-2">
            <span className="text-[15px]">学習法の根拠（研究・論文）とクレジット</span>
            <ChevronRight className="h-[18px] w-[18px] text-faint" />
          </Link>
          <Link to="/stats" className="flex items-center justify-between py-3.5 pl-4 pr-3 hairline-t active:bg-surface-2">
            <span className="text-[15px]">学習記録</span>
            <ChevronRight className="h-[18px] w-[18px] text-faint" />
          </Link>
        </div>
        <p className="mt-6 text-center text-[11px] text-faint">Michi v{__APP_VERSION__}</p>
      </div>
    </div>
  )
}

function ApiRow({ label, ok, loading }: { label: string; ok?: boolean; loading: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[14px]">{label}</span>
      {loading ? (
        <span className="text-[12px] text-muted">確認中…</span>
      ) : ok ? (
        <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-ok">
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
          利用可能
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-muted">
          <XCircle className="h-4 w-4" strokeWidth={2} />
          未設定
        </span>
      )}
    </div>
  )
}

