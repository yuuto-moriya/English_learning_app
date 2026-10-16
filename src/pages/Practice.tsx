import { Link } from 'react-router'
import { AudioLines, Ear, Keyboard, Mic, ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { Card, SectionTitle } from '@/components/ui'

const ITEMS = [
  {
    to: '/practice/listening',
    icon: Ear,
    color: 'text-gen bg-gen-soft',
    title: 'リスニングクイズ',
    desc: '例文・会話を聞いて意味を選ぶ。速度は0.7〜1.1倍で調整。',
    tag: '理解',
  },
  {
    to: '/practice/dictation',
    icon: Keyboard,
    color: 'text-biz bg-biz-soft',
    title: 'ディクテーション',
    desc: '聞いた英文を書き取り、単語ごとに答え合わせ。聞き取れない音が分かる。',
    tag: '音と文字',
  },
  {
    to: '/practice/speaking',
    icon: Mic,
    color: 'text-brand-strong bg-brand-soft',
    title: '発音チェック',
    desc: 'お手本を聞いてリピート。単語・音素ごとに採点（Azure）。',
    tag: '発話',
  },
  {
    to: '/practice/speaking?mode=shadow',
    icon: AudioLines,
    color: 'text-rail bg-rail-soft',
    title: 'シャドーイング',
    desc: '5ステップの手順で、聞こえた音をすぐ後から追いかけて話す。',
    tag: '聞く＋話す',
  },
]

export default function Practice() {
  return (
    <div>
      <PageHeader title="練習" subtitle="リスニングとスピーキングを鍛える" settings />
      <div className="px-4">
        <Guide who="moka" pose="greet" text="覚えた単語は「聞く・話す」で使うと定着するよ♪ リスニングと発音はモカがコーチするね。1日5分からでOK！" />
        <SectionTitle>メニュー</SectionTitle>
        <div className="space-y-2.5">
          {ITEMS.map(({ to, icon: Icon, color, title, desc, tag }) => (
            <Link key={to} to={to} className="block">
              <Card className="flex items-center gap-3.5 transition-transform active:scale-[0.98]">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[16px] font-extrabold">{title}</p>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-bold text-muted">{tag}</span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted" />
              </Card>
            </Link>
          ))}
        </div>
        <p className="mt-4 text-[12px] leading-relaxed text-muted">
          ヒント：初級はリスニングクイズ → ディクテーション、中級以上はシャドーイング → 発音チェックの順がおすすめ。
          保線の例文は英国英語の音声（en-GB）で再生されます。
        </p>
      </div>
    </div>
  )
}
