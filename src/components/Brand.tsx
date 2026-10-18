import { ChevronDown } from 'lucide-react'
import { cx } from './ui'

/** アプリ名と、名前に込めた考え（設定の「このアプリについて」・はじめての画面で使う） */
export const BRAND = {
  name: 'Eliza Patina',
  short: 'Patina',
  tagline: '話すほど、使うほど、あなたの英語に味が出る。',
}

/** 欧文セリフ体のロゴ文字（ファッションのメゾンのように、人の名前として組む） */
export function Wordmark({ className }: { className?: string }) {
  return (
    <p className={cx('en font-medium tracking-[0.01em]', className)}>
      Eliza <span className="italic">Patina</span>
    </p>
  )
}

/** 名前の由来（開閉式） */
export function BrandStory() {
  return (
    <details className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[14px] font-medium [&::-webkit-details-marker]:hidden">
        名前の由来
        <ChevronDown className="h-4 w-4 text-faint transition group-open:rotate-180" strokeWidth={1.9} />
      </summary>
      <div className="space-y-3 pb-1 text-[13px] leading-relaxed">
        <p>
          <b className="en text-[15px]">Eliza</b>
          <span className="text-muted">（名）</span>
          ── 映画『マイ・フェア・レディ』（原作はショーの『ピグマリオン』）の主人公、イライザ・ドゥーリトル。話し方の練習を重ねて、自分を変えていく人です。世界で最初の会話する
          AI「ELIZA」（1966年）の名前も彼女から。話すことで変わっていく、あなたのことです。
        </p>
        <p>
          <b className="en text-[15px]">Patina</b>
          <span className="text-muted">（名字）</span>
          ── 銅や革、デニムが使い込むうちに帯びる「経年変化の味」。ニューヨークの自由の女神の緑色も、銅が20〜30年かけて生んだパティーナです。毎日使ううちに自分のものになる、あなたの英語のことです。
        </p>
        <p className="text-muted">
          My Fair <span className="en">Lady</span> と、<span className="en">Lady</span> Liberty。ふたりの「英語のレディ」をひとつの名前に。単語の覚え具合も、学習中は銅色、定着すると緑青色で表しています。
        </p>
      </div>
    </details>
  )
}
