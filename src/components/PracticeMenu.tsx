import { ArrowLeftRight, AudioLines, BadgeCheck, Ear, House, Keyboard, MessagesSquare, Mic, PencilLine, Radio, Waves, type LucideIcon } from 'lucide-react'
import { ListRow } from './ui'

/** 練習メニュー。ホームと練習の画面で同じ名前・アイコン・説明を使う */
export const PRACTICE_MODES: { key: string; to: string; icon: LucideIcon; title: string; sub: string; group: '聞く' | '話す' | 'ながら' | '単語' }[] = [
  { key: 'handsfree', to: '/practice/handsfree', icon: House, title: 'ながら練習', sub: '家事や身支度をしながら、耳と声で。時間を決めて流しっぱなし', group: 'ながら' },
  { key: 'check', to: '/study?mode=check', icon: BadgeCheck, title: '定着チェック', sub: '覚えたはずの単語を、意味の近い選択肢と新しい例文で確かめる', group: '単語' },
  { key: 'usage', to: '/practice/usage', icon: ArrowLeftRight, title: '使い分け', sub: 'borrow / lend など、日本語では同じになる英語の違い（10問）', group: '単語' },
  { key: 'listening', to: '/practice/listening', icon: Ear, title: 'リスニング', sub: '例文・会話を聞いて意味を選ぶ（10問）', group: '聞く' },
  { key: 'sounds', to: '/practice/sounds', icon: Waves, title: '聞き分け', sub: 'light / right など日本語にない音の区別。意味と例文つき', group: '聞く' },
  { key: 'dictation', to: '/practice/dictation', icon: Keyboard, title: 'ディクテーション', sub: '聞いた英文を書き取り、聞き逃した語を見つける', group: '聞く' },
  { key: 'audio', to: '/practice/audio', icon: Radio, title: '耳で復習', sub: '和訳を聞いて英語を思い出す。画面を見なくてよい', group: '聞く' },
  { key: 'chat', to: '/practice/chat', icon: MessagesSquare, title: 'AIと会話', sub: '場面を選んで AI と英語で話す。より自然な言い方を教えてくれる', group: '話す' },
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
