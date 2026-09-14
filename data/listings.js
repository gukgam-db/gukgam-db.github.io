/* =========================================================
   갈매역삼성부동산 — 매장 데이터 (코드로 관리)
   ✅ 가게 정보는 실제 값으로 반영됨.
   ⚠️ 아직 필요한 값: 중개사무소 등록번호(regNo), 카카오톡(kakao).
       - regNo: 공인중개사법상 광고에 '등록번호' 표기가 필수입니다.
       - kakao: 비워두면 카톡 버튼이 자동으로 숨겨집니다.
   ⚠️ 아래 LISTINGS(매물)는 예시입니다. 실제 매물로 교체하세요.
   ========================================================= */

const AGENCY = {
  name:   "갈매역삼성부동산",
  ceo:    "변유진",
  regNo:  "41310-2025-00034",                 // 중개사무소 등록번호
  addr:   "경기도 구리시 갈매순환로 202 로터스타워 104호",
  tel:    "0315754944",                         // 전화 버튼용(숫자만)
  telView:"031-575-4944",
  kakao:  "",                                    // 카카오톡 오픈채팅/채널 URL(있으면 넣기, 없으면 빈칸)
  hours:  "평일·토 09:00–18:30 (일·공휴일 휴무)",
  slogan: "갈매동, 발품은 저희가 — 좋은 집만 골라 드립니다",
  intro:  "갈매지구를 가장 잘 아는 갈매역삼성부동산입니다. 전세·월세·매매, 어렵게 생각 마시고 편하게 문의 주세요. 등기·시세 확인까지 꼼꼼히 도와드립니다."
};

/* 매물 목록 — ⚠️ 예시입니다. 실제 매물(사진·가격·조건)로 교체하세요.
   type: "매매" | "전세" | "월세"
   category: "아파트" | "빌라" | "원룸" | "오피스텔" | "상가" | "주택"
   price(만원): 매매가 또는 보증금 / rent(만원): 월세(월세일 때만)
   maintFee(만원): 관리비 / areaM2: 전용 / floor·totalFloor / direction / avail: 입주가능일
   lat·lng: 지도 좌표(갈매동 인근) / photo: 대표 이미지(없으면 "" → 자동 플레이스홀더)
*/
const LISTINGS = [
  { id:1, sample:true, type:"전세", category:"아파트", title:"갈매역 도보권 84㎡ 남향, 즉시입주",
    addr:"구리시 갈매동 ○○아파트", price:38000, rent:0, maintFee:12, areaM2:84, py:25,
    floor:11, totalFloor:20, rooms:3, baths:2, direction:"남향", avail:"즉시입주",
    options:["갈매역 도보권","대단지","올수리"], lat:37.6420, lng:127.1185,
    photo:"", desc:"채광 좋은 남향 로열층. 갈매역(경춘선) 도보권, 초등학교 인접. 깨끗한 세대입니다.",
    regDate:"2026-08-08" },

  { id:2, sample:true, type:"월세", category:"오피스텔", title:"신축 오피스텔 풀옵션, 관리비 저렴",
    addr:"구리시 갈매동 ○○시티", price:1000, rent:55, maintFee:7, areaM2:24, py:7,
    floor:8, totalFloor:15, rooms:1, baths:1, direction:"동남향", avail:"2026-09-01",
    options:["풀옵션","에어컨","세탁기","보안"], lat:37.6398, lng:127.1225,
    photo:"", desc:"보증금 1000/월 55. 관리비에 수도·인터넷 포함. 사회초년생·직장인 추천.",
    regDate:"2026-08-08" },

  { id:3, sample:true, type:"매매", category:"아파트", title:"학군지 59㎡ 급매, 실입주 가능",
    addr:"구리시 갈매동 ○○1단지", price:62000, rent:0, maintFee:10, areaM2:59, py:18,
    floor:7, totalFloor:25, rooms:3, baths:1, direction:"남동향", avail:"협의",
    options:["학군 우수","대단지","리모델링"], lat:37.6442, lng:127.1150,
    photo:"", desc:"급매로 나온 실입주 물건. 초·중 도보권, 상권 인접. 대출 상담 가능합니다.",
    regDate:"2026-08-07" },

  { id:4, sample:true, type:"전세", category:"빌라", title:"보증보험 가입 가능 투룸 전세",
    addr:"구리시 갈매동 ○○하우스", price:19000, rent:0, maintFee:5, areaM2:46, py:14,
    floor:3, totalFloor:4, rooms:2, baths:1, direction:"남서향", avail:"2026-10-01",
    options:["전세보증보험 가능","채광 우수","주차 가능"], lat:37.6455, lng:127.1205,
    photo:"", desc:"전세보증금 반환보증 가입 가능한 안전 매물. 신혼·소가족에게 적합합니다.",
    regDate:"2026-08-06" },

  { id:5, sample:true, type:"월세", category:"상가", title:"갈매순환로 1층 상가, 코너 자리",
    addr:"구리시 갈매동 ○○로", price:3000, rent:180, maintFee:15, areaM2:66, py:20,
    floor:1, totalFloor:10, rooms:0, baths:1, direction:"코너", avail:"즉시입주",
    options:["1층","코너","유동인구 많음"], lat:37.6410, lng:127.1240,
    photo:"", desc:"보증금 3000/월 180. 노출 좋은 코너 1층. 카페·편의점·사무실 추천.",
    regDate:"2026-08-05" }
];
