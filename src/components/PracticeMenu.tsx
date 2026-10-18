import { AudioLines, Ear, House, Keyboard, Mic, PencilLine, Radio, Waves, type LucideIcon } from 'lucide-react'
import { ListRow } from './ui'

/** 練習メニュー。ホームと練習の画面で同じ名前・アイコン・説明を使う */
export const PRACTICE_MODES: { key: string; to: string; icon: LucideIcon; title: string; sub: string; group: '聞く' | '話す' | 'ながら' }[] = [
  { key: 'handsfree', to: '/practice/handsfree', icon: House, title: 'ながら練習', sub: '家事や身支度をしながら、耳と声で。時間を決めて流しっぱなし', group: 'ながら' },
  { key: 'listening', to: '/practice/listening', icon: Ear, title: 'リスニング', sub: '例文・会話を聞いて意味を選ぶ（10問）', group: '聞く' },
  { key: 'sounds', to: '/practice/sounds', icon: Waves, title: '聞き分け', sub: 'light / right など日本語にない音の区別。意味と例文つき', group: '聞く' },
  { key: 'dictation', to: '/practice/dictation', icon: Keyboard, title: 'ディクテーション', sub: '聞いた英文を書き取り、聞き逃した語を見つける', group: '聞く' },
  { key: 'audio', to: '/practice/audio', icon: Radio, title: '耳で復習', sub: '和訳を聞いて英語を思い出す。画面を見なくてよい', group: '聞く' },
  { key: 'compose', to: '/practice/compose', icon: PencilLine, title: '瞬間英作文', sub: '日本語を見て、すぐ英語で言う', group: '話す' },
  { key: 'speaking', to: '/practice/speaking', icon: Mic, title: '発音チェック', sub: 'お手本をまねて話し、単語・音ごとに採点', group: '話す' },
  { key: 'shadow', to: '/practice/speaking?mode=shadow', icon: AudioLines, title: 'シャドーイング', sub: '5つの手順で、聞こえた音をすぐ後から追う', group: '話す' },
]

export function PracticeRows({ keys }: { keys: string[] }) {
  return (
    <>
      {keys.map((k) => {
        const m = PRACTICE_MODES.find((x) => x.key === k)!
        const Icon = m.icon
        return <ListRow key={k} to={m.to} icon={<Icon />} title={m.title} sub={m.sub} />
      })}
    </>
  )
}
