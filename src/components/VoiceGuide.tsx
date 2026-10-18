import { CheckCircle2, ChevronDown, TriangleAlert } from 'lucide-react'
import type { Accent } from '@/lib/accents'
import { useSettings } from '@/lib/settings'
import { listVoices, voicesFor, voiceQuality } from '@/lib/tts'
import { cx } from './ui'

export interface VoiceStatus {
  tone: 'good' | 'warn'
  title: string
  desc: string
}

/** いま読み上げに使われる声の状態（高音質かどうか）を、利用者に分かる言葉にする */
export function voiceStatus(neural: boolean, best: { name: string; quality: number } | undefined): VoiceStatus {
  if (neural) {
    return {
      tone: 'good',
      title: '高品質音声で読み上げています',
      desc: '通信できるときは、サーバーのニューラル音声（人に近い自然な声）で読みます。通信できないときは端末の声になるので、下の手順で端末にも高音質の声を入れておくと安心です。',
    }
  }
  if (!best) {
    return { tone: 'warn', title: 'この端末で英語の声が見つかりません', desc: '下の手順で英語の声を追加してください。追加したあとは、アプリを開き直すと反映されます。' }
  }
  if (best.quality >= 85) {
    return { tone: 'good', title: `端末の高音質の声（${best.name.replace(/\s*\(.*\)$/, '')}）で読み上げています`, desc: '「拡張」「プレミアム」の声が入っているので、このままで大丈夫です。' }
  }
  return {
    tone: 'warn',
    title: '標準の声で読み上げています（高音質ではありません）',
    desc: '下の手順で「プレミアム」か「拡張」の声を入れると、ずっと自然な発音になります。無料です。',
  }
}

export const VOICE_STEPS = [
  'iPhone の「設定」アプリを開き、「アクセシビリティ」をタップ。「視覚サポート」の欄にある「リーダーと読み上げ」を開く',
  '「声」→「英語」→「声」と進む',
  '使いたい声（Ava・Zoe・Evan・Daniel など）をタップし、「プレミアム」か「拡張」の横のダウンロードボタンをタップ。ダウンロードが終わるまで待つ',
  '日本語の声も同じように入れる：「声」→「日本語」→「声」で、Kyoko・Otoya などの「拡張」か「プレミアム」をダウンロード（和訳や案内の読み上げが自然になります）',
  'Patina をいったん終了して（アプリの切り替え画面で、Patina を上へスワイプ）開き直す。「英語の発音」で声を選ぶと、「高品質」と出ます',
]

/** 設定の「音声」と、はじめの案内で使う。いまの声の状態と、iPhone で高音質の声を入れる手順 */
export function VoiceGuide({ accent, neural, defaultOpen }: { accent?: Accent; neural: boolean; defaultOpen?: boolean }) {
  const s = useSettings()
  const top = voicesFor(accent ?? s.accent)[0]
  const st = voiceStatus(neural, top ? { name: top.name, quality: voiceQuality(top) } : undefined)
  const jaList = listVoices('ja-JP')
  const ja = (s.deviceVoiceJa && jaList.find((v) => v.name === s.deviceVoiceJa)) || jaList[0]
  const jaGood = !!ja && voiceQuality(ja) >= 85
  const Icon = st.tone === 'good' ? CheckCircle2 : TriangleAlert
  return (
    <div className="rounded-[14px] border border-line p-3.5">
      <div className="flex items-start gap-2.5" role="status">
        <Icon className={cx('mt-0.5 h-[18px] w-[18px] shrink-0', st.tone === 'good' ? 'text-ok' : 'text-warn')} strokeWidth={1.9} />
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-snug">{st.title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted">{st.desc}</p>
          {!neural && (
            <p className="mt-1.5 text-[12px] leading-relaxed">
              日本語の声：{ja ? `${ja.name.replace(/\s*\(.*\)$/, '')}（${jaGood ? '高音質' : '標準。下の手順で高音質にできます'}）` : 'ありません（下の手順で追加できます）'}
            </p>
          )}
        </div>
      </div>
      <details className="group mt-3 border-t border-line pt-2.5" open={defaultOpen}>
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between text-[13.5px] font-medium text-brand [&::-webkit-details-marker]:hidden">
          iPhone で高音質の声を入れる方法
          <ChevronDown className="h-4 w-4 transition group-open:rotate-180" strokeWidth={1.9} />
        </summary>
        <ol className="mt-2 space-y-2.5">
          {VOICE_STEPS.map((t, i) => (
            <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed">
              <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-bold tabular-nums">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
        <ul className="mt-3 space-y-1 text-[11.5px] leading-relaxed text-muted">
          <li>・品質は「プレミアム」＞「拡張」＞標準の順。1つ数百MBなので、Wi-Fi でのダウンロードがおすすめです</li>
          <li>・メニューの名前や並びは iOS のバージョンで少し違うことがあります。古い iOS では「リーダーと読み上げ」の代わりに「読み上げコンテンツ」や「スピーチ」という名前です</li>
          <li>・ダウンロードした声は、この端末だけに入ります。通信がなくても使えます</li>
          <li>・声が増えない・反映されないときは、Patina を閉じて開き直してください</li>
        </ul>
      </details>
    </div>
  )
}
