import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { ModeSwitcher } from '@/components/ModeSwitcher'
import { List, SectionTitle } from '@/components/ui'
import { PRACTICE_MODES, PracticeRows } from '@/components/PracticeMenu'

export default function Practice() {
  return (
    <div>
      <PageHeader title="練習" subtitle="覚えた単語を、聞いて・話して使える英語にする" settings />
      <div className="px-4">
        <ModeSwitcher className="mb-3" />
        <Guide who="moka" pose="greet" text="聞く・話すで使うと定着するよ♪ 1日5分からでOK！" />

        <SectionTitle>家で・ながらで</SectionTitle>
        <List>
          <PracticeRows keys={['handsfree']} />
        </List>

        <SectionTitle>単語を確かめる</SectionTitle>
        <List>
          <PracticeRows keys={PRACTICE_MODES.filter((m) => m.group === '単語').map((m) => m.key)} />
        </List>

        <SectionTitle>聞く</SectionTitle>
        <List>
          <PracticeRows keys={PRACTICE_MODES.filter((m) => m.group === '聞く').map((m) => m.key)} />
        </List>

        <SectionTitle>話す</SectionTitle>
        <List>
          <PracticeRows keys={PRACTICE_MODES.filter((m) => m.group === '話す').map((m) => m.key)} />
        </List>

        <p className="mt-5 px-1 text-[12px] leading-relaxed text-muted">
          おすすめの順番：はじめはリスニング → 聞き分け → ディクテーション。慣れてきたら瞬間英作文 → シャドーイング → 発音チェック。
          練習の例文は、上のモードに合わせて出題します。読み上げの発音（国・地域）は設定で変えられます（鉄道の例文ははじめはイギリスの発音）。
        </p>
      </div>
    </div>
  )
}
