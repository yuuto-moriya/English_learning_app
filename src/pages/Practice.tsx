import { AudioLines, Ear, Keyboard, Mic, PencilLine, Radio, Waves } from 'lucide-react'
import { PageHeader } from '@/components/Layout'
import { Guide } from '@/components/Guide'
import { List, ListRow, SectionTitle } from '@/components/ui'

export default function Practice() {
  return (
    <div>
      <PageHeader title="練習" subtitle="覚えた単語を、聞いて・話して使える英語にする" settings />
      <div className="px-4">
        <Guide who="moka" pose="greet" text="聞く・話すで使うと定着するよ♪ 1日5分からでOK！" />

        <SectionTitle>聞く</SectionTitle>
        <List>
          <ListRow to="/practice/listening" icon={<Ear />} title="リスニング" sub="例文・会話を聞いて意味を選ぶ（10問）" />
          <ListRow to="/practice/sounds" icon={<Waves />} title="聞き分け" sub="light / right など、日本語にない音の区別をいろいろな声で" />
          <ListRow to="/practice/dictation" icon={<Keyboard />} title="ディクテーション" sub="聞いた英文を書き取り、聞き逃した語を見つける" />
          <ListRow to="/practice/audio" icon={<Radio />} title="耳で復習" sub="和訳を聞いて英語を思い出す。画面を見なくてよい" />
        </List>

        <SectionTitle>話す</SectionTitle>
        <List>
          <ListRow to="/practice/compose" icon={<PencilLine />} title="瞬間英作文" sub="日本語を見て、すぐ英語で言う" />
          <ListRow to="/practice/speaking" icon={<Mic />} title="発音チェック" sub="お手本をまねて話し、単語・音ごとに採点" />
          <ListRow to="/practice/speaking?mode=shadow" icon={<AudioLines />} title="シャドーイング" sub="5つの手順で、聞こえた音をすぐ後から追う" />
        </List>

        <p className="mt-5 px-1 text-[12px] leading-relaxed text-muted">
          おすすめの順番：はじめはリスニング → 聞き分け → ディクテーション。慣れてきたら瞬間英作文 → シャドーイング → 発音チェック。
          保線の例文は英国英語の音声で再生されます。
        </p>
      </div>
    </div>
  )
}
