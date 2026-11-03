(function () {
  'use strict';
  var KEY = 'mulpum-prototype-v1';
  var SEED = window.SEED, ILL = window.ILL;
  var S = load();
  var ui = { q: '', cat: '', sort: 'near', goodOnly: false, many: false, favOnly: false, mineTab: 'DRAFT', dealTab: 'in', help: false, cond: {}, qty: {}, draft: null, step: 0 };

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
      x: '<path d="M6 6l12 12M18 6L6 18"/>', truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>'
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

  // ── 틀 ──
  var NAV = [['home', '홈', 'home'], ['market', '물품 찾기', 'search'], ['mine', '우리 물품', 'box'], ['deals', '주고받기', 'swap'], ['more', '더보기', 'more']];
  var CRUMB = { home: '홈', market: '물품 찾기', lot: '물품 찾기 › 물품', mine: '우리 물품', deals: '주고받기', deal: '주고받기 › 한 건', more: '더보기', 'new': '물품 올리기' };
  function shell(route, body, opts) {
    var u = me(), o = org(u.org), todo = todoCount(), dealTodo = myDeals().filter(function (t) { return myTurn(t); }).length;
    var badge = function (id) { var n = id === 'home' ? todo : id === 'deals' ? dealTodo : 0; return n ? '<span class="ct">' + n + '</span>' : ''; };
    var active = function (id) { return route === id || (id === 'market' && route === 'lot') || (id === 'deals' && route === 'deal'); };
    return '<div class="shell' + (opts && opts.sticky ? ' has-sticky' : '') + '">' +
      '<aside class="side" aria-label="주 메뉴"><a class="brand" href="#/home"><img src="favicon.svg" alt="">' + '<span>물품이음<small>학교의 물건, 새로운 쓰임</small></span></a>' +
      (u.role !== 'ADMIN' ? '<a class="cta" href="#/new">' + icon('plus') + '물품 올리기</a>' : '') +
      NAV.map(function (n) { return '<a class="nv ' + (active(n[0]) ? 'on' : '') + '" href="#/' + n[0] + '"' + (active(n[0]) ? ' aria-current="page"' : '') + '>' + icon(n[2]) + n[1] + badge(n[0]) + '</a>'; }).join('') +
      '<div class="me"><b>' + esc(o.name) + '</b>' + esc(u.name) + ' · ' + (u.role === 'REVIEWER' ? '업무 검토자' : '물품 담당자') + '</div></aside>' +
      '<div class="main"><header class="top"><a class="mbrand" href="#/home"><img src="favicon.svg" alt="">물품이음</a><span class="crumb">' + esc(CRUMB[route] || '') + '</span><span class="sp"></span>' +
      '<button class="iconbtn" data-act="help" aria-label="도움말 열기" title="도움말">' + icon('help') + '</button></header>' +
      '<div class="demo"><b>시안</b>모든 기관·물품·사람은 가상 데이터입니다. 실제 행정처리가 아닙니다.</div>' +
      '<main class="page" id="main" tabindex="-1">' + body + '</main></div>' +
      '<nav class="tabbar" aria-label="모바일 메뉴">' +
      [['home', '홈', 'home'], ['market', '찾기', 'search'], ['new', '올리기', 'plus'], ['mine', '우리 물품', 'box'], ['deals', '주고받기', 'swap']].map(function (n) {
        var inner = n[0] === 'new' ? '<span class="plus">' + icon('plus') + '</span>' : icon(n[2]);
        return '<a class="' + (active(n[0]) || route === n[0] ? 'on' : '') + '" href="#/' + n[0] + '">' + inner + n[1] + badge(n[0]) + '</a>';
      }).join('') + '</nav>' + (opts && opts.stickyHtml ? opts.stickyHtml : '') + '</div>' + (ui.help ? helpDrawer(route) : '');
  }

  // ── 로그인 ──
  function vLogin() {
    return '<div class="login"><div class="l"><div class="row" style="font-weight:800;font-size:20px"><img src="favicon.svg" alt="" width="38" height="38">물품이음</div>' +
      '<div><h1>우리 학교의 물건이,<br>다른 학교의 <em>새로운 쓰임</em>으로.</h1><p class="mut" style="margin-top:14px;font-size:16px">불용결정된 물품을 사진으로 찾고, 필요한 만큼 신청하고, 두 기관의 인계와 증빙까지 한 화면에서 이어 갑니다.</p></div>' +
      '<div class="flowline"><span>등록</span>→<span>검토</span>→<span>나눔</span>→<span>신청·배정</span>→<span>인계</span>→<span>인수</span>→<span>완료</span></div></div>' +
      '<div class="r"><h2 style="font-size:22px">시연 계정으로 둘러보기</h2><p class="mut">전면 개선안 시안입니다. 계정을 고르면 바로 들어갑니다.</p>' +
      S.users.map(function (u) { return '<button class="acct" data-act="login" data-id="' + u.id + '"><span class="av">' + esc(u.name.slice(0, 1)) + '</span><span><b>' + esc(u.name) + ' · ' + (u.role === 'REVIEWER' ? '업무 검토자' : '물품 담당자') + '</b><span>' + esc(org(u.org).name) + ' · ' + (u.role === 'REVIEWER' ? '게시 전 증빙 검토' : '물품 등록·신청·인계') + '</span></span></button>'; }).join('') +
      '<p class="notice amber">가상 데이터로 만든 디자인 시안입니다. 실제 행정자료를 입력하지 마세요. 입력한 내용은 이 브라우저에만 저장됩니다.</p></div></div>';
  }

  // ── 홈 ──
  function vHome() {
    var u = me(), rq = reviewQueue(), deals = myDeals();
    var turn = deals.filter(function (t) { return myTurn(t) && t.state !== 'DISPUTED'; });
    var disputed = deals.filter(function (t) { return t.state === 'DISPUTED'; });
    var waiting = deals.filter(function (t) { return theirTurn(t); });
    var drafts = myDrafts();
    var total = rq.length + turn.length + disputed.length;
    var cards = [];
    if (u.role === 'REVIEWER') cards.push(task('amber', '검토해 주세요', rq.length, rq.length ? rq.map(function (l) { return l.title; }).slice(0, 2).join(', ') + ' · 작성자 김새빛' : '검토할 물품이 없습니다', rq.length ? '#/lot/' + rq[0].id : '#/mine', '검토하기'));
    else cards.push(task('amber', '마저 작성하기', drafts.length, drafts.length ? drafts.map(function (l) { return l.title; }).join(', ') : '작성 중인 물품이 없습니다', drafts.length ? '#/lot/' + drafts[0].id : '#/new', drafts.length ? '이어서 작성' : '물품 올리기'));
    cards.push(task('blue', '주고받기 · 내 차례', turn.length, turn.length ? turn.map(function (t) { return myTurn(t) + ' · ' + lot(t.lot).title; })[0] + (turn.length > 1 ? ' 외 ' + (turn.length - 1) + '건' : '') : '지금 내 차례인 건이 없습니다', turn.length ? '#/deal/' + turn[0].id : '#/deals', turn.length ? '처리하기' : '전체 보기'));
    cards.push(task('red', '멈춤 · 수량 불일치', disputed.length, disputed.length ? lot(disputed[0].lot).title + ' · 양쪽 확인 필요' : '멈춘 건이 없습니다', disputed.length ? '#/deal/' + disputed[0].id : '#/deals', disputed.length ? '확인하기' : '기록 보기'));
    var mine = S.lots.filter(function (l) { return l.org === myOrg(); }).slice(0, 5);
    var near = S.lots.filter(function (l) { return l.org !== myOrg() && l.state === 'PUBLISHED'; }).sort(function (a, b) { return a.days - b.days; }).slice(0, 4);
    return '<div><h1 class="h1">안녕하세요, ' + esc(u.name) + '님</h1><p class="sub">' + esc(org(u.org).name) + ' · 내가 해야 할 일 ' + total + '건</p></div>' +
      '<section class="tasks" aria-label="오늘 할 일">' + cards.join('') + '</section>' +
      (waiting.length ? '<div class="notice">' + waiting.map(function (t) { return '<b>' + esc(lot(t.lot).title) + '</b> · ' + theirTurn(t); }).join('<br>') + '</div>' : '') +
      '<div class="two"><section class="card"><div class="between" style="margin-bottom:6px"><h2 class="label">우리 물품 진행 상황</h2><a class="mut" href="#/mine" style="font-size:13px">전체 보기 →</a></div><div class="list">' +
      mine.map(function (l) { return '<a class="li" href="#/lot/' + l.id + '"><div class="ill">' + ill(l.ill) + '</div><div><b>' + esc(l.title) + '</b><span class="s">' + (PILL[l.state] || [''])[0] + ' · ' + avail(l) + '개 남음' + dealsOf(l).filter(function (t) { return t.state === 'REQUESTED'; }).map(function () { return ' · 신청 대기'; }).slice(0, 1).join('') + '</span>' + mini(l.state) + '</div>' + pill(l.state) + '</a>'; }).join('') +
      '</div></section><section class="card"><div class="between" style="margin-bottom:6px"><h2 class="label">이웃 기관 새 물품</h2><a class="mut" href="#/market" style="font-size:13px">찾기 →</a></div><div class="list">' +
      near.map(function (l) { return '<a class="li" href="#/lot/' + l.id + '"><div class="ill">' + ill(l.ill) + '</div><div><b>' + esc(l.title) + '</b><span class="s">' + esc(org(l.org).short) + ' · ' + km(l.org) + 'km · ' + ago(l.days) + '</span></div><span class="pill p-green">' + avail(l) + '개</span></a>'; }).join('') +
      '</div></section></div>';
  }
  function task(tone, label, n, who, href, btn) {
    return '<a class="card task ' + tone + '" href="' + href + '"><span class="label">' + label + '</span><div class="n">' + n + '<small>건</small></div><span class="who">' + esc(who) + '</span><span class="btn sm' + (n ? ' pri' : '') + '">' + btn + '</span></a>';
  }
  function dealsOf(l) { return S.transfers.filter(function (t) { return t.lot === l.id; }); }

  // ── 물품 찾기 ──
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
    list.sort(ui.sort === 'near' ? function (a, b) { return km(a.org) - km(b.org) || a.days - b.days; } : ui.sort === 'new' ? function (a, b) { return a.days - b.days; } : function (a, b) { return avail(b) - avail(a); });
    var counts = {}; base.forEach(function (l) { counts[l.cat] = (counts[l.cat] || 0) + 1; });
    return '<div><h1 class="h1">우리 학교에 필요한 물품을 찾아보세요</h1><p class="sub">다른 기관에서 쓰임을 기다리는 물건, 필요한 만큼 이어 받아요.</p></div>' +
      '<div class="search">' + icon('search') + '<input type="search" id="q" placeholder="의자, 모니터, 모델명, 기관 이름으로 검색" value="' + esc(ui.q) + '" aria-label="물품 검색"></div>' +
      '<div class="chips" role="group" aria-label="분류"><button class="chip ' + (!ui.cat ? 'on' : '') + '" data-act="cat" data-v="">전체<small>' + base.length + '</small></button>' +
      Object.keys(SEED.categories).map(function (k) { return '<button class="chip ' + (ui.cat === k ? 'on' : '') + '" data-act="cat" data-v="' + k + '"' + (counts[k] ? '' : ' disabled') + '>' + SEED.categories[k] + '<small>' + (counts[k] || 0) + '</small></button>'; }).join('') + '</div>' +
      '<div class="between"><div class="chips" role="group" aria-label="걸러 보기">' +
      '<button class="chip ' + (ui.goodOnly ? 'on' : '') + '" data-act="toggle" data-k="goodOnly">양호만</button>' +
      '<button class="chip ' + (ui.many ? 'on' : '') + '" data-act="toggle" data-k="many">10개 이상</button>' +
      '<button class="chip ' + (ui.favOnly ? 'on' : '') + '" data-act="toggle" data-k="favOnly">관심물품 ' + S.fav.length + '</button></div>' +
      '<select id="sort" aria-label="정렬" style="width:auto"><option value="near"' + (ui.sort === 'near' ? ' selected' : '') + '>가까운 순</option><option value="new"' + (ui.sort === 'new' ? ' selected' : '') + '>최근 등록 순</option><option value="many"' + (ui.sort === 'many' ? ' selected' : '') + '>수량 많은 순</option></select></div>' +
      '<p class="label">다시 쓰임을 기다리는 물품 ' + list.length + '</p>' +
      (list.length ? '<div class="cards">' + list.map(card).join('') + '</div>' : '<div class="card empty"><b>조건에 맞는 물품이 없어요</b>검색어를 줄이거나 걸러 보기를 풀어 보세요.</div>');
  }
  function card(l) {
    var own = l.org === myOrg(), fav = S.fav.indexOf(l.id) >= 0;
    return '<div class="lot"><button class="heart ' + (fav ? 'on' : '') + '" data-act="fav" data-id="' + l.id + '" aria-label="관심물품 ' + (fav ? '빼기' : '담기') + '" aria-pressed="' + fav + '">' + icon('heart') + '</button>' +
      '<a href="#/lot/' + l.id + '"><div class="ph ill">' + ill(l.ill) + '<span class="q">' + avail(l) + '개 가능</span>' + (l.verified ? '<span class="ver pill p-green">증빙 확인</span>' : '') + '</div>' +
      '<div class="bd"><span class="cat">' + SEED.categories[l.cat] + (own ? ' · 우리 기관' : '') + '</span><b>' + esc(l.title) + '</b>' +
      '<div class="conds">' + l.groups.filter(function (g) { return !/비공개/.test(g.cond) && g.avail; }).map(function (g) { return '<span>' + g.cond.replace(' 있음', '') + ' ' + g.avail + '</span>'; }).join('') + '</div>' +
      '<div class="where"><span>' + esc(org(l.org).short) + ' · ' + org(l.org).district + ' · ' + ago(l.days) + '</span><span class="d">' + (own ? '우리' : km(l.org) + 'km') + '</span></div></div></a></div>';
  }

  // ── 물품 상세 ──
  function shipCost(k, n) { var lo = Math.round((20000 + k * 4000 + n * 3000) / 10000), hi = Math.round((30000 + k * 6000 + n * 5000) / 10000); return '약 ' + lo + '만~' + hi + '만 원'; }
  function vLot(id) {
    var l = lot(id); if (!l) return notFound();
    var own = l.org === myOrg(), u = me();
    var groups = l.groups.filter(function (g) { return !/비공개/.test(g.cond); });
    var sel = ui.cond[id] != null ? ui.cond[id] : Math.max(0, groups.findIndex(function (g) { return g.avail > 0; }));
    var g = groups[sel] || groups[0], max = g ? g.avail : 0, n = Math.min(ui.qty[id] || 1, Math.max(max, 1));
    var head = '<div><a class="mut row" href="' + (own ? '#/mine' : '#/market') + '" style="gap:4px;font-size:14px">' + icon('back') + (own ? '우리 물품' : '물품 찾기') + '</a></div>' +
      '<div class="row" style="gap:12px"><h1 class="h1">' + esc(l.title) + '</h1>' + pill(l.state) + '</div>' +
      '<p class="sub" style="margin-top:-12px">' + SEED.categories[l.cat] + ' · ' + esc(org(l.org).name) + ' · ' + org(l.org).district + (own ? '' : ' · ' + km(l.org) + 'km') + ' · ' + ago(l.days) + ' 등록</p>';
    var left = '<div class="detail"><div style="display:flex;flex-direction:column;gap:16px;min-width:0"><div class="photo ill">' + ill(l.ill) + (l.verified ? '<span class="pill p-green" style="position:absolute;right:12px;top:12px">' + icon('shield') + '불용 증빙 확인</span>' : '') + '</div>' +
      '<section class="card">' + stepper(l.state) + '</section>' +
      '<section class="card"><h2 class="label" style="margin-bottom:8px">물품 이야기</h2><p>' + esc(l.desc) + '</p><dl class="spec" style="margin-top:12px"><div><dt>제조사</dt><dd>' + esc(l.maker || '미확인') + '</dd></div><div><dt>모델</dt><dd>' + esc(l.model || '미확인') + '</dd></div><div><dt>상태별 수량</dt><dd>' + l.groups.map(function (x) { return x.cond + ' ' + x.qty; }).join(' · ') + '</dd></div><div><dt>인계 장소</dt><dd>' + esc(org(l.org).short) + ' · 세부 장소는 협의</dd></div></dl></section>' +
      (own && dealsOf(l).length ? '<section class="card"><h2 class="label" style="margin-bottom:4px">이 물품의 주고받기</h2><div class="list">' + dealsOf(l).map(function (t) { return '<a class="li" href="#/deal/' + t.id + '" style="grid-template-columns:minmax(0,1fr) auto"><div><b>' + esc(org(t.to).short) + ' · ' + t.cond + ' ' + t.qty + '개</b><span class="s">' + esc(t.purpose) + '</span>' + mini(t.state) + '</div>' + pill(t.state) + '</a>'; }).join('') + '</div></section>' : '') +
      '</div>';
    var right, sticky = '';
    if (!own && l.state === 'PUBLISHED') {
      right = '<aside class="side-panel"><section class="card" style="display:flex;flex-direction:column;gap:12px"><div class="avail">이어 받을 수 있는 수량<b>' + avail(l) + '<small style="font-size:15px">개</small></b></div>' +
        '<div class="fld"><span>상태 고르기</span><div class="seg">' + groups.map(function (x, i) { return '<button data-act="cond" data-id="' + id + '" data-i="' + i + '" class="' + (i === sel ? 'on' : '') + '"' + (x.avail ? '' : ' disabled') + '><b>' + x.cond + '</b><span>' + x.avail + '개 가능</span></button>'; }).join('') + '</div></div>' +
        '<div class="fld"><span>필요 수량</span><div class="stepperq" style="width:max-content"><button data-act="qty" data-id="' + id + '" data-d="-1" aria-label="하나 줄이기">−</button><input type="number" id="qty" value="' + n + '" min="1" max="' + max + '" aria-label="필요 수량"><button data-act="qty" data-id="' + id + '" data-d="1" aria-label="하나 늘리기">＋</button></div></div>' +
        '<div class="fld"><span>사용 목적</span><textarea id="purpose" placeholder="어느 공간에서 어떻게 쓸 예정인가요?">3학년 교실 보충수업용</textarea></div>' +
        '<div class="fld"><span>인수 희망일</span><input type="text" id="pdate" value="11/7(금) 오후"></div>' +
        '<div class="ship">' + icon('truck') + '<span style="flex:1">예상 배송비 (' + km(l.org) + 'km · ' + n + '개)</span><b>' + shipCost(km(l.org), n) + '</b></div>' +
        '<p class="mut" style="font-size:12px">배송비는 시연용 가정 단가입니다. 확정 견적이 아닙니다.</p>' +
        '<button class="btn pri req-btn" data-act="request" data-id="' + id + '">' + n + '개 받기 신청</button></section></aside>';
      sticky = '<div class="sticky-cta"><span class="btn" style="flex:0 0 auto">' + (g ? g.cond.replace(' 있음', '') : '') + ' ' + n + '개</span><button class="btn pri" data-act="request" data-id="' + id + '">' + n + '개 받기 신청</button></div>';
    } else if (own) {
      var act = '';
      if (l.state === 'DRAFT') act = '<div class="notice amber">우리 기관만 보는 초안입니다. 불용 증빙을 붙이고 검토를 요청하세요.</div><button class="btn pri" data-act="submit-review" data-id="' + id + '">검토 요청</button>';
      else if (l.state === 'REVIEW' && u.role === 'REVIEWER' && l.by !== u.id) act = '<div class="help"><b>게시 전 확인</b><label class="chk"><input type="checkbox" class="rv">불용결정 결재 원문을 확인했습니다</label><label class="chk"><input type="checkbox" class="rv">대상 목록과 실제 물품을 대조했습니다</label><label class="chk"><input type="checkbox" class="rv">사진에 개인정보가 없습니다</label></div><div class="row"><button class="btn pri" data-act="approve" data-id="' + id + '">증빙 검토 후 게시</button><button class="btn" data-act="reject" data-id="' + id + '">수정 요청</button></div>';
      else if (l.state === 'REVIEW') act = '<div class="notice amber">다른 업무 검토자가 증빙을 확인해야 게시됩니다. 작성자는 스스로 승인할 수 없습니다.</div><p class="mut" style="font-size:13px">시연: 더보기에서 「박검토」 계정으로 바꾸면 검토할 수 있습니다.</p>';
      else if (l.state === 'PUBLISHED') act = '<button class="btn" data-act="pause" data-id="' + id + '">게시 중단</button>';
      else if (l.state === 'PAUSED') act = '<button class="btn pri" data-act="resume" data-id="' + id + '">다시 게시</button>';
      right = '<aside class="side-panel"><section class="card" style="display:flex;flex-direction:column;gap:12px"><div class="avail">남은 수량<b>' + avail(l) + '<small style="font-size:15px">개</small></b></div>' + act + '</section>' +
        (l.state === 'PAUSED' || l.state === 'CLOSED' ? '<div class="help"><b>남은 물품은 매각 준비로</b><span class="mut">나눔이 끝나고 남은 수량은 온비드 매각 검토 자료(설명·사진·수량)를 묶어 준비할 수 있습니다.</span></div>' : '') + '</aside>';
    } else right = '<aside class="side-panel"><div class="card notice">지금은 신청할 수 없는 물품입니다.</div></aside>';
    return { html: head + left + right + '</div>', sticky: sticky };
  }

  // ── 우리 물품 ──
  function vMine() {
    var tabs = [['DRAFT', '작성 중', ['DRAFT']], ['REVIEW', '검토 대기', ['REVIEW']], ['PUBLISHED', '나눔 중', ['PUBLISHED']], ['END', '끝남', ['PAUSED', 'CLOSED']]];
    var mine = S.lots.filter(function (l) { return l.org === myOrg(); });
    var cur = tabs.filter(function (t) { return t[0] === ui.mineTab; })[0] || tabs[0];
    var list = mine.filter(function (l) { return cur[2].indexOf(l.state) >= 0; });
    return '<div class="between"><div><h1 class="h1">우리 물품</h1><p class="sub">우리 기관이 내놓은 물품을 단계별로 봅니다.</p></div><a class="btn pri" href="#/new">' + icon('plus') + '물품 올리기</a></div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { var n = mine.filter(function (l) { return t[2].indexOf(l.state) >= 0; }).length; return '<button role="tab" aria-selected="' + (t === cur) + '" class="' + (t === cur ? 'on' : '') + '" data-act="mtab" data-v="' + t[0] + '">' + t[1] + '<small>' + n + '</small></button>'; }).join('') + '</div>' +
      (list.length ? '<div class="card rowlist" style="padding:0">' + list.map(function (l) {
        var waiting = dealsOf(l).filter(function (t) { return t.state === 'REQUESTED'; }).length;
        return '<a href="#/lot/' + l.id + '"><div class="ill">' + ill(l.ill) + '</div><div><b>' + esc(l.title) + '</b><span class="s">' + l.groups.map(function (g) { return g.cond + ' ' + g.qty; }).join(' · ') + ' · ' + avail(l) + '개 남음</span>' + mini(l.state) + '</div><div class="r">' + pill(l.state) + (waiting ? '<span class="turn me">신청 ' + waiting + '건 · 선정 필요</span>' : '') + '</div></a>';
      }).join('') + '</div>' : '<div class="card empty"><b>' + cur[1] + ' 물품이 없어요</b>' + (cur[0] === 'DRAFT' ? '<a class="btn pri" href="#/new" style="margin-top:12px">물품 올리기</a>' : '') + '</div>') +
      '<div class="card" style="display:flex;gap:14px;align-items:center;flex-wrap:wrap"><div style="flex:1;min-width:220px"><b>에듀파인 대장에서 고르기</b><p class="mut" style="font-size:13px">가져온 자산 행을 골라 바로 초안을 만듭니다. (예전 「대장 가져오기」 메뉴)</p></div><a class="btn" href="#/new" data-act="entry-ledger">대장에서 고르기</a></div>';
  }

  // ── 주고받기 ──
  function vDeals() {
    var all = myDeals(), mine = myOrg();
    var tabs = [['in', '받을 물건', function (t) { return t.to === mine && !end(t); }], ['out', '보낼 물건', function (t) { return t.from === mine && !end(t); }], ['end', '끝남', end]];
    function end(t) { return ['DONE', 'DECLINED', 'CANCELLED'].indexOf(t.state) >= 0; }
    var cur = tabs.filter(function (t) { return t[0] === ui.dealTab; })[0] || tabs[0];
    var list = all.filter(cur[2]);
    return '<div><h1 class="h1">주고받기</h1><p class="sub">신청부터 인계·인수·대장 반영까지. 내 차례인 건은 빨간 글자로 표시합니다.</p></div>' +
      '<div class="tabs" role="tablist">' + tabs.map(function (t) { var n = all.filter(t[2]).length, m = all.filter(t[2]).filter(myTurn).length; return '<button role="tab" aria-selected="' + (t === cur) + '" class="' + (t === cur ? 'on' : '') + '" data-act="dtab" data-v="' + t[0] + '">' + t[1] + '<small>' + n + '</small>' + (m ? ' <span class="ct" style="display:inline-block">' + m + '</span>' : '') + '</button>'; }).join('') + '</div>' +
      (list.length ? '<div class="card rowlist" style="padding:0">' + list.map(function (t) {
        var l = lot(t.lot), other = t.from === mine ? t.to : t.from, mt = myTurn(t), tt = theirTurn(t);
        return '<a href="#/deal/' + t.id + '"><div class="ill">' + ill(l.ill) + '</div><div><b>' + esc(l.title) + ' · ' + t.cond + ' ' + t.qty + '개</b><span class="s">' + (t.from === mine ? '보냄 → ' : '받음 ← ') + esc(org(other).short) + ' · ' + esc(t.date) + '</span>' + mini(t.state) + '</div><div class="r">' + pill(t.state) + (mt ? '<span class="turn me">내 차례 · ' + mt + '</span>' : tt ? '<span class="turn them">' + tt + '</span>' : '') + '</div></a>';
      }).join('') + '</div>' : '<div class="card empty"><b>' + cur[1] + '이 없어요</b>' + (cur[0] === 'in' ? '<a class="btn pri" href="#/market" style="margin-top:12px">물품 찾기</a>' : '') + '</div>');
  }
  function vDeal(id) {
    var t = deal(id); if (!t) return notFound();
    var l = lot(t.lot), mine = myOrg(), sender = t.from === mine, mt = myTurn(t);
    var next = { REQUESTED: '선정', RESERVED: '인계 기록', SENT: '인수 확인', RECEIVED: '대장 반영 확인', DISPUTED: '수량 불일치 해결' }[t.state];
    var act = '';
    if (sender && t.state === 'REQUESTED') act = '<div class="row"><button class="btn pri" data-act="reserve" data-id="' + id + '">' + t.qty + '개 예비 배정</button><button class="btn" data-act="decline" data-id="' + id + '">선정하지 않음</button></div>';
    else if (sender && t.state === 'RESERVED') act = '<label class="chk"><input type="checkbox" id="photo-ok">인계 사진을 첨부했습니다 (시연)</label><button class="btn pri" data-act="send" data-id="' + id + '">' + t.qty + '개 인계 기록</button>';
    else if (!sender && t.state === 'SENT') act = '<div class="fld"><span>실제로 받은 수량</span><input type="number" id="rq" value="' + t.qty + '" min="0" max="' + t.qty + '" style="max-width:140px"></div><button class="btn pri" data-act="receive" data-id="' + id + '">받은 수량 확인</button><p class="mut" style="font-size:12px">보낸 수량과 다르면 「수량 불일치」로 멈추고 양쪽이 확인합니다.</p>';
    else if (t.state === 'RECEIVED') act = '<label class="chk"><input type="checkbox" id="ledger-ok">에듀파인 관리전환(' + (sender ? '불용·반출' : '취득') + ') 처리를 마쳤습니다</label><button class="btn pri" data-act="done" data-id="' + id + '">대장 반영 확인</button>';
    else if (t.state === 'DISPUTED') act = '<div class="notice red">보낸 수량과 받은 수량이 다릅니다. 실물을 다시 세어 확인하세요.</div><button class="btn pri" data-act="resolve" data-id="' + id + '">실제 전량 수령 확인</button>';
    else if (!sender && t.state === 'REQUESTED') act = '<button class="btn warn" data-act="cancel" data-id="' + id + '">신청 취소</button>';
    var helpBox = sender
      ? '<div class="help"><b>보낸 다음 우리 기관이 할 일</b><ol><li>물품이음에서 인계 기록 (사진)</li><li>상대가 받은 수량 확인</li><li>에듀파인에서 관리전환 반출 처리</li><li>「대장 반영 확인」</li></ol></div>'
      : '<div class="help"><b>받은 다음 우리 기관이 할 일</b><ol><li>물품이음에서 받은 수량 확인</li><li>에듀파인에서 관리전환 취득 등록</li><li>「대장 반영 확인」</li></ol><span class="mut">메뉴 위치와 서식은 오른쪽 위 「?」 도움 칸에서 근거와 함께 확인하세요.</span></div>';
    var evs = t.events.map(function (e) { return '<div class="ev' + (/불일치/.test(e.what) ? ' x' : '') + '"><i></i><div><b>' + esc(e.what) + '</b><span>' + esc(e.who) + (e.note ? ' · "' + esc(e.note) + '"' : '') + '</span></div><span class="mut" style="font-size:12px">' + esc(e.t) + '</span></div>'; }).join('');
    if (next && t.state !== 'DONE') evs += '<div class="ev now"><i></i><div><b>' + next + ' 기다리는 중</b><span>' + (mt ? '우리 차례' : '상대 기관 차례') + '</span></div>' + (mt ? '<span class="pill p-red">내 차례</span>' : '<span class="pill p-amber">상대 차례</span>') + '</div>';
    return '<div><a class="mut row" href="#/deals" style="gap:4px;font-size:14px">' + icon('back') + '주고받기</a></div>' +
      '<div class="between"><div class="row"><h1 class="h1">' + esc(l.title) + ' ' + t.qty + '개</h1>' + pill(t.state) + '</div><a class="btn sm" href="#/lot/' + l.id + '">물품 보기</a></div>' +
      '<section class="card parties"><div class="p"><small>보내는 기관' + (sender ? ' (우리)' : '') + '</small><b>' + esc(org(t.from).name) + '</b></div><span class="arrow" aria-hidden="true">→</span><div class="p"><small>받는 기관' + (!sender ? ' (우리)' : '') + '</small><b>' + esc(org(t.to).name) + '</b><div class="mut" style="font-size:13px">' + t.cond + ' ' + t.qty + '개 · ' + esc(t.date) + '</div></div></section>' +
      '<section class="card">' + stepper(t.state) + '</section>' +
      '<div class="two"><section class="card"><h2 class="label" style="margin-bottom:6px">기록</h2><div class="tl">' + evs + '</div></section>' +
      '<div style="display:flex;flex-direction:column;gap:12px">' + (act ? '<section class="card" style="display:flex;flex-direction:column;gap:10px"><h2 class="label">' + (mt ? '내 차례: ' + mt : '할 수 있는 일') + '</h2>' + act + '</section>' : '') + helpBox + '</div></div>';
  }

  // ── 올리기 마법사 ──
  var WSTEPS = ['무엇으로 시작할까요', '물품 정보', '상태별 수량', '불용 증빙', '검토 요청'];
  function newDraft(entry) { return { entry: entry || 'photo', ill: 'proj', title: '', cat: 'ELECTRONICS', maker: '', model: '', desc: '', q: { '양호': 3, '사용감 있음': 0, '수리검토 · 비공개': 0, '미확인 · 비공개': 0 }, ev: [false, false, false], ledger: [] }; }
  function vNew() {
    var d = ui.draft || (ui.draft = newDraft()), st = ui.step;
    var steps = '<nav class="steps" aria-label="등록 단계">' + WSTEPS.map(function (s, i) { return '<button data-act="wstep" data-i="' + i + '" class="' + (i < st ? 'd' : i === st ? 'c' : '') + '"' + (i === st ? ' aria-current="step"' : '') + '><b>' + (i < st ? '✓' : i + 1) + '</b>' + s + '</button>'; }).join('') + '<span class="mut" style="font-size:12px;padding:8px 10px">입력하면 자동 저장됩니다</span></nav>';
    var body = '', help = '';
    if (st === 0) {
      body = '<div class="entry">' + [['photo', '사진으로', '현장에서 찍어 한 건씩'], ['excel', '에듀파인 엑셀', '불용결정 목록 파일로 여러 건'], ['ledger', '대장에서 고르기', '가져온 자산 행을 골라서']].map(function (e) { return '<button data-act="entry" data-v="' + e[0] + '" class="' + (d.entry === e[0] ? 'on' : '') + '"><b>' + e[1] + '</b><span>' + e[2] + '</span></button>'; }).join('') + '</div>';
      if (d.entry === 'photo') body += '<div class="fld"><span>사진 고르기 (시안에서는 예시 사진)</span><div class="pickphotos">' + ['proj', 'desk', 'locker', 'stand', 'mon', 'box'].map(function (k) { return '<button class="ill ' + (d.ill === k ? 'on' : '') + '" data-act="pick" data-v="' + k + '" aria-label="예시 사진 ' + k + '">' + ill(k) + '</button>'; }).join('') + '</div></div>';
      else body += '<div class="fld"><span>' + (d.entry === 'excel' ? '「불용결정목록_2026.xlsx」에서 읽은 행 (예시)' : '가져온 대장 자산 행 (예시)') + '</span><div class="tscroll"><table class="ledger"><thead><tr><th></th><th>물품분류번호</th><th>품명</th><th>수량</th><th>취득일</th></tr></thead><tbody>' +
        [['43211902', '컴퓨터 모니터', 6, '2017-03-02'], ['56101504', '학생용 의자', 24, '2015-02-20'], ['45111609', '빔프로젝터', 3, '2018-08-14']].map(function (r, i) { return '<tr><td><input type="checkbox" class="lg" data-i="' + i + '"' + (d.ledger.indexOf(i) >= 0 ? ' checked' : '') + ' aria-label="' + r[1] + ' 선택"></td><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>'; }).join('') + '</tbody></table></div><p class="mut" style="font-size:12px">원본 대장의 품명·번호·수량은 바꾸지 않고 그대로 보관합니다.</p></div>';
      help = '<b>세 입구, 같은 다섯 단계</b><ol><li>어느 입구로 시작해도 2~5단계는 같습니다</li><li>엑셀·대장으로 여러 행을 고르면 행마다 초안이 생깁니다</li><li>사진은 기기 밖 AI로 보내지 않습니다 (시안)</li></ol>';
    } else if (st === 1) {
      body = '<div style="display:grid;grid-template-columns:110px minmax(0,1fr);gap:14px"><div class="ill" style="aspect-ratio:1;border-radius:12px">' + ill(d.ill) + '</div><div class="fld"><span>물품 이름 (찾기 쉬운 이름)</span><input type="text" id="w-title" value="' + esc(d.title) + '" placeholder="예: 교실 빔프로젝터">' +
        '<div class="ai">AI 제안 · 사진에서 읽은 이름: <b>교실 빔프로젝터 (EB-X41)</b><button class="btn sm" data-act="ai">넣기</button></div></div></div>' +
        '<div class="grid2"><label class="fld"><span>분류</span><select id="w-cat">' + Object.keys(SEED.categories).map(function (k) { return '<option value="' + k + '"' + (d.cat === k ? ' selected' : '') + '>' + SEED.categories[k] + '</option>'; }).join('') + '</select></label>' +
        '<label class="fld"><span>제조사</span><input type="text" id="w-maker" value="' + esc(d.maker) + '" placeholder="모르면 비워 두세요"></label>' +
        '<label class="fld"><span>모델명</span><input type="text" id="w-model" value="' + esc(d.model) + '" placeholder="명판을 보고 입력"></label></div>' +
        '<label class="fld"><span>설명</span><textarea id="w-desc" placeholder="상태, 부속품, 주의할 점">' + esc(d.desc) + '</textarea></label>';
      help = '<b>이 단계에서 확인할 것</b><ol><li>공식 대장 품명은 바꾸지 않습니다. 여기는 찾기 쉬운 이름입니다</li><li>AI 제안은 참고입니다. 「넣기」를 눌러야 들어갑니다</li><li>사진의 이름표·개인정보는 가려 주세요</li></ol>';
    } else if (st === 2) {
      body = '<table class="qtable"><thead><tr><th>상태</th><th>수량</th><th>공개</th></tr></thead><tbody>' + Object.keys(d.q).map(function (k) { return '<tr><td>' + k + '</td><td><input type="number" min="0" class="wq" data-k="' + k + '" value="' + d.q[k] + '" aria-label="' + k + ' 수량"></td><td>' + (/비공개/.test(k) ? '<span class="pill p-gray">비공개</span>' : '<span class="pill p-green">공개</span>') + '</td></tr>'; }).join('') + '</tbody></table>' +
        '<p class="mut" style="font-size:13px">합계 <b id="qsum">' + sumQ(d) + '</b>개 · 공개 ' + sumQ(d, true) + '개</p>';
      help = '<b>상태별로 나눠 적기</b><ol><li>한 묶음 안에서 상태별 수량을 적습니다</li><li>수리검토·미확인은 다른 기관에 보이지 않습니다</li><li>대장 수량과 다르면 4단계에서 사유를 남깁니다</li></ol>';
    } else if (st === 3) {
      body = '<div class="notice amber">불용결정이 끝나고 증빙을 확인하기 전에는 우리 기관에만 보입니다.</div>' +
        [['불용결정 결재 원문(PDF)을 첨부했습니다 (시연)'], ['결정 대상목록과 실제 물품을 대조했습니다'], ['사진·설명에 개인정보와 보안정보가 없습니다']].map(function (c, i) { return '<label class="chk"><input type="checkbox" class="wev" data-i="' + i + '"' + (d.ev[i] ? ' checked' : '') + '>' + c[0] + '</label>'; }).join('');
      help = '<b>에듀파인에서 받는 법</b><ol><li>물품관리 › 불용결정 › 결재 문서</li><li>대상목록을 엑셀로 내려받기</li><li>PDF로 저장해 여기에 첨부</li></ol><span class="mut">메뉴 이름은 기관 설정에 따라 다를 수 있습니다.</span>';
    } else {
      var ok = d.title && sumQ(d, true) > 0 && d.ev.every(Boolean);
      body = '<div style="display:grid;grid-template-columns:120px minmax(0,1fr);gap:14px"><div class="ill" style="aspect-ratio:1;border-radius:12px">' + ill(d.ill) + '</div><div><b style="font-size:17px">' + esc(d.title || '(이름 없음)') + '</b><p class="mut">' + SEED.categories[d.cat] + (d.model ? ' · ' + esc(d.model) : '') + '</p><p class="mut">' + Object.keys(d.q).filter(function (k) { return d.q[k] > 0; }).map(function (k) { return k + ' ' + d.q[k]; }).join(' · ') + '</p></div></div>' +
        (ok ? '<div class="notice">검토를 요청하면 우리 기관의 다른 업무 검토자가 증빙을 확인한 뒤 게시합니다.</div>' : '<div class="notice amber">' + [!d.title && '물품 이름(2단계)', !(sumQ(d, true) > 0) && '공개 수량(3단계)', !d.ev.every(Boolean) && '증빙 확인 3가지(4단계)'].filter(Boolean).join(', ') + '을(를) 채워야 검토를 요청할 수 있습니다.</div>') +
        '<div class="row"><button class="btn" data-act="save-draft">초안으로 저장</button><button class="btn pri" data-act="finish"' + (ok ? '' : ' disabled') + '>검토 요청</button></div>';
      help = '<b>검토 요청 후</b><ol><li>작성자는 스스로 승인할 수 없습니다</li><li>검토자가 승인하면 「나눔 중」이 됩니다</li><li>홈 「오늘 할 일」에서 진행을 봅니다</li></ol>';
    }
    var nav = st < 4 ? '<div class="between"><button class="btn" data-act="wprev"' + (st ? '' : ' disabled') + '>이전</button><button class="btn pri" data-act="wnext">다음: ' + WSTEPS[st + 1] + '</button></div>' : '<div><button class="btn" data-act="wprev">이전</button></div>';
    return '<div class="between"><div class="row"><h1 class="h1">물품 올리기</h1><span class="pill p-gray">우리 기관만 봄</span></div></div>' +
      '<div class="wiz">' + steps + '<section class="card" style="display:flex;flex-direction:column;gap:14px"><h2 style="font-size:18px">' + (st + 1) + '. ' + WSTEPS[st] + '</h2>' + body + nav + '</section><aside class="help">' + help + '</aside></div>';
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
  function notFound() { return '<div class="card empty"><b>찾을 수 없어요</b><a class="btn" href="#/home" style="margin-top:12px">홈으로</a></div>'; }

  // ── 그리기 ──
  function render() {
    var parts = location.hash.replace(/^#\/?/, '').split('/'), r = parts[0] || 'home', id = parts[1];
    var app = $('#app');
    if (!S.me || !me()) { app.innerHTML = vLogin(); document.title = '물품이음 시안'; return; }
    var html, opts = {};
    if (r === 'lot') { var v = vLot(id); html = v.html || v; if (v.sticky) { opts.sticky = true; opts.stickyHtml = v.sticky; } }
    else html = r === 'market' ? vMarket() : r === 'mine' ? vMine() : r === 'deals' ? vDeals() : r === 'deal' ? vDeal(id) : r === 'new' ? vNew() : r === 'more' ? vMore() : (r = 'home', vHome());
    var focusId = document.activeElement && document.activeElement.id;
    app.innerHTML = shell(r, html, opts);
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
      case 'login': S.me = id; save(); toast(me().name + ' 계정으로 들어왔습니다'); go('#/home'); render(); break;
      case 'logout': S.me = null; save(); go('#/home'); render(); break;
      case 'reset': var who = S.me; S = fresh(); S.me = who; save(); ui.draft = null; ui.step = 0; toast('시연 데이터를 처음으로 되돌렸습니다'); render(); break;
      case 'help': e.preventDefault(); ui.help = !ui.help; render(); break;
      case 'cat': ui.cat = b.dataset.v; render(); break;
      case 'toggle': ui[b.dataset.k] = !ui[b.dataset.k]; render(); break;
      case 'fav': e.preventDefault(); var i = S.fav.indexOf(id); if (i >= 0) S.fav.splice(i, 1); else S.fav.push(id); save(); toast(i >= 0 ? '관심물품에서 뺐습니다' : '관심물품에 담았습니다'); render(); break;
      case 'cond': ui.cond[id] = +b.dataset.i; ui.qty[id] = 1; render(); break;
      case 'qty': var l0 = lot(id), gs = l0.groups.filter(function (g) { return !/비공개/.test(g.cond); }), gi = ui.cond[id] != null ? ui.cond[id] : Math.max(0, gs.findIndex(function (g) { return g.avail > 0; })); ui.qty[id] = Math.min(gs[gi].avail, Math.max(1, (ui.qty[id] || 1) + (+b.dataset.d))); render(); break;
      case 'request':
        var L = lot(id), G = L.groups.filter(function (g) { return !/비공개/.test(g.cond); }), gi2 = ui.cond[id] != null ? ui.cond[id] : Math.max(0, G.findIndex(function (g) { return g.avail > 0; })), g = G[gi2], n = Math.min(ui.qty[id] || 1, g.avail);
        if (!g || !g.avail) { toast('신청할 수 있는 수량이 없습니다'); break; }
        var purpose = ($('#purpose') || {}).value || '교실 사용', date = ($('#pdate') || {}).value || '협의';
        g.avail -= n; var T = { id: 'T' + (++S.seq), lot: id, from: L.org, to: myOrg(), cond: g.cond, qty: n, purpose: purpose, date: date, state: 'REQUESTED', events: [] };
        ev(T, '신청 · ' + g.cond + ' ' + n + '개', purpose); S.transfers.unshift(T); save(); toast(n + '개 받기 신청을 보냈습니다'); go('#/deal/' + T.id); break;
      case 'reserve': var t1 = deal(id); t1.state = 'RESERVED'; ev(t1, '예비 배정 · ' + t1.qty + '개'); save(); toast('예비 배정했습니다. 다음은 인계 기록입니다'); render(); break;
      case 'decline': var t2 = deal(id); t2.state = 'DECLINED'; restore(t2); ev(t2, '선정하지 않음'); save(); toast('선정하지 않았습니다. 수량을 되돌렸습니다'); render(); break;
      case 'cancel': var t3 = deal(id); t3.state = 'CANCELLED'; restore(t3); ev(t3, '신청 취소'); save(); toast('신청을 취소했습니다'); render(); break;
      case 'send': if (!$('#photo-ok').checked) { toast('인계 사진 첨부를 확인해 주세요'); break; } var t4 = deal(id); t4.state = 'SENT'; ev(t4, '인계 기록 · ' + t4.qty + '개 · 사진 1장'); save(); toast('인계를 기록했습니다. 상대 기관이 인수 확인할 차례입니다'); render(); break;
      case 'receive': var t5 = deal(id), got = Math.max(0, +$('#rq').value || 0); if (got === t5.qty) { t5.state = 'RECEIVED'; ev(t5, '인수 확인 · ' + got + '개'); toast('받은 수량을 확인했습니다'); } else { t5.state = 'DISPUTED'; ev(t5, '수량 불일치 · 보냄 ' + t5.qty + ' / 받음 ' + got); toast('수량이 달라 진행을 멈췄습니다'); } save(); render(); break;
      case 'resolve': var t6 = deal(id); t6.state = 'RECEIVED'; ev(t6, '실제 전량 수령 확인'); save(); toast('정상 인수로 바꿨습니다'); render(); break;
      case 'done': if (!$('#ledger-ok').checked) { toast('에듀파인 처리 여부를 확인해 주세요'); break; } var t7 = deal(id); t7.state = 'DONE'; ev(t7, '대장 반영 확인'); save(); toast('완료했습니다'); render(); break;
      case 'submit-review': lot(id).state = 'REVIEW'; save(); toast('검토를 요청했습니다'); render(); break;
      case 'approve': if ($$('.rv').some(function (c) { return !c.checked; })) { toast('확인 항목 3가지를 모두 체크해 주세요'); break; } var L2 = lot(id); L2.state = 'PUBLISHED'; L2.verified = true; L2.days = 0; save(); toast('게시했습니다. 이제 다른 기관이 찾을 수 있습니다'); render(); break;
      case 'reject': lot(id).state = 'DRAFT'; save(); toast('작성자에게 수정을 요청했습니다'); render(); break;
      case 'pause': lot(id).state = 'PAUSED'; save(); toast('게시를 중단했습니다'); render(); break;
      case 'resume': lot(id).state = 'PUBLISHED'; save(); toast('다시 게시했습니다'); render(); break;
      case 'mtab': ui.mineTab = b.dataset.v; render(); break;
      case 'dtab': ui.dealTab = b.dataset.v; render(); break;
      case 'entry-ledger': ui.draft = newDraft('ledger'); ui.step = 0; break;
      case 'entry': readWizard(); ui.draft.entry = b.dataset.v; render(); break;
      case 'pick': ui.draft.ill = b.dataset.v; render(); break;
      case 'ai': readWizard(); ui.draft.title = '교실 빔프로젝터'; ui.draft.model = 'EB-X41'; ui.draft.cat = 'ELECTRONICS'; toast('AI 제안을 넣었습니다. 맞는지 확인해 주세요'); render(); break;
      case 'wstep': readWizard(); draftFromLedger(ui.draft); ui.step = +b.dataset.i; render(); break;
      case 'wnext': readWizard(); if (ui.step === 0 && ui.draft.entry !== 'photo' && !ui.draft.ledger.length) { toast('가져올 행을 하나 이상 골라 주세요'); break; } draftFromLedger(ui.draft); ui.step = Math.min(4, ui.step + 1); render(); window.scrollTo(0, 0); break;
      case 'wprev': readWizard(); ui.step = Math.max(0, ui.step - 1); render(); break;
      case 'save-draft': case 'finish':
        var d = ui.draft, groups = Object.keys(d.q).filter(function (k) { return d.q[k] > 0; }).map(function (k) { return { cond: k, qty: +d.q[k], avail: +d.q[k] }; });
        var nl = { id: 'L' + (++S.seq), title: d.title || '이름 없는 물품', cat: d.cat, org: myOrg(), ill: d.ill, state: a === 'finish' ? 'REVIEW' : 'DRAFT', days: 0, verified: false, maker: d.maker, model: d.model, desc: d.desc || '설명 없음', groups: groups.length ? groups : [{ cond: '양호', qty: 1, avail: 1 }], by: u.id };
        S.lots.unshift(nl); save(); ui.draft = null; ui.step = 0; ui.mineTab = nl.state; toast(a === 'finish' ? '검토를 요청했습니다' : '초안으로 저장했습니다'); go('#/lot/' + nl.id); break;
    }
  });
  function restore(t) { var l = lot(t.lot); l.groups.forEach(function (g) { if (g.cond === t.cond) g.avail += t.qty; }); }

  render();
})();
