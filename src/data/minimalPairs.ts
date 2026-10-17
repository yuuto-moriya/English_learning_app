import type { Accent } from '@/lib/tts'

/**
 * 聞き分けトレーニング（高変動音声訓練：HVPT）の最小対語。
 * 日本語話者が区別しにくい英語の音の対立を選び、1つの音だけが違う語の組を集めた。
 * - 読み方が2通りある語（lead, live, close, row など）は、音声合成が意図と違う読みをするおそれがあるので入れない
 * - 母音の対立は米音で考えた組なので、米国の声だけで出題する（英国の音では組にならないものがある）
 */
export interface Contrast {
  id: string
  title: string
  /** 対立する2つの音（IPA） */
  symbols: [string, string]
  /** 聞き分け・発音のコツ */
  tip: string
  /** 出題に使う声のアクセント */
  accents: Accent[]
  /** [symbols[0] の語, symbols[1] の語] */
  pairs: [string, string][]
}

export const CONTRASTS: Contrast[] = [
  {
    id: 'l-r',
    title: 'L と R',
    symbols: ['l', 'r'],
    tip: 'L は舌先を上の歯ぐきにつけたまま声を出す。R は舌先をどこにもつけず、少し奥に引いて唇を丸める。R の前では音がこもって聞こえる。',
    accents: ['en-US', 'en-GB'],
    pairs: [
      ['light', 'right'],
      ['long', 'wrong'],
      ['lock', 'rock'],
      ['glass', 'grass'],
      ['fly', 'fry'],
      ['play', 'pray'],
      ['collect', 'correct'],
      ['cloud', 'crowd'],
      ['lamp', 'ramp'],
      ['belly', 'berry'],
      ['alive', 'arrive'],
      ['load', 'road'],
      ['late', 'rate'],
      ['lane', 'rain'],
      ['flight', 'fright'],
      ['glow', 'grow'],
      ['climb', 'crime'],
    ],
  },
  {
    id: 'b-v',
    title: 'B と V',
    symbols: ['b', 'v'],
    tip: 'B は両唇を閉じてからはじく。V は上の前歯を下唇に軽く当て、すき間から声を出し続ける。V の方が音が少し長く続く。',
    accents: ['en-US', 'en-GB'],
    pairs: [
      ['berry', 'very'],
      ['best', 'vest'],
      ['boat', 'vote'],
      ['ban', 'van'],
      ['bet', 'vet'],
      ['curb', 'curve'],
      ['bat', 'vat'],
      ['bend', 'vend'],
      ['marble', 'marvel'],
    ],
  },
  {
    id: 's-th',
    title: 'S と TH（無声）',
    symbols: ['s', 'θ'],
    tip: 'TH は舌先を上の前歯に軽く当て、すき間から息だけを出す。S は舌を歯の裏に近づけるだけで、鋭い「スー」という音になる。',
    accents: ['en-US', 'en-GB'],
    pairs: [
      ['sink', 'think'],
      ['sick', 'thick'],
      ['sing', 'thing'],
      ['mouse', 'mouth'],
      ['pass', 'path'],
      ['sum', 'thumb'],
      ['seem', 'theme'],
      ['sank', 'thank'],
      ['face', 'faith'],
      ['moss', 'moth'],
    ],
  },
  {
    id: 'd-dh',
    title: 'D・Z と TH（有声）',
    symbols: ['d / z', 'ð'],
    tip: '有声の TH は、舌先を歯に当てたまま声を出す。D は歯ぐきを一瞬はじき、Z は舌を歯の裏に近づけて「ズー」と出す。',
    accents: ['en-US', 'en-GB'],
    pairs: [
      ['day', 'they'],
      ['den', 'then'],
      ['dare', 'there'],
      ['dough', 'though'],
      ['ladder', 'lather'],
      ['breeze', 'breathe'],
    ],
  },
  {
    id: 's-sh',
    title: 'S と SH（スィ と シ）',
    symbols: ['s', 'ʃ'],
    tip: 'sea は「シー」ではなく「スィー」。SH は唇を丸めて前に突き出し、舌を少し奥に引く。日本語の「シ」は SH に近い。',
    accents: ['en-US', 'en-GB'],
    pairs: [
      ['sea', 'she'],
      ['seat', 'sheet'],
      ['sip', 'ship'],
      ['sin', 'shin'],
      ['sell', 'shell'],
      ['save', 'shave'],
      ['sock', 'shock'],
      ['sign', 'shine'],
      ['mass', 'mash'],
      ['sore', 'shore'],
      ['sort', 'short'],
    ],
  },
  {
    id: 'ae-uh',
    title: 'cat の母音と cut の母音',
    symbols: ['æ', 'ʌ'],
    tip: 'æ（cat）は口を横に大きく開けて「エ」と「ア」の間。ʌ（cut）は口を軽く開けて短く「ア」。æ の方が長く、明るく聞こえる。',
    accents: ['en-US'],
    pairs: [
      ['cap', 'cup'],
      ['hat', 'hut'],
      ['bag', 'bug'],
      ['cat', 'cut'],
      ['ran', 'run'],
      ['match', 'much'],
      ['fan', 'fun'],
      ['lack', 'luck'],
      ['track', 'truck'],
      ['ankle', 'uncle'],
      ['mad', 'mud'],
      ['cab', 'cub'],
    ],
  },
  {
    id: 'ih-ee',
    title: 'ship の母音と sheep の母音',
    symbols: ['ɪ', 'iː'],
    tip: 'iː（sheep）は唇を横に引いて長めに「イー」。ɪ（ship）は力を抜いて短く、「イ」と「エ」の間のような音。長さより音色の違いに注目。',
    accents: ['en-US', 'en-GB'],
    pairs: [
      ['ship', 'sheep'],
      ['sit', 'seat'],
      ['fill', 'feel'],
      ['hit', 'heat'],
      ['bit', 'beat'],
      ['chip', 'cheap'],
      ['fit', 'feet'],
      ['lip', 'leap'],
      ['still', 'steal'],
      ['rich', 'reach'],
      ['slip', 'sleep'],
      ['hill', 'heal'],
    ],
  },
  {
    id: 'aw-oh',
    title: 'law の母音と low の母音',
    symbols: ['ɔː', 'oʊ'],
    tip: 'oʊ（low）は「オウ」と動く二重母音。ɔː（law）は口を縦に開けて伸ばす「オー」で、アメリカ英語では「アー」に近く聞こえることも多い。',
    accents: ['en-US'],
    pairs: [
      ['law', 'low'],
      ['bought', 'boat'],
      ['caught', 'coat'],
      ['called', 'cold'],
      ['walk', 'woke'],
      ['saw', 'so'],
      ['ball', 'bowl'],
      ['hall', 'hole'],
    ],
  },
]
