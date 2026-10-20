/**
 * AI と会話で直された間違いの種類を、この端末にだけ記録する（サーバーには送らない）。
 * 1週間の中で多い種類を「最近多い間違い」として最初の画面に出す（日本人の話す英語では冠詞・単複・前置詞・時制が多い）
 */
export const ERROR_INFO: Record<string, { label: string; tip: string }> = {
  article: { label: '冠詞（a / the）', tip: '数えられる名詞が1つなら a、話の中で決まっているものには the' },
  plural: { label: '単数・複数（-s）', tip: '2つ以上なら -s。water・information などは数えない' },
  tense: { label: '時制', tip: '終わったことは過去形。今も続いていることは現在完了も' },
  preposition: { label: '前置詞（in / on / at など）', tip: 'at 7・on Monday・in May のように、組み合わせで覚える' },
  agreement: { label: '主語と動詞（三単現の s）', tip: 'he / she / it が主語なら、動詞に -s' },
  'word-order': { label: '語順', tip: '主語 → 動詞 → 目的語。疑問文は語順が変わる' },
  'word-choice': { label: '言葉の選び方', tip: '日本語をそのまま訳した言い方に注意' },
  'missing-word': { label: '語の抜け', tip: 'to・be 動詞・主語の抜けに注意' },
  other: { label: 'その他', tip: '' },
}

const KEY = 'chat-errors'
const KEEP_DAYS = 60

interface Entry {
  type: string
  at: number
}

function load(): Entry[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    return Array.isArray(v) ? (v as Entry[]).filter((e) => e && typeof e.type === 'string' && typeof e.at === 'number') : []
  } catch {
    return []
  }
}

export function recordError(type: string | undefined) {
  if (!type || !ERROR_INFO[type]) return
  const since = Date.now() - KEEP_DAYS * 86_400_000
  const list = [...load().filter((e) => e.at >= since), { type, at: Date.now() }]
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(-500)))
  } catch {
    /* 保存できない環境では何もしない */
  }
}

/** 直近 days 日の種類ごとの回数（多い順。「その他」は除く） */
export function errorSummary(days = 7, entries: Entry[] = load()): { type: string; count: number }[] {
  const since = Date.now() - days * 86_400_000
  const counts = new Map<string, number>()
  for (const e of entries) if (e.at >= since && e.type !== 'other') counts.set(e.type, (counts.get(e.type) ?? 0) + 1)
  return [...counts].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count)
}
