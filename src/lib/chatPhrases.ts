/** AI と会話で「より自然な言い方」を保存したもの（この端末の localStorage にだけ残す。サーバーには送らない） */
export interface SavedPhrase {
  /** 自分が言った文 */
  said: string
  better: string
  note: string
  at: number
}

const KEY = 'chat-phrases'
const MAX = 100

export function loadPhrases(): SavedPhrase[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    return Array.isArray(v) ? (v as SavedPhrase[]).filter((p) => p && typeof p.better === 'string') : []
  } catch {
    return []
  }
}

function store(list: SavedPhrase[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    /* 保存できない環境（プライベートブラウズなど）では何もしない */
  }
}

/** 保存（同じ言い方は1つにまとめ、新しいものを先頭に） */
export function savePhrase(p: Omit<SavedPhrase, 'at'>): SavedPhrase[] {
  const list = [{ ...p, at: Date.now() }, ...loadPhrases().filter((x) => x.better !== p.better)]
  store(list)
  return list.slice(0, MAX)
}

export function removePhrase(better: string): SavedPhrase[] {
  const list = loadPhrases().filter((x) => x.better !== better)
  store(list)
  return list
}
