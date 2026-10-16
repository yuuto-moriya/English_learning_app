import { ArrowUpRight } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { Card, SectionTitle } from '@/components/ui'
import { CREDITS, EVIDENCE } from '@/data/research'

export default function Research() {
  return (
    <div>
      <PageHeader title="学習法の根拠" subtitle="研究・論文と、このアプリへの反映" back />
      <div className="px-4 pb-12">
        <Guide who="yuki" pose="greet" text="このアプリの学び方は、記憶と第二言語習得の研究にもとづいて設計しておるのじゃ。" />
        <div className="mt-5 space-y-3">
          {EVIDENCE.map((e, i) => (
            <Card key={e.id} className="p-5">
              <p className="text-[12px] font-medium tabular-nums text-faint">{String(i + 1).padStart(2, '0')}</p>
              <h2 className="mt-1 text-[18px] font-semibold leading-snug">{e.title}</h2>
              <p className="mt-2.5 text-[14px] leading-relaxed">{e.finding}</p>
              <div className="mt-4 border-l-2 border-brand pl-3">
                <p className="text-[12px] font-semibold text-brand-strong">アプリでの活用</p>
                <p className="mt-0.5 text-[13.5px] leading-relaxed">{e.inApp}</p>
              </div>
              <ul className="mt-4 space-y-2 border-t border-line pt-3">
                {e.refs.map((r) => (
                  <li key={r.cite} className="en text-[13px] leading-snug text-muted">
                    {r.cite}
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center font-sans text-[11.5px] font-medium text-brand">
                        DOI
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <SectionTitle>保線用語の扱いについて</SectionTitle>
        <Card>
          <p className="text-[13.5px] leading-relaxed">
            保線用語は、EU法令として公開されているTSI INF（Regulation (EU) No 1299/2014）付録Sの定義、EN規格（EN 13848、EN 13230、EN 13674、EN
            13306 など）の規格名・用語体系、JIS E 1001（鉄道－線路用語）の日本語用語を参考に、英国表記（EN）・米国表記・日本語を対応づけて編集しました。
            規格本文は著作権で保護されているため、定義は要約・意訳です。業務で用いる際は、必ず最新版の規格原文で確認してください。
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-muted">
            出典タグ：「一般用語」は特定の規格に定義がない一般的な鉄道英語、「英国実務」は英国の保線現場で使われる用語、「日本の実務」は日本の保線現場の用語です。
            「Directive (EU) 2016/797」は鉄道システムの相互運用性指令、「CSM-RA」はリスク評価の共通安全手法、「UIC 712」はレール損傷の分類コード、
            「SAP EAM」「ISO 55000」は設備・資産管理の用語体系、「AREMA」は米国の鉄道技術基準を示します。
          </p>
        </Card>

        <SectionTitle>クレジット・ライセンス</SectionTitle>
        <Card className="space-y-3">
          {CREDITS.map((c) => (
            <div key={c.name}>
              <p className="text-[14px] font-medium">{c.name}</p>
              <p className="text-[12px] leading-relaxed text-muted">
                {c.desc}
                {c.url && (
                  <a href={c.url} target="_blank" rel="noreferrer" className="ml-1 text-brand">
                    リンク
                  </a>
                )}
              </p>
            </div>
          ))}
          <p className="border-t border-line pt-3 text-[11.5px] leading-relaxed text-muted">
            単語データ（data-src・src/data/vocab）はNGSL/BSL/TSLのライセンスに従いCC BY-SA 4.0で提供されます。
          </p>
        </Card>
      </div>
    </div>
  )
}
