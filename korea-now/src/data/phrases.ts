// 오늘의 한국어 한마디 + 로컬 매너 팁 (날짜 기준으로 순환)

export interface Phrase {
  ko: string
  roman: string     // 로마자 발음
  en: string
  when: string      // 쓰는 상황
}

export const PHRASES: Phrase[] = [
  { ko: '안녕하세요', roman: 'an-nyeong-ha-se-yo', en: 'Hello', when: 'Entering any shop or restaurant' },
  { ko: '감사합니다', roman: 'gam-sa-ham-ni-da', en: 'Thank you', when: 'Everywhere. A slight nod goes with it.' },
  { ko: '이거 주세요', roman: 'i-geo ju-se-yo', en: 'This one, please', when: 'Pointing at a menu or a street-food stall' },
  { ko: '얼마예요?', roman: 'eol-ma-ye-yo', en: 'How much is it?', when: 'Markets, taxis, anywhere without a price tag' },
  { ko: '카드 돼요?', roman: 'ka-deu dwae-yo', en: 'Do you take cards?', when: 'Small shops and market stalls' },
  { ko: '포장해 주세요', roman: 'po-jang-hae ju-se-yo', en: 'To go, please', when: 'Cafés and restaurants' },
  { ko: '덜 맵게 해 주세요', roman: 'deol maep-ge hae ju-se-yo', en: 'Less spicy, please', when: 'Ordering tteokbokki, jjigae, anything red' },
  { ko: '화장실 어디예요?', roman: 'hwa-jang-sil eo-di-ye-yo', en: 'Where is the restroom?', when: 'Subway stations and malls have free ones' },
  { ko: '여기 세워 주세요', roman: 'yeo-gi se-wo ju-se-yo', en: 'Stop here, please', when: 'In a taxi' },
  { ko: '괜찮아요', roman: 'gwaen-chan-a-yo', en: "It's okay / No thanks", when: 'Declining a bag, a sample, or extra side dishes' },
  { ko: '잘 먹겠습니다', roman: 'jal meok-get-seum-ni-da', en: 'I will eat well (said before a meal)', when: 'Before eating — locals will smile' },
  { ko: '잘 먹었습니다', roman: 'jal meo-geot-seum-ni-da', en: 'I ate well (thank you for the meal)', when: 'Leaving a restaurant' },
  { ko: '천천히 말해 주세요', roman: 'cheon-cheon-hi mal-hae ju-se-yo', en: 'Please speak slowly', when: 'When someone answers in fast Korean' },
  { ko: '영어 메뉴 있어요?', roman: 'yeong-eo me-nyu i-sseo-yo', en: 'Is there an English menu?', when: 'Local restaurants outside tourist areas' },
]

export interface MannerTip {
  title: string
  body: string
}

export const MANNER_TIPS: MannerTip[] = [
  { title: 'Two hands', body: 'Hand over money or a card with two hands, or with your right hand supported by your left. It reads as polite.' },
  { title: 'No tipping', body: "Tipping isn't expected anywhere — restaurants, taxis, hotels. Prices already include service." },
  { title: 'Trash cans are rare', body: 'Carry a small bag for wrappers. Convenience stores and subway stations are your best bet.' },
  { title: 'Subway seats', body: 'Pink and dark-colored end seats are for the elderly, pregnant, and disabled. Leave them empty even if the train is full.' },
  { title: 'Quiet on transit', body: 'Phone calls on the subway are frowned upon. Text instead.' },
  { title: 'Shoes off', body: 'Remove shoes when entering a home, a temple hall, and some traditional restaurants with floor seating.' },
  { title: 'Chopsticks', body: "Don't stick chopsticks upright in rice — it's a funeral symbol. Rest them on the bowl edge." },
  { title: 'Side dishes are free', body: 'Banchan (side dishes) are refilled for free. Ask "더 주세요" (deo ju-se-yo) for more.' },
  { title: 'Escalator right side', body: 'Stand on the right, walk on the left — especially in Seoul subway stations.' },
  { title: 'Pushing is not rude', body: "Light bumping in crowded places is normal and not considered rude. Don't take it personally." },
  { title: 'Hanbok = free palace entry', body: 'Wearing rented hanbok gets you into all Seoul royal palaces for free. Rental shops cluster near Gyeongbokgung.' },
  { title: 'T-money card', body: 'Buy a T-money card at any convenience store (₩4,000) and top it up in cash. Works on buses, subways, taxis, and convenience stores nationwide.' },
]

// 오늘 날짜(한국 시각) 기준으로 항목을 고른다 — 같은 날엔 같은 문구
export function pickForToday<T>(list: T[], offset = 0): T {
  const seoulDay = Math.floor((Date.now() + 9 * 3600 * 1000) / 86400000)
  return list[(seoulDay + offset) % list.length]
}
