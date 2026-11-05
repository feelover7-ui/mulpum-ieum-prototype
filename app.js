(function () {
  'use strict';
  var KEY = 'mulpum-prototype-v1';
  var SEED = window.SEED, ILL = window.ILL;
  var S = load();
  var ui = { q: '', cat: '', sort: 'near', goodOnly: false, many: false, favOnly: false, mineTab: 'DRAFT', dealTab: 'in', help: false, cond: {}, qty: {}, draft: null, step: 0, tour: { open: !/[?&]embed=1/.test(location.search), i: 0 }, boardF: 'all', boardCol: 'me' };

  // ── 저장 ──
  function fresh() { var s = JSON.parse(JSON.stringify(SEED)); s.me = null; s.fav = ['L3']; s.seq = 100; return s; }
  function load() { try { var v = JSON.parse(localStorage.getItem(KEY)); if (v && v.lots) return v; } catch (e) {} return fresh(); }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  // ── 도우미 ──
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function icon(name) {
    var p = {
      home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
      box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>', swap: '<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
      more: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>', plus: '<path d="M12 5v14M5 12h14"/>',
      help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>', back: '<path d="M15 18l-6-6 6-6"/>',
      heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>', shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
      x: '<path d="M6 6l12 12M18 6L6 18"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', sheet: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16M4 15h16M10 3v18"/>', rows: '<path d="M4 6h16M4 12h16M4 18h10"/>', grid: '<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="10" y="4" width="5" height="10" rx="1.5"/><rect x="17" y="4" width="4" height="13" rx="1.5"/>', truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>'
    }[name];
    return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>';
  }
  function ill(name) { return '<svg viewBox="0 0 100 80" aria-hidden="true">' + (ILL[name] || ILL.box) + '</svg>'; }
  function org(id) { return S.orgs[id]; }
  function me() { return S.users.filter(function (u) { return u.id === S.me; })[0]; }
  function myOrg() { return me().org; }
  function lot(id) { return S.lots.filter(function (l) { return l.id === id; })[0]; }
  function deal(id) { return S.transfers.filter(function (t) { return t.id === id; })[0]; }
  function avail(l) { return l.groups.reduce(function (s, g) { return s + (/비공개/.test(g.cond) ? 0 : g.avail); }, 0); }
  function km(o) { return S.km[o] || 0; }
  function ago(d) { return d === 0 ? '오늘' : d === 1 ? '어제' : d + '일 전'; }
  function now() { var d = new Date(); return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function toast(t) { var el = $('#toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { el.hidden = true; }, 2400); }
  function go(h) { location.hash = h; }

  // ── 상태 표시 (13개 상태 → 7단계 + 예외) ──
  var STEPS = ['등록', '검토', '나눔', '신청·배정', '인계', '인수', '완료'];
  var PILL = {
    DRAFT: ['작성 중', 'gray'], REVIEW: ['검토 대기', 'amber'], PUBLISHED: ['나눔 중', 'green'], PAUSED: ['게시 중단', 'mute'], CLOSED: ['끝남', 'mute'],
    REQUESTED: ['신청 접수', 'blue'], RESERVED: ['예비 배정', 'blue'], SENT: ['인계됨 · 인수 대기', 'blue'], RECEIVED: ['인수 확인', 'blue'],
    DONE: ['완료', 'deep'], DISPUTED: ['수량 불일치', 'red'], DECLINED: ['선정 안 됨', 'mute'], CANCELLED: ['신청 취소', 'mute']
  };
  function pill(st) { var p = PILL[st] || [st, 'gray']; return '<span class="pill p-' + p[1] + '">' + p[0] + '</span>'; }
  function stepIndex(st) { return { DRAFT: 0, REVIEW: 1, PUBLISHED: 2, PAUSED: 2, CLOSED: 2, REQUESTED: 3, RESERVED: 3, SENT: 4, RECEIVED: 5, DISPUTED: 5, DONE: 7, DECLINED: 3, CANCELLED: 3 }[st]; }
  function stepper(st, labels) {
    var c = stepIndex(st), x = st === 'DISPUTED';
    return '<div class="stepper" aria-label="진행 단계: ' + (PILL[st] || [st])[0] + '">' + (labels || STEPS).map(function (s, i) {
      var cls = i < c ? 'd' : i === c ? (x ? 'x' : 'c') : '';
      return '<div class="s ' + cls + '"><i></i>' + s + '</div>';
    }).join('') + '</div>';
  }
  function mini(st) {
    var c = stepIndex(st), x = st === 'DISPUTED';
    var h = '<div class="mini" aria-hidden="true">';
    for (var i = 0; i < 7; i++) h += '<i class="' + (i < c ? 'd' : i === c ? (x ? 'x' : 'c') : '') + '"></i>';
    return h + '</div>';
  }

  // ── 할 일 계산 ──
  function myTurn(t) {
    var mine = myOrg(), sender = t.from === mine, receiver = t.to === mine;
    if (sender && t.state === 'REQUESTED') return '선정해 주세요';
    if (sender && t.state === 'RESERVED') return '인계를 기록해 주세요';
    if (receiver && t.state === 'SENT') return '받은 수량을 확인해 주세요';
    if ((sender || receiver) && t.state === 'RECEIVED') return '대장 반영을 확인해 주세요';
    if ((sender || receiver) && t.state === 'DISPUTED') return '수량 불일치를 풀어 주세요';
    return '';
  }
  function theirTurn(t) {
    var mine = myOrg();
    if (t.to === mine && (t.state === 'REQUESTED')) return '상대 기관이 선정 중';
    if (t.to === mine && (t.state === 'RESERVED')) return '상대 기관이 인계 준비 중';
    if (t.from === mine && t.state === 'SENT') return '상대 기관이 인수 확인 중';
    return '';
  }
  function reviewQueue() { var u = me(); return u.role === 'REVIEWER' ? S.lots.filter(function (l) { return l.org === u.org && l.state === 'REVIEW' && l.by !== u.id; }) : []; }
  function myDrafts() { return S.lots.filter(function (l) { return l.org === myOrg() && l.state === 'DRAFT'; }); }
  function myDeals() { return S.transfers.filter(function (t) { return t.from === myOrg() || t.to === myOrg(); }); }
  function todoCount() { return reviewQueue().length + myDeals().filter(function (t) { return myTurn(t); }).length; }

  // ── 틀: 위 머리줄 메뉴(데스크톱) + 아래 탭(휴대폰) ──
  var NAV = [['home', '홈', 'home'], ['market', '물품 찾기', 'search'], ['board', '우리 기관 보드', 'grid'], ['more', '더보기', 'more']];
  var CRUMB = { home: '홈', market: '물품 찾기', lot: '물품', board: '우리 기관 보드', deal: '주고받기', more: '더보기', 'new': '물품 올리기' };
  function shell(route, body, opts) {
    var u = me(), todo = todoCount();
    var active = function (id) { return route === id || (id === 'market' && route === 'lot') || (id === 'board' && route === 'deal'); };
    var badge = function (id) { return (id === 'home' || id === 'board') && todo ? '<span class="ct">' + todo + '</span>' : ''; };
    return '<div class="shell' + (opts && opts.sticky ? ' has-sticky' : '') + (route === 'board' ? ' is-board' : '') + '">' +
      '<header class="hd"><div class="hd-in"><a class="logo" href="#/home"><img src="favicon.svg" alt="">물품이음</a>' +
      '<nav class="hd-nav" aria-label="주 메뉴">' + NAV.map(function (n) { return '<a class="' + (active(n[0]) ? 'on' : '') + '" href="#/' + n[0] + '"' + (active(n[0]) ? ' aria-current="page"' : '') + '>' + n[1] + badge(n[0]) + '</a>'; }).join('') + '</nav>' +
      '<span class="sp"></span>' +
      (todo ? '<a class="todo-pill" href="#/home">할 일 ' + todo + '</a>' : '') +
      '<button class="iconbtn" data-act="help" aria-label="도움말 열기" title="도움말">' + icon('help') + '</button>' +
      '<a class="btn ink new-btn" href="#/new">' + icon('plus') + '올리기</a>' +
      '<span class="who" title="' + esc(org(u.org).name) + '">' + esc(org(u.org).short) + ' ' + esc(u.name) + '<small>' + (u.role === 'REVIEWER' ? '업무 검토자' : '물품 담당자') + '</small></span></div></header>' +
      '<div class="demo"><b>시안</b>모든 기관·물품·사람은 가상이에요. 실제 행정처리가 아니에요.</div>' +
      '<main class="page" id="main" tabindex="-1">' + body + '</main>' +
      '<nav class="tabbar" aria-label="모바일 메뉴">' +
      [['home', '홈', 'home'], ['market', '찾기', 'search'], ['new', '올리기', 'plus'], ['board', '보드', 'grid'], ['more', '더보기', 'more']].map(function (n) {
        var inner = n[0] === 'new' ? '<span class="plus">' + icon('plus') + '</span>' : icon(n[2]);
        return '<a class="' + (active(n[0]) || route === n[0] ? 'on' : '') + '" href="#/' + n[0] + '">' + inner + n[1] + (n[0] === 'board' ? badge('board') : '') + '</a>';
      }).join('') + '</nav>' + (opts && opts.stickyHtml ? opts.stickyHtml : '') + '</div>' + (ui.help ? helpDrawer(route) : '');
  }

  // ── 로그인 ──
  function vLogin() {
    return '<div class="login"><div class="l"><div class="logo big"><img src="favicon.svg" alt="">물품이음</div>' +
      '<div><h1>우리 학교의 물건이,<br>다른 학교의 <em>새로운 쓰임</em>으로.</h1><p>불용결정된 물건을 사진으로 찾고, 필요한 만큼 신청하고, 두 기관의 인계와 증빙까지 한 곳에서 이어 가요.</p></div>' +
      '<div class="login-tiles">' + ['board', 'mon', 'chair', 'stand'].map(function (k, i) { return '<div class="tile c' + (i + 1) + '">' + ill(k) + '</div>'; }).join('') + '</div></div>' +
      '<div class="r"><h2>시연 계정으로 둘러보기</h2><p class="mut">계정을 고르면 바로 들어가요.</p>' +
      S.users.map(function (u) { return '<button class="acct" data-act="login" data-id="' + u.id + '"><span class="av">' + esc(u.name.slice(0, 1)) + '</span><span><b>' + esc(u.name) + ' 선생님 · ' + (u.role === 'REVIEWER' ? '업무 검토자' : '물품 담당자') + '</b><span>' + esc(org(u.org).name) + ' · ' + (u.role === 'REVIEWER' ? '게시 전 증빙을 확인해요' : '물건을 올리고, 신청하고, 보내요') + '</span></span></button>'; }).join('') +
      '<p class="notice amber">가상 데이터로 만든 시안이에요. 실제 행정자료는 넣지 마세요. 입력한 내용은 이 브라우저에만 저장돼요.</p></div></div>';
  }

  // ── 할 일 목록 (홈 인사말·보드 공통) ──
  var VERB = { REQUESTED: '선정하기', RESERVED: '인계 기록하기', SENT: '받은 수량 확인', RECEIVED: '대장 반영 확인', DISPUTED: '불일치 확인' };
  function short(s) { return s.replace(/\s*\(.*?\)\s*/g, '').replace(/ 세트$/, '').split(' ').slice(-2).join(' '); }
  function tasks() {
    var u = me(), out = [];
    reviewQueue().forEach(function (l) { out.push({ href: '#/lot/' + l.id, label: short(l.title) + ' 검토하기', say: short(l.title) + ' 검토' }); });
    myDeals().filter(myTurn).forEach(function (t) { var l = lot(t.lot); out.push({ href: '#/deal/' + t.id, label: short(l.title) + ' ' + VERB[t.state], say: (t.from === myOrg() ? org(t.to).short + '에 보낼 ' : '') + short(l.title) + ' ' + VERB[t.state].replace('하기', ''), stop: t.state === 'DISPUTED' }); });
    if (u.role !== 'REVIEWER') myDrafts().forEach(function (l) { out.push({ href: '#/lot/' + l.id, label: short(l.title) + ' 마저 쓰기', say: short(l.title) + ' 마저 쓰기', soft: true }); });
    return out;
  }

  // ── 홈: 인사(3번 말투) + 사진 피드(1번) ──
  function vHome() {
    var u = me(), list = tasks(), hard = list.filter(function (x) { return !x.soft; });
    var mine = S.lots.filter(function (l) { return l.org === myOrg() && l.state === 'PUBLISHED'; }).sort(function (a, b) { return avail(b) - avail(a); })[0];
    var incoming = myDeals().filter(function (t) { return t.to === myOrg() && ['REQUESTED', 'RESERVED', 'SENT'].indexOf(t.state) >= 0; })[0];
    var given = S.transfers.filter(function (t) { return t.from === myOrg() && t.state === 'DONE'; }).reduce(function (s, t) { return s + t.qty; }, 0);
    var hero = hard.length
      ? '<h1>오늘은 <em>' + hard.length + '가지</em>만 하면 돼요</h1><p>' + esc(hard.map(function (x) { return x.say; }).join(', ')) + (hard.length > 1 ? '가 남았어요.' : '만 남았어요.') + '</p>'
      : '<h1>오늘은 <em>할 일이 없어요</em></h1><p>' + (list.length ? esc(list[0].say) + '는 시간 날 때 이어서 하면 돼요. ' : '') + '가까운 학교에 새로 나온 물건을 둘러보세요.</p>';
    var btns = (hard.length ? hard : list).slice(0, 2).map(function (x, i) { return '<a class="btn ' + (i ? 'white' : 'pri') + ' lg" href="' + x.href + '">' + esc(x.label) + '</a>'; }).join('') || '<a class="btn pri lg" href="#/market">물건 둘러보기</a>';
    var near = S.lots.filter(function (l) { return l.org !== myOrg() && l.state === 'PUBLISHED' && avail(l) > 0; }).sort(function (a, b) { return a.days - b.days || km(a.org) - km(b.org); }).slice(0, 7);
    return '<section class="hello"><div>' + '<p class="hi">' + esc(org(u.org).short) + ' ' + esc(u.name) + ' 선생님, 안녕하세요</p>' + hero + '<div class="row">' + btns + '</div></div><div class="hello-art">' + ill('box') + '</div></section>' +
      '<section class="bubbles">' +
      '<a class="bubble peach" href="' + (mine ? '#/lot/' + mine.id : '#/board') + '"><small>나눔 중</small><b>' + (mine ? esc(short(mine.title)) + ' ' + avail(mine) + '개' : '나눌 물건이 없어요') + '</b><span>' + (mine ? (function (n) { return n ? '신청 ' + n + '건이 들어와 있어요' : '아직 신청은 없어요'; })(dealsOf(mine).filter(function (t) { return t.state === 'REQUESTED'; }).length) : '안 쓰는 물건을 올려 보세요') + '</span></a>' +
      '<a class="bubble sky" href="' + (incoming ? '#/deal/' + incoming.id : '#/market') + '"><small>받는 중</small><b>' + (incoming ? esc(short(lot(incoming.lot).title)) + ' ' + incoming.qty + '개' : '받는 물건이 없어요') + '</b><span>' + (incoming ? esc(incoming.date) + '에 받아요' : '필요한 물건을 찾아보세요') + '</span></a>' +
      '<a class="bubble gray" href="#/board"><small>이번 달</small><b>' + given + '개를 이어 줬어요</b><span>' + (given ? '다른 학교에서 다시 쓰이고 있어요' : '첫 나눔을 기다려요') + '</span></a></section>' +
      '<section class="feed-head"><div><h2>우리 동네 학교에 새로 나온 물건</h2><p class="mut">' + esc(org(u.org).short) + '에서 가까운 순 · 오늘 ' + near.filter(function (l) { return l.days === 0; }).length + '건 새로 올라왔어요</p></div><a class="btn" href="#/market">전체 보기</a></section>' +
      '<section class="mosaic">' + near.map(function (l, i) { return tile(l, i === 0); }).join('') + (near.length && near.length < 7 ? '<a class="tile more-tile" href="#/market"><b>물건 전체 보기 →</b><span>' + marketList().length + '건이 나눔 중이에요</span></a>' : '') + '</section>';
  }
  var CATC = { FURNITURE: 'c1', ELECTRONICS: 'c2', OFFICE: 'c4', EDUCATION: 'c5', OTHER: 'c3' };
  function tile(l, big) {
    var own = l.org === myOrg(), fav = S.fav.indexOf(l.id) >= 0;
    return '<div class="tile-wrap' + (big ? ' big' : '') + '"><a class="tile ' + CATC[l.cat] + '" href="#/lot/' + l.id + '" aria-label="' + esc(l.title) + ', ' + avail(l) + '개, ' + (own ? '우리 기관' : km(l.org) + 'km') + '">' +
      '<span class="km">' + (own ? '우리' : km(l.org) + 'km') + '</span>' + ill(l.ill) +
      '<span class="cap"><b>' + esc(l.title) + '</b><span class="q">' + avail(l) + '개</span></span></a>' +
      '<button class="heart ' + (fav ? 'on' : '') + '" data-act="fav" data-id="' + l.id + '" aria-label="관심물품 ' + (fav ? '빼기' : '담기') + '" aria-pressed="' + fav + '">' + icon('heart') + '</button></div>';
  }
  function dealsOf(l) { return S.transfers.filter(function (t) { return t.lot === l.id; }); }

  // ── 물품 찾기: 사진 먼저(1번) ──
  function marketList() {
    var q = ui.q.trim();
    return S.lots.filter(function (l) {
      if (l.state !== 'PUBLISHED' || avail(l) === 0) return false;
      if (ui.favOnly && S.fav.indexOf(l.id) < 0) return false;
      if (ui.goodOnly && !l.groups.some(function (g) { return g.cond === '양호' && g.avail > 0; })) return false;
      if (ui.many && avail(l) < 10) return false;
      if (q && (l.title + ' ' + l.model + ' ' + l.maker + ' ' + org(l.org).name + ' ' + SEED.categories[l.cat]).indexOf(q) < 0) return false;
      return true;
    });
  }
  function vMarket() {
    var base = marketList(), list = base.filter(function (l) { return !ui.cat || l.cat === ui.cat; });
    var own = function (l) { return l.org === myOrg() ? 1 : 0; };
    list.sort(ui.sort === 'near' ? function (a, b) { return own(a) - own(b) || km(a.org) - km(b.org) || a.days - b.days; } : ui.sort === 'new' ? function (a, b) { return a.days - b.days; } : function (a, b) { return avail(b) - avail(a); });
    var counts = {}; base.forEach(function (l) { counts[l.cat] = (counts[l.cat] || 0) + 1; });
    return '<div class="market-head"><h1 class="h1">무엇이 필요하세요?</h1>' +
      '<div class="search">' + icon('search') + '<input type="search" id="q" placeholder="의자, 모니터, 모델명, 기관 이름" value="' + esc(ui.q) + '" aria-label="물품 검색"></div></div>' +
      '<div class="chips" role="group" aria-label="분류"><button class="chip ' + (!ui.cat ? 'on' : '') + '" data-act="cat" data-v="">전체 ' + base.length + '</button>' +
      Object.keys(SEED.categories).map(function (k) { return '<button class="chip ' + (ui.cat === k ? 'on' : '') + '" data-act="cat" data-v="' + k + '"' + (counts[k] ? '' : ' disabled') + '>' + SEED.categories[k] + ' ' + (counts[k] || 0) + '</button>'; }).join('') + '</div>' +
      '<div class="between"><div class="chips" role="group" aria-label="걸러 보기">' +
      '<button class="chip line ' + (ui.goodOnly ? 'on' : '') + '" data-act="toggle" data-k="goodOnly">양호만</button>' +
      '<button class="chip line ' + (ui.many ? 'on' : '') + '" data-act="toggle" data-k="many">10개 이상</button>' +
      '<button class="chip line ' + (ui.favOnly ? 'on' : '') + '" data-act="toggle" data-k="favOnly">♥ 관심 ' + S.fav.length + '</button></div>' +
      '<select id="sort" aria-label="정렬" class="sort"><option value="near"' + (ui.sort === 'near' ? ' selected' : '') + '>가까운 순</option><option value="new"' + (ui.sort === 'new' ? ' selected' : '') + '>최근 순</option><option value="many"' + (ui.sort === 'many' ? ' selected' : '') + '>많은 순</option></select></div>' +
      (list.length ? '<div class="grid-feed">' + list.map(function (l) {
        return '<div class="item">' + tile(l) + '<a class="item-meta" href="#/lot/' + l.id + '"><span>' + esc(org(l.org).short) + ' · ' + org(l.org).district + ' · ' + ago(l.days) + '</span>' + (l.verified ? '<span class="ok">' + icon('shield') + '증빙 확인</span>' : '') + '<span class="conds">' + l.groups.filter(function (g) { return !/비공개/.test(g.cond) && g.avail; }).map(function (g) { return '<i>' + g.cond.replace(' 있음', '') + ' ' + g.avail + '</i>'; }).join('') + '</span></a></div>';
      }).join('') + '</div>' : '<div class="card empty">' + emptyArt() + '<b>조건에 맞는 물건이 없어요</b>검색어를 줄이거나 걸러 보기를 풀어 보세요.</div>');
  }

  // ── 물품 상세: 큰 사진 + 오른쪽 받기 칸 ──
  function shipCost(k, n) { var lo = Math.round((20000 + k * 4000 + n * 3000) / 10000), hi = Math.round((30000 + k * 6000 + n * 5000) / 10000); return '약 ' + lo + '만~' + hi + '만 원'; }
  function orgCard(o, label) { return '<div class="org-card"><span class="av">' + esc(org(o).short.slice(0, 1)) + '</span><span><small>' + label + '</small><b>' + esc(org(o).name) + '</b><span>' + org(o).district + (o === myOrg() ? ' · 우리 기관' : ' · 우리 학교에서 ' + km(o) + 'km') + '</span></span></div>'; }
  function vLot(id) {
    var l = lot(id); if (!l) return notFound();
    var own = l.org === myOrg(), u = me();
    var groups = l.groups.filter(function (g) { return !/비공개/.test(g.cond); });
    var sel = ui.cond[id] != null ? ui.cond[id] : Math.max(0, groups.findIndex(function (g) { return g.avail > 0; }));
    var g = groups[sel] || groups[0], max = g ? g.avail : 0, n = Math.min(ui.qty[id] || 1, Math.max(max, 1));
    var others = S.lots.filter(function (x) { return x.org === l.org && x.id !== l.id && x.state === 'PUBLISHED' && avail(x) > 0; }).slice(0, 3);
    var head = '<a class="back" href="' + (own ? '#/board' : '#/market') + '">' + icon('back') + (own ? '우리 기관 보드' : '물품 찾기') + '</a>';
    var left = '<div class="lot-main">' +
      '<div class="lot-photo tile ' + CATC[l.cat] + '">' + ill(l.ill) + '<span class="km">' + (own ? '우리' : km(l.org) + 'km') + '</span>' + (l.verified ? '<span class="ok-badge">' + icon('shield') + '불용 증빙 확인</span>' : '') + '</div>' +
      '<div class="lot-title"><span class="cat">' + SEED.categories[l.cat] + ' · ' + ago(l.days) + ' 올라왔어요</span><h1>' + esc(l.title) + '</h1>' +
      '<div class="cond-row">' + l.groups.map(function (x) { return '<span class="' + (/비공개/.test(x.cond) ? 'hide' : '') + '"><b>' + x.cond.replace(' · 비공개', '') + '</b> ' + x.qty + '개' + (/비공개/.test(x.cond) ? ' · 우리만 봄' : '') + '</span>'; }).join('') + '</div></div>' +
      '<section class="story"><h2>이런 물건이에요</h2><p>' + esc(l.desc) + '</p><dl class="spec"><div><dt>제조사</dt><dd>' + esc(l.maker || '모름') + '</dd></div><div><dt>모델</dt><dd>' + esc(l.model || '모름') + '</dd></div><div><dt>인계 장소</dt><dd>' + esc(org(l.org).short) + ' · 세부 장소는 협의해요</dd></div><div><dt>지금 단계</dt><dd>' + (PILL[l.state] || [''])[0] + '</dd></div></dl>' + stepper(l.state) + '</section>' +
      orgCard(l.org, '주는 곳') +
      (others.length ? '<section><h2 class="sec-h">' + esc(org(l.org).short) + '의 다른 물건</h2><div class="mini-feed">' + others.map(function (x) { return tile(x); }).join('') + '</div></section>' : '') +
      (own && dealsOf(l).length ? '<section class="story"><h2>이 물건의 주고받기</h2><div class="list">' + dealsOf(l).map(function (t) { return '<a class="li" href="#/deal/' + t.id + '" style="grid-template-columns:minmax(0,1fr) auto"><div><b>' + esc(org(t.to).short) + ' · ' + t.cond + ' ' + t.qty + '개</b><span class="s">' + esc(t.purpose) + '</span>' + mini(t.state) + '</div>' + pill(t.state) + '</a>'; }).join('') + '</div></section>' : '') +
      '</div>';
    var right, sticky = '';
    if (!own && l.state === 'PUBLISHED') {
      right = '<aside class="side-panel"><section class="ask"><div class="avail">이어 받을 수 있어요<b>' + avail(l) + '<small>개</small></b></div>' +
        '<div class="fld"><span>어떤 상태로 받을까요?</span><div class="seg">' + groups.map(function (x, i) { return '<button data-act="cond" data-id="' + id + '" data-i="' + i + '" class="' + (i === sel ? 'on' : '') + '"' + (x.avail ? '' : ' disabled') + '><b>' + x.cond + '</b><span>' + x.avail + '개 있어요</span></button>'; }).join('') + '</div></div>' +
        '<div class="fld"><span>몇 개 필요하세요?</span><div class="stepperq"><button data-act="qty" data-id="' + id + '" data-d="-1" aria-label="하나 줄이기">−</button><input type="number" id="qty" value="' + n + '" min="1" max="' + max + '" aria-label="필요 수량"><button data-act="qty" data-id="' + id + '" data-d="1" aria-label="하나 늘리기">＋</button></div></div>' +
        '<div class="fld"><span>어디에 쓰실 건가요?</span><textarea id="purpose" placeholder="예: 3학년 교실 보충수업용">3학년 교실 보충수업용</textarea></div>' +
        '<div class="fld"><span>언제 받으면 좋을까요?</span><input type="text" id="pdate" value="11/7(금) 오후"></div>' +
        '<div class="ship">' + icon('truck') + '<span style="flex:1">예상 배송비 · ' + km(l.org) + 'km · ' + n + '개</span><b>' + shipCost(km(l.org), n) + '</b></div>' +
        '<p class="fine">배송비는 시연용 가정 단가예요. 확정 견적이 아니에요.</p>' +
        '<button class="btn ink lg req-btn" data-act="request" data-id="' + id + '">' + n + '개 받기 신청</button></section></aside>';
      sticky = '<div class="sticky-cta"><span class="btn" style="flex:0 0 auto">' + (g ? g.cond.replace(' 있음', '') : '') + ' ' + n + '개</span><button class="btn ink" data-act="request" data-id="' + id + '">' + n + '개 받기 신청</button></div>';
    } else if (own) {
      var act = '';
      if (l.state === 'DRAFT') act = '<p class="say">아직 우리 기관만 보는 초안이에요. 불용 증빙을 붙이고 검토를 요청하면 다른 학교에 보여요.</p><button class="btn ink lg" data-act="submit-review" data-id="' + id + '">검토 요청하기</button>';
      else if (l.state === 'REVIEW' && u.role === 'REVIEWER' && l.by !== u.id) act = '<p class="say">게시하기 전에 세 가지만 확인해 주세요.</p><div class="checks"><label class="chk"><input type="checkbox" class="rv">불용결정 결재 원문을 확인했어요</label><label class="chk"><input type="checkbox" class="rv">대상 목록과 실제 물건을 맞춰 봤어요</label><label class="chk"><input type="checkbox" class="rv">사진에 개인정보가 없어요</label></div><button class="btn ink lg" data-act="approve" data-id="' + id + '">확인했어요, 게시하기</button><button class="btn" data-act="reject" data-id="' + id + '">고쳐 달라고 하기</button>';
      else if (l.state === 'REVIEW') act = '<p class="say">다른 업무 검토자가 증빙을 확인하면 게시돼요. 작성자는 스스로 게시할 수 없어요.</p><p class="fine">시연: 더보기에서 「박검토」 선생님으로 바꾸면 검토할 수 있어요.</p>';
      else if (l.state === 'PUBLISHED') act = '<p class="say">다른 학교에서 찾을 수 있게 나눔 중이에요.</p><button class="btn" data-act="pause" data-id="' + id + '">잠시 멈추기</button>';
      else if (l.state === 'PAUSED') act = '<p class="say">나눔을 잠시 멈췄어요.</p><button class="btn ink lg" data-act="resume" data-id="' + id + '">다시 나누기</button>';
      right = '<aside class="side-panel"><section class="ask"><div class="avail">남은 수량<b>' + avail(l) + '<small>개</small></b></div>' + pill(l.state) + act + '</section>' +
        (l.state === 'PAUSED' || l.state === 'CLOSED' ? '<div class="help"><b>남은 물건은 매각 준비로</b><span>나눔이 끝나고 남은 수량은 온비드 매각 검토 자료(설명·사진·수량)로 묶을 수 있어요.</span></div>' : '') + '</aside>';
    } else right = '<aside class="side-panel"><div class="notice">지금은 신청할 수 없는 물건이에요.</div></aside>';
    return { html: head + '<div class="detail">' + left + right + '</div>', sticky: sticky };
  }

  // ── 우리 기관 보드: 단계별 칸(2번) ──
  var COLS = [['prep', '작성·검토'], ['pub', '나눔 중'], ['req', '신청·배정'], ['move', '인계·인수'], ['done', '끝남']];
  function boardItems() {
    var u = me(), mine = myOrg(), items = [];
    S.lots.filter(function (l) { return l.org === mine; }).forEach(function (l) {
      var col = l.state === 'DRAFT' || l.state === 'REVIEW' ? 'prep' : l.state === 'PUBLISHED' ? 'pub' : 'done';
      var turn = l.state === 'REVIEW' && u.role === 'REVIEWER' && l.by !== u.id ? '검토해 주세요' : l.state === 'DRAFT' && u.role !== 'REVIEWER' ? '마저 써 주세요' : '';
      var wait = dealsOf(l).filter(function (t) { return t.state === 'REQUESTED'; }).length;
      items.push({ col: col, href: '#/lot/' + l.id, ill: l.ill, title: l.title, sub: l.state === 'PUBLISHED' ? avail(l) + '개 남음 · ' + ago(l.days) + ' 올림' + (wait ? ' · 신청 ' + wait : '') : (PILL[l.state] || [''])[0] + ' · ' + l.groups.map(function (g) { return g.cond.replace(' 있음', '') + ' ' + g.qty; }).join(' · '), turn: turn, soft: l.state === 'DRAFT', dir: 'lot', state: l.state });
    });
    myDeals().forEach(function (t) {
      var l = lot(t.lot), out = t.from === mine, col = { REQUESTED: 'req', RESERVED: 'req', SENT: 'move', RECEIVED: 'move', DISPUTED: 'move' }[t.state] || 'done';
      items.push({ col: col, href: '#/deal/' + t.id, ill: l.ill, title: short(l.title) + (out ? ' → ' : ' ← ') + org(out ? t.to : t.from).short, sub: t.cond.replace(' 있음', '') + ' ' + t.qty + '개 · ' + t.date, turn: myTurn(t), wait: theirTurn(t), stop: t.state === 'DISPUTED', dir: out ? 'out' : 'in', state: t.state, faded: t.state === 'DECLINED' || t.state === 'CANCELLED' });
    });
    return items;
  }
  function vBoard() {
    var all = boardItems(), f = ui.boardF;
    var hard = function (x) { return x.turn && !x.soft; };
    var shown = all.filter(function (x) { return f === 'all' || (f === 'me' ? hard(x) : x.dir === f); });
    var turnN = all.filter(hard).length;
    var given = S.transfers.filter(function (t) { return t.from === myOrg() && t.state === 'DONE'; }).reduce(function (s, t) { return s + t.qty; }, 0);
    var card = function (x) {
      return '<a class="bcard' + (x.turn ? (x.soft ? ' soft' : ' me') : '') + (x.stop ? ' stop' : '') + (x.faded ? ' faded' : '') + '" href="' + x.href + '"><span class="th">' + ill(x.ill) + '</span><span class="tx"><b>' + esc(x.title) + '</b><span>' + esc(x.sub) + '</span></span>' +
        (x.turn ? '<span class="turn">' + (x.soft ? '' : '내 차례 · ') + esc(x.turn) + '</span>' : x.wait ? '<span class="turn them">' + esc(x.wait) + '</span>' : x.faded ? '<span class="turn them">' + (PILL[x.state] || [''])[0] + '</span>' : '') + '</a>';
    };
    var mcol = ui.boardCol;
    var mobileList = mcol === 'me' ? all.filter(hard) : all.filter(function (x) { return x.col === mcol; });
    return '<div class="board-bar"><h1 class="h1">우리 기관 보드</h1><div class="chips" role="group" aria-label="걸러 보기">' +
      [['all', '전체'], ['me', '내 차례만 ' + turnN], ['out', '보내는 것'], ['in', '받는 것']].map(function (o) { return '<button class="chip line ' + (f === o[0] ? 'on' : '') + '" data-act="bf" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') +
      '</div><span class="sp"></span><a class="btn sm" href="#/new" data-act="entry-ledger">대장에서 고르기</a></div>' +
      '<div class="kpi"><div><span>내 차례</span><b class="' + (turnN ? 'hot' : '') + '">' + turnN + '</b></div><div><span>나눔 중</span><b>' + all.filter(function (x) { return x.col === 'pub'; }).length + '</b></div><div><span>이번 달 이어 준 수량</span><b>' + given + '개</b></div><div><span>멈춤</span><b class="' + (all.some(function (x) { return x.stop; }) ? 'red' : '') + '">' + all.filter(function (x) { return x.stop; }).length + '</b></div></div>' +
      '<div class="board">' + COLS.map(function (c) { var xs = shown.filter(function (x) { return x.col === c[0]; }); return '<section class="col"><h2>' + c[1] + '<em>' + xs.length + '</em></h2>' + (xs.length ? xs.map(card).join('') : '<p class="col-empty">없어요</p>') + '</section>'; }).join('') + '</div>' +
      '<div class="board-m"><div class="chips" role="tablist" aria-label="단계">' + [['me', '내 차례 ' + turnN]].concat(COLS).map(function (c) { return '<button role="tab" aria-selected="' + (mcol === c[0]) + '" class="chip ' + (mcol === c[0] ? 'on' : '') + '" data-act="bcol" data-v="' + c[0] + '">' + c[1] + '</button>'; }).join('') + '</div>' +
      (mobileList.length ? mobileList.map(card).join('') : '<div class="card empty">' + emptyArt() + '<b>' + (mcol === 'me' ? '지금 내 차례인 일이 없어요' : '이 단계에 있는 건이 없어요') + '</b>' + (mcol === 'me' ? '홈에서 새로 나온 물건을 둘러보세요.' : '') + '</div>') + '</div>';
  }

  function vDeal(id) {
    var t = deal(id); if (!t) return notFound();
    var l = lot(t.lot), mine = myOrg(), sender = t.from === mine, mt = myTurn(t), other = org(sender ? t.to : t.from).short;
    var next = { REQUESTED: '선정', RESERVED: '인계 기록', SENT: '인수 확인', RECEIVED: '대장 반영 확인', DISPUTED: '수량 불일치 해결' }[t.state];
    var say = '', act = '';
    if (sender && t.state === 'REQUESTED') { say = other + '에서 ' + t.cond + ' ' + t.qty + '개를 기다리고 있어요. 보내 줄 수 있으면 예비 배정해 주세요.'; act = '<button class="btn ink lg" data-act="reserve" data-id="' + id + '">' + t.qty + '개 예비 배정</button><button class="btn" data-act="decline" data-id="' + id + '">이번엔 어려워요</button>'; }
    else if (sender && t.state === 'RESERVED') { say = '물건을 건넸으면 사진과 함께 기록해 주세요. 그다음은 ' + other + '가 받은 수량을 확인해요.'; act = '<label class="chk"><input type="checkbox" id="photo-ok">인계 사진을 붙였어요 (시연)</label><button class="btn ink lg" data-act="send" data-id="' + id + '">' + t.qty + '개 보냈어요</button>'; }
    else if (!sender && t.state === 'SENT') { say = other + '에서 ' + t.qty + '개를 보냈어요. 실제로 받은 수량을 세어 적어 주세요.'; act = '<div class="fld"><span>실제로 받은 수량</span><div class="stepperq"><input type="number" id="rq" value="' + t.qty + '" min="0" max="' + t.qty + '" aria-label="받은 수량"></div></div><button class="btn ink lg" data-act="receive" data-id="' + id + '">받은 수량 확인</button><p class="fine">보낸 수량과 다르면 「수량 불일치」로 잠시 멈추고 양쪽이 확인해요.</p>'; }
    else if (t.state === 'RECEIVED') { say = '거의 다 왔어요. 에듀파인에서 관리전환(' + (sender ? '불용·반출' : '취득') + ')을 처리하고 확인해 주세요.'; act = '<label class="chk"><input type="checkbox" id="ledger-ok">에듀파인 처리를 마쳤어요</label><button class="btn ink lg" data-act="done" data-id="' + id + '">대장 반영 확인</button>'; }
    else if (t.state === 'DISPUTED') { say = '보낸 수량과 받은 수량이 달라 잠시 멈췄어요. 실물을 다시 세어 확인해 주세요.'; act = '<button class="btn ink lg" data-act="resolve" data-id="' + id + '">전부 받은 걸 확인했어요</button>'; }
    else if (!sender && t.state === 'REQUESTED') { say = other + '가 보내 줄지 정하는 중이에요. 필요 없어졌으면 취소할 수 있어요.'; act = '<button class="btn warn" data-act="cancel" data-id="' + id + '">신청 취소</button>'; }
    else if (!sender && t.state === 'RESERVED') say = other + '가 보낼 준비를 하고 있어요. ' + t.date + '에 받기로 했어요.';
    else if (sender && t.state === 'SENT') say = other + '가 받은 수량을 확인하면 다음 단계로 넘어가요.';
    var done = t.state === 'DONE';
    var evs = t.events.map(function (e) { return '<div class="ev' + (/불일치/.test(e.what) ? ' x' : '') + '"><i></i><div><b>' + esc(e.what) + '</b><span>' + esc(e.who) + (e.note ? ' · "' + esc(e.note) + '"' : '') + '</span></div><span class="mut" style="font-size:12px">' + esc(e.t) + '</span></div>'; }).join('');
    if (next && !done) evs += '<div class="ev now"><i></i><div><b>' + next + ' 기다리는 중</b><span>' + (mt ? '우리 차례' : other + ' 차례') + '</span></div>' + (mt ? '<span class="pill p-amber">내 차례</span>' : '<span class="pill p-gray">상대 차례</span>') + '</div>';
    var helpBox = sender
      ? '<div class="help"><b>보낸 다음 우리 기관이 할 일</b><ol><li>물품이음에서 인계 기록 (사진)</li><li>' + esc(other) + '가 받은 수량 확인</li><li>에듀파인에서 관리전환 반출 처리</li><li>「대장 반영 확인」</li></ol></div>'
      : '<div class="help"><b>받은 다음 우리 기관이 할 일</b><ol><li>물품이음에서 받은 수량 확인</li><li>에듀파인에서 관리전환 취득 등록</li><li>「대장 반영 확인」</li></ol><span>메뉴 위치와 서식은 오른쪽 위 「?」에서 근거와 함께 볼 수 있어요.</span></div>';
    return '<a class="back" href="#/board">' + icon('back') + '우리 기관 보드</a>' +
      '<div class="deal-head"><div class="tile ' + CATC[l.cat] + '">' + ill(l.ill) + '</div><div><span class="cat">' + (sender ? '보내는 물건' : '받는 물건') + ' · ' + t.cond + ' ' + t.qty + '개 · ' + esc(t.date) + '</span><h1>' + esc(l.title) + '</h1><a class="mut" href="#/lot/' + l.id + '">물건 자세히 보기 →</a></div>' + pill(t.state) + '</div>' +
      (done ? '<section class="celebrate"><div class="burst" aria-hidden="true">' + '<i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>' + '</div><b>끝까지 이어 줬어요!</b><p>' + esc(l.title) + ' ' + t.qty + '개가 ' + esc(org(t.to).short) + '에서 다시 쓰여요. 두 기관 대장 반영까지 마쳤어요.</p></section>' : '') +
      '<div class="parties2">' + orgCard(t.from, '보내는 곳' + (sender ? ' (우리)' : '')) + '<span class="arrow" aria-hidden="true">→</span>' + orgCard(t.to, '받는 곳' + (!sender ? ' (우리)' : '')) + '</div>' +
      '<section class="story">' + stepper(t.state) + '</section>' +
      '<div class="deal-grid"><section class="story"><h2>지금까지</h2><div class="tl">' + evs + '</div></section>' +
      '<div class="deal-side">' + (say ? '<section class="ask now-card' + (mt ? ' mine' : '') + (t.state === 'DISPUTED' ? ' stop' : '') + '"><span class="label">' + (mt ? '내 차례' : done ? '끝' : '상대 차례') + '</span><p class="say">' + esc(say) + '</p>' + act + '</section>' : '') + helpBox + '</div></div>';
  }

  // ── 올리기 마법사 ──
  var WSTEPS = ['어떻게 올릴까요?', '어떤 물건인가요?', '몇 개씩 있나요?', '불용 증빙', '확인하고 요청'];
  function newDraft(entry) { return { entry: entry || 'photo', ill: 'proj', title: '', cat: 'ELECTRONICS', maker: '', model: '', desc: '', q: { '양호': 3, '사용감 있음': 0, '수리검토 · 비공개': 0, '미확인 · 비공개': 0 }, ev: [false, false, false], ledger: [] }; }
  function vNew() {
    var d = ui.draft || (ui.draft = newDraft()), st = ui.step;
    var steps = '<nav class="steps" aria-label="등록 단계"><span class="steps-bar"><i style="width:' + (st / 4 * 100) + '%"></i></span>' + WSTEPS.map(function (s, i) { return '<button data-act="wstep" data-i="' + i + '" class="' + (i < st ? 'd' : i === st ? 'c' : '') + '"' + (i === st ? ' aria-current="step"' : '') + '><b>' + (i < st ? '✓' : i + 1) + '</b>' + s + '</button>'; }).join('') + '</nav>';
    var body = '', help = '';
    if (st === 0) {
      body = '<div class="entry">' + [['photo', '사진으로', '현장에서 찍어 한 건씩 올려요', 'camera'], ['excel', '에듀파인 엑셀로', '불용결정 목록 파일로 여러 건을 한 번에', 'sheet'], ['ledger', '대장에서 고르기', '가져온 자산 행을 골라서 바로', 'rows']].map(function (e) { return '<button data-act="entry" data-v="' + e[0] + '" class="' + (d.entry === e[0] ? 'on' : '') + '"><span class="ic">' + icon(e[3]) + '</span><b>' + e[1] + '</b><span>' + e[2] + '</span></button>'; }).join('') + '</div>';
      if (d.entry === 'photo') body += '<div class="fld"><span>사진을 골라 주세요 (시안이라 예시 사진이에요)</span><div class="pickphotos">' + ['proj', 'desk', 'locker', 'stand', 'mon', 'box'].map(function (k) { return '<button class="ill ' + (d.ill === k ? 'on' : '') + '" data-act="pick" data-v="' + k + '" aria-label="예시 사진 ' + k + '">' + ill(k) + '</button>'; }).join('') + '</div></div>';
      else body += '<div class="fld"><span>' + (d.entry === 'excel' ? '「불용결정목록_2026.xlsx」에서 읽은 행 (예시)' : '가져온 대장 자산 행 (예시)') + '</span><div class="tscroll"><table class="ledger"><thead><tr><th></th><th>물품분류번호</th><th>품명</th><th>수량</th><th>취득일</th></tr></thead><tbody>' +
        [['43211902', '컴퓨터 모니터', 6, '2017-03-02'], ['56101504', '학생용 의자', 24, '2015-02-20'], ['45111609', '빔프로젝터', 3, '2018-08-14']].map(function (r, i) { return '<tr><td><input type="checkbox" class="lg" data-i="' + i + '"' + (d.ledger.indexOf(i) >= 0 ? ' checked' : '') + ' aria-label="' + r[1] + ' 선택"></td><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>'; }).join('') + '</tbody></table></div><p class="fine">원본 대장의 품명·번호·수량은 바꾸지 않고 그대로 보관해요.</p></div>';
      help = '<b>어디로 들어와도 같아요</b><ol><li>어느 입구로 시작해도 다음 단계는 같아요</li><li>엑셀·대장으로 여러 행을 고르면 행마다 초안이 생겨요</li><li>사진은 기기 밖 AI로 보내지 않아요 (시안)</li></ol>';
    } else if (st === 1) {
      body = '<div class="w-photo"><div class="tile c2">' + ill(d.ill) + '</div><div class="fld"><span>다른 학교가 찾기 쉬운 이름</span><input type="text" id="w-title" value="' + esc(d.title) + '" placeholder="예: 교실 빔프로젝터">' +
        '<div class="ai">AI 제안 · 사진에서 읽은 이름: <b>교실 빔프로젝터 (EB-X41)</b><button class="btn sm" data-act="ai">넣기</button></div></div></div>' +
        '<div class="grid2"><label class="fld"><span>분류</span><select id="w-cat">' + Object.keys(SEED.categories).map(function (k) { return '<option value="' + k + '"' + (d.cat === k ? ' selected' : '') + '>' + SEED.categories[k] + '</option>'; }).join('') + '</select></label>' +
        '<label class="fld"><span>제조사</span><input type="text" id="w-maker" value="' + esc(d.maker) + '" placeholder="모르면 비워 두세요"></label>' +
        '<label class="fld"><span>모델명</span><input type="text" id="w-model" value="' + esc(d.model) + '" placeholder="명판을 보고 입력"></label></div>' +
        '<label class="fld"><span>설명</span><textarea id="w-desc" placeholder="상태, 부속품, 주의할 점">' + esc(d.desc) + '</textarea></label>';
      help = '<b>이것만 기억해 주세요</b><ol><li>공식 대장 품명은 그대로 둬요. 여기는 찾기 쉬운 이름이에요</li><li>AI 제안은 참고예요. 「넣기」를 눌러야 들어가요</li><li>사진 속 이름표·개인정보는 가려 주세요</li></ol>';
    } else if (st === 2) {
      body = '<div class="qrows">' + Object.keys(d.q).map(function (k) { var hid = /비공개/.test(k); return '<div class="qrow' + (hid ? ' hid' : '') + '"><span><b>' + k.replace(' · 비공개', '') + '</b><small>' + (hid ? '다른 학교에 보이지 않아요' : '다른 학교에 보여요') + '</small></span><input type="number" min="0" class="wq" data-k="' + k + '" value="' + d.q[k] + '" aria-label="' + k + ' 수량"></div>'; }).join('') + '</div>' +
        '<p class="fine">모두 <b id="qsum">' + sumQ(d) + '</b>개 · 다른 학교에 보이는 건 ' + sumQ(d, true) + '개예요</p>';
      help = '<b>상태별로 나눠 적어요</b><ol><li>한 묶음 안에서 상태별 수량을 적어요</li><li>수리검토·미확인은 다른 학교에 보이지 않아요</li><li>대장 수량과 다르면 다음 단계에서 사유를 남겨요</li></ol>';
    } else if (st === 3) {
      body = '<p class="say">불용결정이 끝나고 증빙을 확인하기 전에는 우리 기관에만 보여요. 아래 세 가지를 확인해 주세요.</p><div class="checks">' +
        [['불용결정 결재 원문(PDF)을 붙였어요 (시연)'], ['결정 대상목록과 실제 물건을 맞춰 봤어요'], ['사진·설명에 개인정보와 보안정보가 없어요']].map(function (c, i) { return '<label class="chk"><input type="checkbox" class="wev" data-i="' + i + '"' + (d.ev[i] ? ' checked' : '') + '>' + c[0] + '</label>'; }).join('') + '</div>';
      help = '<b>에듀파인에서 받는 법</b><ol><li>물품관리 › 불용결정 › 결재 문서</li><li>대상목록을 엑셀로 내려받기</li><li>PDF로 저장해 여기에 붙이기</li></ol><span>메뉴 이름은 기관 설정에 따라 다를 수 있어요.</span>';
    } else {
      var ok = d.title && sumQ(d, true) > 0 && d.ev.every(Boolean);
      body = '<div class="w-photo"><div class="tile c2">' + ill(d.ill) + '</div><div><b style="font-size:19px">' + esc(d.title || '(이름 없음)') + '</b><p class="mut">' + SEED.categories[d.cat] + (d.model ? ' · ' + esc(d.model) : '') + '</p><p class="mut">' + Object.keys(d.q).filter(function (k) { return d.q[k] > 0; }).map(function (k) { return k + ' ' + d.q[k]; }).join(' · ') + '</p></div></div>' +
        (ok ? '<p class="say">다 됐어요! 검토를 요청하면 우리 기관의 다른 업무 검토자가 증빙을 확인하고 게시해요.</p>' : '<div class="notice amber">' + [!d.title && '물건 이름(2단계)', !(sumQ(d, true) > 0) && '다른 학교에 보일 수량(3단계)', !d.ev.every(Boolean) && '증빙 확인 3가지(4단계)'].filter(Boolean).join(', ') + '만 채우면 검토를 요청할 수 있어요.</div>') +
        '<div class="row"><button class="btn ink lg" data-act="finish"' + (ok ? '' : ' disabled') + '>검토 요청하기</button><button class="btn" data-act="save-draft">초안으로 저장</button></div>';
      help = '<b>요청하고 나면</b><ol><li>작성자는 스스로 게시할 수 없어요</li><li>검토자가 확인하면 「나눔 중」이 돼요</li><li>진행은 홈과 보드에서 볼 수 있어요</li></ol>';
    }
    var nav = st < 4 ? '<div class="between"><button class="btn" data-act="wprev"' + (st ? '' : ' disabled') + '>이전</button><button class="btn ink lg" data-act="wnext">다음: ' + WSTEPS[st + 1] + '</button></div>' : '<div><button class="btn" data-act="wprev">이전</button></div>';
    return '<div class="between"><div><h1 class="h1">안 쓰는 물건, 올려 볼까요?</h1><p class="sub">입력하면 자동으로 저장돼요. 게시 전까지는 우리 기관만 봐요.</p></div></div>' + steps +
      '<div class="wiz"><section class="wcard"><h2>' + WSTEPS[st] + '</h2>' + body + nav + '</section><aside class="help">' + help + '</aside></div>';
  }
  function sumQ(d, pub) { return Object.keys(d.q).reduce(function (s, k) { return s + (pub && /비공개/.test(k) ? 0 : (+d.q[k] || 0)); }, 0); }
  function readWizard() {
    var d = ui.draft; if (!d) return;
    if ($('#w-title')) { d.title = $('#w-title').value.trim(); d.cat = $('#w-cat').value; d.maker = $('#w-maker').value.trim(); d.model = $('#w-model').value.trim(); d.desc = $('#w-desc').value.trim(); }
    $$('.wq').forEach(function (i) { d.q[i.dataset.k] = Math.max(0, +i.value || 0); });
    $$('.wev').forEach(function (i) { d.ev[+i.dataset.i] = i.checked; });
    var lg = $$('.lg'); if (lg.length) d.ledger = lg.filter(function (i) { return i.checked; }).map(function (i) { return +i.dataset.i; });
  }
  function draftFromLedger(d) {
    var rows = [['컴퓨터 모니터', 'ELECTRONICS', 'mon', 6], ['학생용 의자', 'FURNITURE', 'chair', 24], ['빔프로젝터', 'ELECTRONICS', 'proj', 3]];
    if (d.entry !== 'photo' && d.ledger.length && !d.title) { var r = rows[d.ledger[0]]; d.title = r[0]; d.cat = r[1]; d.ill = r[2]; d.q['양호'] = r[3]; }
  }

  // ── 더보기·도움 ──
  function vMore() {
    var u = me();
    return '<div><h1 class="h1">더보기</h1><p class="sub">계정·연결·시연 데이터</p></div>' +
      '<section class="card"><h2 class="label" style="margin-bottom:8px">시연 계정 바꾸기</h2><div style="display:grid;gap:8px">' + S.users.map(function (x) { return '<button class="acct" data-act="login" data-id="' + x.id + '"' + (x.id === u.id ? ' style="border-color:var(--a);background:var(--as)"' : '') + '><span class="av">' + esc(x.name.slice(0, 1)) + '</span><span><b>' + esc(x.name) + ' · ' + (x.role === 'REVIEWER' ? '업무 검토자' : '물품 담당자') + (x.id === u.id ? ' (지금)' : '') + '</b><span>' + esc(org(x.org).name) + '</span></span></button>'; }).join('') + '</div></section>' +
      '<section class="card"><h2 class="label" style="margin-bottom:8px">외부 연결 상태 (시안)</h2>' + [['K-에듀파인', '미연결 · 엑셀로 대체'], ['조달청 물품목록', '미연결'], ['온비드', '미연결 · 매각 검토 자료만'], ['AI 도우미', '근거 검색만 · 외부 전송 없음']].map(function (r) { return '<div class="between" style="padding:8px 0;border-top:1px solid var(--l)"><span>' + r[0] + '</span><span class="pill p-gray">' + r[1] + '</span></div>'; }).join('') + '</section>' +
      '<section class="card"><h2 class="label" style="margin-bottom:8px">이 시안에 대해</h2><p>물품이음 전면 개선안을 눌러 볼 수 있게 만든 시안입니다. 개선 이유와 결정할 점은 <a href="proposal.html" style="color:var(--a);font-weight:700">개선안 문서</a>에 있습니다.</p><div class="row" style="margin-top:12px"><button class="btn" data-act="reset">시연 데이터 처음으로</button><button class="btn" data-act="logout">로그아웃</button></div></section>';
  }
  var HELP = {
    home: [['오늘 할 일은 무엇을 세나요?', '내가 눌러야 하는 것만 셉니다. 상대 기관 차례인 건은 아래 초록 안내 줄에 따로 보여 줍니다.']],
    market: [['「증빙 확인」 표시는 무슨 뜻인가요?', '주는 기관의 다른 검토자가 불용결정 원문과 대상목록을 확인하고 게시했다는 뜻입니다.'], ['거리는 어떻게 계산하나요?', '시안에서는 기관 간 가정 거리입니다. 주소·경로 연결 후 실제 거리로 바뀝니다.']],
    lot: [['배송비는 확정 금액인가요?', '아닙니다. 크기·수량·거리로 낸 예상 범위이고, 실제 운송업체 견적이 아닙니다.']],
    deal: [['받은 뒤 에듀파인에서 무엇을 하나요?', '관리전환 취득 등록을 합니다. 메뉴 이름과 서식은 기관 설정에 따라 다를 수 있어 담당 부서 안내를 함께 확인하세요.'], ['수량이 다르면?', '「수량 불일치」로 멈춥니다. 양쪽이 실물을 다시 세고, 전량을 받았으면 정상 인수로 바꿉니다.']],
    'new': [['AI 제안은 바로 저장되나요?', '아닙니다. 「넣기」를 눌러야 입력칸에 들어가고, 공식 대장 품명·번호·수량은 바꾸지 않습니다.']]
  };
  function helpDrawer(route) {
    var items = (HELP[route] || []).concat([['이 시안의 데이터는 어디에 저장되나요?', '이 브라우저에만 저장됩니다. 더보기에서 처음으로 되돌릴 수 있습니다.']]);
    return '<div class="drawer-bg" data-act="help"></div><aside class="drawer" role="dialog" aria-label="도움말"><div class="between"><h2 style="font-size:18px">도움말</h2><button class="iconbtn" data-act="help" aria-label="닫기">' + icon('x') + '</button></div>' +
      '<p class="mut" style="font-size:13px">지금 화면에 맞는 질문입니다. AI 답변은 근거 문서와 함께 보여 줍니다 (시안).</p>' +
      items.map(function (q, i) { return '<details' + (i ? '' : ' open') + '><summary>' + esc(q[0]) + '</summary><p>' + esc(q[1]) + '</p><div class="src">근거: 물품이음 사용 안내 (시안)</div></details>'; }).join('') + '</aside>';
  }
  function emptyArt() { return '<span class="empty-art">' + ill('box') + '<i></i><i></i><i></i></span>'; }
  function notFound() { return '<div class="card empty">' + emptyArt() + '<b>찾을 수 없어요</b><a class="btn" href="#/home" style="margin-top:12px">홈으로</a></div>'; }

  // ── 시연 안내 ──
  var TOUR = [
    { t: '시작하기', d: '가상 학교 「새빛초」의 물품 담당자 김새빛 선생님으로 들어가요. 시연 데이터도 처음 상태로 맞춰요.', go: function () { S = fresh(); S.me = 'u1'; save(); ui.draft = null; ui.step = 0; ui.boardF = 'all'; ui.boardCol = 'me'; go('#/home'); } },
    { t: '홈: 오늘 할 일', d: '들어오자마자 「오늘은 1가지만 하면 돼요」처럼 말을 걸어요. 버튼을 누르면 그 일로 바로 가요. 아래에는 가까운 학교에 새로 나온 물건이 사진으로 펼쳐져요.', go: function () { go('#/home'); } },
    { t: '내 차례 처리하기', d: '한결도서관이 우리 마이크 1개를 신청했어요. 「1개 예비 배정」을 눌러 보세요. 진행 막대와 기록이 함께 바뀌어요.', go: function () { go('#/deal/T2'); } },
    { t: '물품 찾기', d: '사진이 먼저 보여요. 거리와 남은 수량이 사진 위에, 증빙 확인과 상태별 수량은 아래에 있어요. 「가까운 순」과 「양호만」을 눌러 보세요.', go: function () { go('#/market'); } },
    { t: '물건 받기 신청', d: '상태를 큰 버튼으로 고르고 수량을 정하면 예상 배송비가 바로 나와요. 「받기 신청」을 누르면 보드에 한 건이 생겨요.', go: function () { go('#/lot/L1'); } },
    { t: '물건 올리기', d: '사진·에듀파인 엑셀·대장, 어느 입구로 들어와도 같은 다섯 단계예요. AI 제안은 「넣기」를 눌러야 들어가요. 끝까지 가서 「검토 요청」을 눌러 보세요.', go: function () { ui.draft = null; ui.step = 0; go('#/new'); } },
    { t: '검토자가 게시하기', d: '업무 검토자 박검토 선생님으로 바꿨어요. 홈의 「검토하기」를 눌러 확인 3가지를 체크하고 게시해요. 작성자는 스스로 게시할 수 없어요.', go: function () { S.me = 'u2'; save(); go('#/home'); } },
    { t: '우리 기관 보드', d: '우리 기관 물건과 주고받기를 단계별 칸에 한눈에 펼쳐요. 내 차례인 카드는 주황 띠로 보여요. 「내 차례만」을 누르면 할 일만 남아요.', go: function () { S.me = 'u1'; save(); ui.boardF = 'all'; ui.boardCol = 'me'; go('#/board'); } }
  ];
  function tourPanel() {
    var T = ui.tour, st = TOUR[T.i];
    if (!T.open) return '<button class="tour-fab" data-act="tour-toggle">시연 안내 열기</button>';
    return '<aside class="tour" aria-label="시연 안내"><div class="between"><span class="label">시연 안내 · ' + (T.i + 1) + ' / ' + TOUR.length + '</span><button class="iconbtn" style="width:30px;height:30px" data-act="tour-toggle" aria-label="시연 안내 접기">' + icon('x') + '</button></div>' +
      '<div class="tour-dots">' + TOUR.map(function (x, i) { return '<button data-act="tour-go" data-i="' + i + '" class="' + (i === T.i ? 'on' : i < T.i ? 'd' : '') + '" aria-label="' + (i + 1) + '단계 ' + x.t + '"></button>'; }).join('') + '</div>' +
      '<b>' + esc(st.t) + '</b><p>' + esc(st.d) + '</p>' +
      '<div class="row"><button class="btn sm" data-act="tour-prev"' + (T.i ? '' : ' disabled') + '>이전</button>' +
      (T.i === 0 && !S.me ? '<button class="btn sm pri" data-act="tour-go" data-i="0">시연 시작</button>' : T.i < TOUR.length - 1 ? '<button class="btn sm pri" data-act="tour-next">다음: ' + esc(TOUR[T.i + 1].t) + '</button>' : '<button class="btn sm pri" data-act="tour-go" data-i="0">처음부터</button>') + '</div></aside>';
  }

  // ── 그리기 ──
  function render() {
    var parts = location.hash.replace(/^#\/?/, '').split('/'), r = parts[0] || 'home', id = parts[1];
    var app = $('#app');
    if (!S.me || !me()) { app.innerHTML = vLogin() + tourPanel(); document.title = '물품이음 시안'; return; }
    var html, opts = {};
    if (r === 'lot') { var v = vLot(id); html = v.html || v; if (v.sticky) { opts.sticky = true; opts.stickyHtml = v.sticky; } }
    else html = r === 'market' ? vMarket() : r === 'board' || r === 'mine' || r === 'deals' ? (r = 'board', vBoard()) : r === 'deal' ? vDeal(id) : r === 'new' ? vNew() : r === 'more' ? vMore() : (r = 'home', vHome());
    var focusId = document.activeElement && document.activeElement.id;
    app.innerHTML = shell(r, html, opts) + tourPanel();
    document.title = (CRUMB[r] || '물품이음') + ' · 물품이음 시안';
    var q = focusId === 'q' && $('#q');
    if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  window.addEventListener('hashchange', function () { ui.help = false; render(); window.scrollTo(0, 0); });

  document.addEventListener('input', function (e) {
    if (e.target.id === 'q') { ui.q = e.target.value; render(); }
    if (e.target.id === 'qty') { var h = location.hash.split('/')[2]; ui.qty[h] = Math.max(1, +e.target.value || 1); }
    if (e.target.classList.contains('wq')) { readWizard(); var s = $('#qsum'); if (s) s.textContent = sumQ(ui.draft); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'sort') { ui.sort = e.target.value; render(); }
    if (e.target.id === 'qty') render();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b) return;
    var a = b.dataset.act, id = b.dataset.id, u = S.me && me();
    function ev(t, what, note) { t.events.push({ t: now(), who: org(myOrg()).short + ' ' + u.name, what: what, note: note }); }
    switch (a) {
      case 'login': S.me = id; save(); toast(me().name + ' 선생님으로 들어왔어요'); go('#/home'); render(); break;
      case 'logout': S.me = null; save(); go('#/home'); render(); break;
      case 'reset': var who = S.me; S = fresh(); S.me = who; save(); ui.draft = null; ui.step = 0; toast('시연 데이터를 처음으로 되돌렸어요'); render(); break;
      case 'help': e.preventDefault(); ui.help = !ui.help; render(); break;
      case 'tour-toggle': ui.tour.open = !ui.tour.open; render(); break;
      case 'tour-go': ui.tour.i = +b.dataset.i; TOUR[ui.tour.i].go(); render(); window.scrollTo(0, 0); break;
      case 'tour-next': ui.tour.i = Math.min(TOUR.length - 1, ui.tour.i + 1); TOUR[ui.tour.i].go(); render(); window.scrollTo(0, 0); break;
      case 'tour-prev': ui.tour.i = Math.max(0, ui.tour.i - 1); TOUR[ui.tour.i].go(); render(); window.scrollTo(0, 0); break;
      case 'cat': ui.cat = b.dataset.v; render(); break;
      case 'toggle': ui[b.dataset.k] = !ui[b.dataset.k]; render(); break;
      case 'fav': e.preventDefault(); var i = S.fav.indexOf(id); if (i >= 0) S.fav.splice(i, 1); else S.fav.push(id); save(); toast(i >= 0 ? '관심물품에서 뺐어요' : '관심물품에 담았어요'); render(); break;
      case 'cond': ui.cond[id] = +b.dataset.i; ui.qty[id] = 1; render(); break;
      case 'qty': var l0 = lot(id), gs = l0.groups.filter(function (g) { return !/비공개/.test(g.cond); }), gi = ui.cond[id] != null ? ui.cond[id] : Math.max(0, gs.findIndex(function (g) { return g.avail > 0; })); ui.qty[id] = Math.min(gs[gi].avail, Math.max(1, (ui.qty[id] || 1) + (+b.dataset.d))); render(); break;
      case 'request':
        var L = lot(id), G = L.groups.filter(function (g) { return !/비공개/.test(g.cond); }), gi2 = ui.cond[id] != null ? ui.cond[id] : Math.max(0, G.findIndex(function (g) { return g.avail > 0; })), g = G[gi2], n = Math.min(ui.qty[id] || 1, g.avail);
        if (!g || !g.avail) { toast('신청할 수 있는 수량이 없습니다'); break; }
        var purpose = ($('#purpose') || {}).value || '교실 사용', date = ($('#pdate') || {}).value || '협의';
        g.avail -= n; var T = { id: 'T' + (++S.seq), lot: id, from: L.org, to: myOrg(), cond: g.cond, qty: n, purpose: purpose, date: date, state: 'REQUESTED', events: [] };
        ev(T, '신청 · ' + g.cond + ' ' + n + '개', purpose); S.transfers.unshift(T); save(); toast(n + '개 받기 신청을 보냈어요'); go('#/deal/' + T.id); break;
      case 'reserve': var t1 = deal(id); t1.state = 'RESERVED'; ev(t1, '예비 배정 · ' + t1.qty + '개'); save(); toast('예비 배정했어요. 다음은 인계 기록이에요'); render(); break;
      case 'decline': var t2 = deal(id); t2.state = 'DECLINED'; restore(t2); ev(t2, '선정하지 않음'); save(); toast('선정하지 않았어요. 수량은 되돌려 놓았어요'); render(); break;
      case 'cancel': var t3 = deal(id); t3.state = 'CANCELLED'; restore(t3); ev(t3, '신청 취소'); save(); toast('신청을 취소했어요'); render(); break;
      case 'send': if (!$('#photo-ok').checked) { toast('인계 사진 첨부를 확인해 주세요'); break; } var t4 = deal(id); t4.state = 'SENT'; ev(t4, '인계 기록 · ' + t4.qty + '개 · 사진 1장'); save(); toast('인계를 기록했어요. 이제 상대 기관이 받은 수량을 확인할 차례예요'); render(); break;
      case 'receive': var t5 = deal(id), got = Math.max(0, +$('#rq').value || 0); if (got === t5.qty) { t5.state = 'RECEIVED'; ev(t5, '인수 확인 · ' + got + '개'); toast('받은 수량을 확인했어요'); } else { t5.state = 'DISPUTED'; ev(t5, '수량 불일치 · 보냄 ' + t5.qty + ' / 받음 ' + got); toast('수량이 달라서 잠시 멈췄어요'); } save(); render(); break;
      case 'resolve': var t6 = deal(id); t6.state = 'RECEIVED'; ev(t6, '실제 전량 수령 확인'); save(); toast('정상 인수로 바꿨어요'); render(); break;
      case 'done': if (!$('#ledger-ok').checked) { toast('에듀파인 처리 여부를 확인해 주세요'); break; } var t7 = deal(id); t7.state = 'DONE'; ev(t7, '대장 반영 확인'); save(); toast('끝까지 마쳤어요. 수고하셨어요'); render(); break;
      case 'submit-review': lot(id).state = 'REVIEW'; save(); toast('검토를 요청했어요'); render(); break;
      case 'approve': if ($$('.rv').some(function (c) { return !c.checked; })) { toast('확인 항목 3가지를 모두 체크해 주세요'); break; } var L2 = lot(id); L2.state = 'PUBLISHED'; L2.verified = true; L2.days = 0; save(); toast('게시했어요. 이제 다른 학교에서 찾을 수 있어요'); render(); break;
      case 'reject': lot(id).state = 'DRAFT'; save(); toast('작성자에게 수정을 요청했어요'); render(); break;
      case 'pause': lot(id).state = 'PAUSED'; save(); toast('게시를 멈췄어요'); render(); break;
      case 'resume': lot(id).state = 'PUBLISHED'; save(); toast('다시 게시했어요'); render(); break;
      case 'bf': ui.boardF = b.dataset.v; render(); break;
      case 'bcol': ui.boardCol = b.dataset.v; render(); break;
      case 'entry-ledger': ui.draft = newDraft('ledger'); ui.step = 0; break;
      case 'entry': readWizard(); ui.draft.entry = b.dataset.v; render(); break;
      case 'pick': ui.draft.ill = b.dataset.v; render(); break;
      case 'ai': readWizard(); ui.draft.title = '교실 빔프로젝터'; ui.draft.model = 'EB-X41'; ui.draft.cat = 'ELECTRONICS'; toast('AI 제안을 넣었어요. 맞는지 한 번 봐 주세요'); render(); break;
      case 'wstep': readWizard(); draftFromLedger(ui.draft); ui.step = +b.dataset.i; render(); break;
      case 'wnext': readWizard(); if (ui.step === 0 && ui.draft.entry !== 'photo' && !ui.draft.ledger.length) { toast('가져올 행을 하나 이상 골라 주세요'); break; } draftFromLedger(ui.draft); ui.step = Math.min(4, ui.step + 1); render(); window.scrollTo(0, 0); break;
      case 'wprev': readWizard(); ui.step = Math.max(0, ui.step - 1); render(); break;
      case 'save-draft': case 'finish':
        var d = ui.draft, groups = Object.keys(d.q).filter(function (k) { return d.q[k] > 0; }).map(function (k) { return { cond: k, qty: +d.q[k], avail: +d.q[k] }; });
        var nl = { id: 'L' + (++S.seq), title: d.title || '이름 없는 물품', cat: d.cat, org: myOrg(), ill: d.ill, state: a === 'finish' ? 'REVIEW' : 'DRAFT', days: 0, verified: false, maker: d.maker, model: d.model, desc: d.desc || '설명 없음', groups: groups.length ? groups : [{ cond: '양호', qty: 1, avail: 1 }], by: u.id };
        S.lots.unshift(nl); save(); ui.draft = null; ui.step = 0; ui.mineTab = nl.state; toast(a === 'finish' ? '검토를 요청했어요' : '초안으로 저장했어요'); go('#/lot/' + nl.id); break;
    }
  });
  function restore(t) { var l = lot(t.lot); l.groups.forEach(function (g) { if (g.cond === t.cond) g.avail += t.qty; }); }

  render();
})();
