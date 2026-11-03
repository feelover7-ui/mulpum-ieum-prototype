// 합성 시연 데이터. 실제 기관·물품·사람이 아닙니다.
window.SEED = {
  orgs: {
    saebit: { name: '가상 새빛초등학교', short: '새빛초', district: '강서구' },
    neulbom: { name: '가상 늘봄중학교', short: '늘봄중', district: '양천구' },
    hangyeol: { name: '가상 한결도서관', short: '한결도서관', district: '강서구' },
    pureun: { name: '가상 푸른고등학교', short: '푸른고', district: '마포구' }
  },
  // 우리 기관(새빛초)에서 각 기관까지 거리(km). 주소 연결 전 시연용 가정값
  km: { saebit: 0, neulbom: 3.2, hangyeol: 1.8, pureun: 6.4 },
  users: [
    { id: 'u1', org: 'saebit', name: '김새빛', role: 'EDITOR' },
    { id: 'u2', org: 'saebit', name: '박검토', role: 'REVIEWER' }
  ],
  categories: { FURNITURE: '책상·의자·가구', ELECTRONICS: '컴퓨터·전자기기', OFFICE: '사무용품', EDUCATION: '교육·수업용품', OTHER: '기타 물품' },
  lots: [
    { id: 'L1', title: '이동식 화이트보드', cat: 'EDUCATION', org: 'hangyeol', ill: 'board', state: 'PUBLISHED', days: 0, verified: true, maker: '가상교구', model: 'WB-1200', desc: '수업 이동용 양면 화이트보드입니다. 바퀴와 잠금장치 확인했습니다.', groups: [{ cond: '양호', qty: 4, avail: 4 }, { cond: '사용감 있음', qty: 2, avail: 2 }] },
    { id: 'L2', title: '서류 보관 3단 이동서랍', cat: 'OFFICE', org: 'neulbom', ill: 'cab', state: 'PUBLISHED', days: 1, verified: true, maker: '가상가구', model: 'MD-3', desc: '열쇠가 있는 3단 서랍입니다. 열쇠 일부 분실(5개).', groups: [{ cond: '양호', qty: 10, avail: 10 }, { cond: '사용감 있음', qty: 5, avail: 5 }] },
    { id: 'L3', title: '24인치 모니터 (초기화 완료)', cat: 'ELECTRONICS', org: 'neulbom', ill: 'mon', state: 'PUBLISHED', days: 2, verified: true, maker: '가상전자', model: 'M24F', desc: '전산실 교체로 나온 모니터입니다. 케이블 포함.', groups: [{ cond: '양호', qty: 12, avail: 12 }] },
    { id: 'L4', title: '강당 의자', cat: 'FURNITURE', org: 'saebit', ill: 'chair', state: 'PUBLISHED', days: 4, verified: true, maker: '가상가구', model: 'AC-80', desc: '강당 리모델링으로 나온 접이식 의자입니다. 필요한 만큼 나눠요.', groups: [{ cond: '양호', qty: 50, avail: 50 }, { cond: '사용감 있음', qty: 30, avail: 20 }], by: 'u1' },
    { id: 'L5', title: '회의용 무선마이크 세트', cat: 'EDUCATION', org: 'saebit', ill: 'mic', state: 'PUBLISHED', days: 6, verified: true, maker: '가상음향', model: 'WM-2', desc: '수신기 1대와 마이크 2개 한 세트입니다.', groups: [{ cond: '양호', qty: 2, avail: 1 }, { cond: '사용감 있음', qty: 1, avail: 1 }], by: 'u1' },
    { id: 'L6', title: '교실 빔프로젝터', cat: 'ELECTRONICS', org: 'saebit', ill: 'proj', state: 'DRAFT', days: 0, verified: false, maker: '', model: 'EB-X41', desc: '전자칠판 교체로 나온 빔프로젝터입니다.', groups: [{ cond: '양호', qty: 3, avail: 3 }], by: 'u1' },
    { id: 'L7', title: '학생용 사물함 (2인)', cat: 'FURNITURE', org: 'saebit', ill: 'locker', state: 'REVIEW', days: 1, verified: false, maker: '가상가구', model: 'LK-2', desc: '복도 사물함 교체분입니다.', groups: [{ cond: '양호', qty: 8, avail: 8 }, { cond: '사용감 있음', qty: 4, avail: 4 }], by: 'u1' },
    { id: 'L8', title: '독서대 (원목)', cat: 'EDUCATION', org: 'pureun', ill: 'stand', state: 'PUBLISHED', days: 3, verified: true, maker: '가상목공', model: '', desc: '도서실 독서대입니다.', groups: [{ cond: '양호', qty: 20, avail: 20 }] },
    { id: 'L9', title: '사무용 책상 (1200)', cat: 'FURNITURE', org: 'pureun', ill: 'desk', state: 'PUBLISHED', days: 5, verified: true, maker: '가상가구', model: 'D-1200', desc: '교무실 책상 교체분입니다. 서랍 포함.', groups: [{ cond: '양호', qty: 6, avail: 6 }, { cond: '사용감 있음', qty: 4, avail: 4 }] },
    { id: 'L10', title: '스테이플러·천공기 묶음', cat: 'OFFICE', org: 'hangyeol', ill: 'stapler', state: 'PUBLISHED', days: 7, verified: true, maker: '', model: '', desc: '행정실 사무용품 정리분입니다.', groups: [{ cond: '양호', qty: 15, avail: 15 }] }
  ],
  transfers: [
    { id: 'T1', lot: 'L1', from: 'hangyeol', to: 'saebit', cond: '양호', qty: 2, purpose: '3학년 교실 보충수업용', date: '11/5(수) 오후', state: 'RESERVED', events: [
      { t: '11/1 10:12', who: '새빛초 김새빛', what: '신청 · 양호 2개', note: '3학년 교실 보충수업용' },
      { t: '11/2 09:40', who: '한결도서관 이담당', what: '예비 배정' }] },
    { id: 'T2', lot: 'L5', from: 'saebit', to: 'hangyeol', cond: '양호', qty: 1, purpose: '열람실 행사 안내용', date: '11/7(금) 오전', state: 'REQUESTED', events: [
      { t: '11/2 15:20', who: '한결도서관 이담당', what: '신청 · 양호 1개', note: '열람실 행사 안내용' }] },
    { id: 'T3', lot: 'L4', from: 'saebit', to: 'pureun', cond: '사용감 있음', qty: 10, purpose: '체육관 행사용', date: '10/30(목)', state: 'DONE', events: [
      { t: '10/24 11:00', who: '푸른고 최담당', what: '신청 · 사용감 있음 10개' },
      { t: '10/25 09:10', who: '새빛초 김새빛', what: '예비 배정' },
      { t: '10/30 14:00', who: '새빛초 김새빛', what: '인계 기록 · 사진 2장' },
      { t: '10/30 16:30', who: '푸른고 최담당', what: '인수 확인 · 10개' },
      { t: '10/31 10:00', who: '양 기관', what: '대장 반영 확인' }] }
  ]
};

window.ILL = {
  board: '<rect x="18" y="8" width="64" height="42" rx="3" fill="#fff" stroke="#8aa99a" stroke-width="4"/><path d="M34 50v20M66 50v20M26 72h16M58 72h16" stroke="#47665a" stroke-width="4" stroke-linecap="round"/>',
  cab: '<rect x="30" y="6" width="40" height="62" rx="4" fill="#c9d4cc"/><path d="M38 24h24M38 40h24M38 56h24" stroke="#7d9488" stroke-width="3" stroke-linecap="round"/><circle cx="36" cy="72" r="3" fill="#47665a"/><circle cx="64" cy="72" r="3" fill="#47665a"/>',
  chair: '<rect x="36" y="8" width="28" height="30" rx="5" fill="#a9c6b7"/><rect x="30" y="40" width="40" height="8" rx="3" fill="#6f9584"/><path d="M34 48l-4 26M66 48l4 26" stroke="#47665a" stroke-width="3.5" stroke-linecap="round"/>',
  mon: '<rect x="14" y="10" width="72" height="44" rx="4" fill="#2f4a3f"/><rect x="19" y="15" width="62" height="34" rx="2" fill="#dfeae4"/><path d="M50 54v12M36 68h28" stroke="#47665a" stroke-width="4" stroke-linecap="round"/>',
  mic: '<rect x="28" y="54" width="44" height="12" rx="3" fill="#2f4a3f"/><path d="M38 54V22M62 54V22" stroke="#47665a" stroke-width="5" stroke-linecap="round"/><ellipse cx="38" cy="18" rx="6" ry="9" fill="#8fb5a3"/><ellipse cx="62" cy="18" rx="6" ry="9" fill="#8fb5a3"/>',
  proj: '<rect x="18" y="28" width="64" height="30" rx="6" fill="#dfe7e1" stroke="#7d9488" stroke-width="3"/><circle cx="38" cy="43" r="9" fill="#2f4a3f"/><circle cx="38" cy="43" r="4" fill="#8fb5a3"/><path d="M58 38h16M58 46h10" stroke="#7d9488" stroke-width="3" stroke-linecap="round"/>',
  locker: '<rect x="22" y="6" width="56" height="66" rx="3" fill="#c9d4cc"/><path d="M50 6v66" stroke="#7d9488" stroke-width="3"/><path d="M30 18h12M58 18h12M30 24h12M58 24h12" stroke="#7d9488" stroke-width="2.5" stroke-linecap="round"/><circle cx="44" cy="42" r="2.5" fill="#47665a"/><circle cx="56" cy="42" r="2.5" fill="#47665a"/>',
  stand: '<path d="M26 54l10-38h28l10 38z" fill="#d8c3a3"/><path d="M22 56h56" stroke="#8c6f4c" stroke-width="5" stroke-linecap="round"/><path d="M40 26h20M38 34h24" stroke="#a88a63" stroke-width="2.5" stroke-linecap="round"/>',
  desk: '<rect x="10" y="22" width="80" height="8" rx="2" fill="#6f9584"/><rect x="58" y="30" width="26" height="30" rx="2" fill="#a9c6b7"/><path d="M62 40h18M62 50h18" stroke="#6f9584" stroke-width="2.5" stroke-linecap="round"/><path d="M16 30v40M84 60v10" stroke="#47665a" stroke-width="4" stroke-linecap="round"/>',
  stapler: '<rect x="14" y="44" width="40" height="12" rx="4" fill="#2f4a3f"/><path d="M14 44c4-12 30-14 40-4" fill="#8fb5a3"/><rect x="60" y="34" width="26" height="22" rx="3" fill="#c9d4cc"/><circle cx="68" cy="45" r="3" fill="#47665a"/><circle cx="78" cy="45" r="3" fill="#47665a"/>',
  box: '<path d="M20 30l30-14 30 14v28L50 72 20 58z" fill="#d9c9ae"/><path d="M20 30l30 14 30-14M50 44v28" fill="none" stroke="#a88a63" stroke-width="3"/>'
};
