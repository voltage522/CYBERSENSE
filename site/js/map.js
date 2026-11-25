// Карта: разделы с уроками на извилистой тропе.

const nodes = allNodes();
const NODE_ICON = { lesson: 'book', quiz: 'help', test: 'trophy' };
const OFFSETS = [0, 56, 84, 56, 0, -56, -84, -56]; // смещение узлов влево-вправо, px

renderTopbar('map');
renderGoal();
renderLegend();
renderWelcome();
renderUnits();
drawRoutes();
window.addEventListener('resize', drawRoutes);

// ---------------------------------------------------------------- разделы
function renderUnits() {
  let globalIndex = 0;
  document.getElementById('units').innerHTML = CS_DATA.topics.map((unit, ui) => {
    const list = nodes.filter(n => n.unit === unit);
    const done = list.filter(n => n.status === 'done').length;
    const color = CS_MAP[unit.id].color;
    const tips = unit.scenarios.map(s => s.tip);

    const nodesHtml = list.map(n => {
      const x = OFFSETS[globalIndex++ % OFFSETS.length];
      const stars = n.status === 'done'
        ? `<span class="node-stars" aria-hidden="true">${[0, 1, 2].map(i => starIcon(i < n.stars)).join('')}</span>` : '';
      const label = `${n.title}. ${n.status === 'done' ? `Пройдено, звёзд: ${n.stars} из 3` : n.status === 'current' ? 'Следующий урок' : 'Закрыто'}`;
      return `
        <div class="node-wrap" style="--x:${x}px">
          ${n.status === 'current' ? '<span class="node-flag" aria-hidden="true">Начать</span>' : ''}
          <button class="node ${n.status} ${n.kind}" data-id="${n.id}" aria-label="${esc(label)}" aria-haspopup="dialog"
            ${n.status === 'current' ? 'id="current"' : ''}>
            ${icon(n.status === 'locked' ? 'lock' : NODE_ICON[n.kind])}
          </button>
          ${stars}
        </div>`;
    }).join('');

    return `
      <section class="unit" style="--u:${color}" aria-labelledby="unit-${unit.id}">
        <header class="unit-head">
          <span class="unit-icon">${icon(unit.icon)}</span>
          <div class="unit-text">
            <h2 id="unit-${unit.id}">${esc(unit.title)}</h2>
            <p>Раздел ${ui + 1} · ${done} из ${list.length} ${done === list.length ? '· пройден' : ''}</p>
          </div>
          <details class="cheat">
            <summary>${icon('book')}<span>Шпаргалка</span></summary>
            <div class="cheat-body">
              <p class="cheat-title">Главное в разделе</p>
              <ul>${[...new Set(tips)].map(t => `<li>${esc(t)}</li>`).join('')}</ul>
            </div>
          </details>
        </header>
        <div class="trail">
          <svg class="route" aria-hidden="true"></svg>
          ${nodesHtml}
        </div>
      </section>`;
  }).join('');

  const allDone = nodes.every(n => n.status === 'done');
  document.querySelector('.path-end').innerHTML = allDone
    ? `${icon('trophy')} Все разделы пройдены. Можно повторять уроки, чтобы собрать все звёзды.`
    : `${icon('flag')} Впереди — финиш всего пути.`;

  document.querySelectorAll('.node').forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    openPop(btn);
  }));
}

// Линия тропы между узлами (SVG поверх фона, под кнопками).
function drawRoutes() {
  document.querySelectorAll('.trail').forEach(trail => {
    const svg = trail.querySelector('.route');
    const box = trail.getBoundingClientRect();
    const wraps = [...trail.querySelectorAll('.node')];
    const pts = wraps.map(n => {
      const r = n.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top + r.height / 2, reached: !n.classList.contains('locked') };
    });
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    svg.innerHTML = pts.slice(1).map((p, i) => {
      const a = pts[i];
      const midY = (a.y + p.y) / 2;
      return `<path class="${p.reached ? 'reached' : ''}" d="M${a.x} ${a.y} C${a.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}"/>`;
    }).join('');
  });
}

// ---------------------------------------------------------------- карточка урока
const pop = document.getElementById('pop');
let popFor = null;

function openPop(btn) {
  if (popFor === btn) return closePop();
  const n = nodes.find(x => x.id === btn.dataset.id);
  const kindName = { lesson: 'Урок', quiz: 'Мини-квиз', test: 'Испытание раздела' }[n.kind];
  let body;
  if (n.status === 'locked') {
    body = `<p class="pop-meta">${esc(nodeMeta(n))}</p>
      <p class="pop-locked">${icon('lock')} Откроется, когда вы пройдёте предыдущие уроки.</p>`;
  } else {
    const rec = Store.node(n.id);
    body = `<p class="pop-meta">${esc(nodeMeta(n))}</p>
      ${rec ? `<p class="pop-best">Лучший результат: ${rec.best}% с первой попытки</p>` : ''}
      <a class="btn primary pop-go" href="lesson.html?n=${encodeURIComponent(n.id)}">
        ${n.status === 'done' ? `${icon('rotate')} Повторить` : `Начать ${n.kind === 'test' ? 'испытание' : 'урок'}`}
        <span class="pop-xp">до +${n.steps.length * 10 + 20} XP</span></a>`;
  }
  pop.innerHTML = `<p class="pop-kind">${kindName}</p><h3 class="pop-title">${esc(n.title)}</h3>${body}`;
  pop.style.setProperty('--u', CS_MAP[n.unit.id].color);
  pop.hidden = false;

  // Позиция: под узлом, по центру, в пределах экрана.
  const r = btn.getBoundingClientRect();
  const w = pop.offsetWidth;
  const left = Math.min(Math.max(12, r.left + r.width / 2 - w / 2), window.innerWidth - w - 12);
  pop.style.left = left + window.scrollX + 'px';
  pop.style.top = r.bottom + window.scrollY + 14 + 'px';
  pop.style.setProperty('--arrow', `${r.left + r.width / 2 - left}px`);
  popFor = btn;
  pop.querySelector('.pop-go')?.focus({ preventScroll: true });
}
function closePop() {
  pop.hidden = true;
  if (popFor) popFor.focus({ preventScroll: true });
  popFor = null;
}
document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target)) closePop(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) closePop(); });
window.addEventListener('resize', () => { if (!pop.hidden) closePop(); });

// ---------------------------------------------------------------- цель дня и подсказки
function renderGoal() {
  const t = todayXP(), s = streak();
  const pct = Math.min(100, Math.round(t / DAILY_GOAL * 100));
  const reached = t >= DAILY_GOAL;
  const html = `
    <div class="goal-row">
      <span class="goal-flame ${studiedToday() ? 'lit' : ''}">${icon('flame')}</span>
      <div>
        <p class="goal-streak"><b class="num">${s}</b> ${plural(s, ['день', 'дня', 'дней'])} подряд</p>
        <p class="goal-sub">${studiedToday() ? 'Сегодня вы уже занимались' : 'Пройдите урок, чтобы продлить серию'}</p>
      </div>
    </div>
    <div class="goal-bar" role="progressbar" aria-label="Цель на сегодня" aria-valuemin="0" aria-valuemax="${DAILY_GOAL}" aria-valuenow="${Math.min(t, DAILY_GOAL)}"><span style="width:${pct}%"></span></div>
    <p class="goal-text">${reached ? `${icon('check')} Цель дня выполнена` : `Цель дня: <b class="num">${t}/${DAILY_GOAL}</b> XP`}</p>`;
  document.getElementById('goal').innerHTML = html;
  document.getElementById('goal-mini').innerHTML = html;
}

function renderLegend() {
  const V = CS_DATA.verdicts;
  document.getElementById('legend').innerHTML = Object.keys(V).map(k =>
    `<dt class="tone-${k}">${icon(VERDICT_ICON[k])}${V[k].label}</dt><dd>${esc(V[k].hint)}</dd>`).join('');
}

function renderWelcome() {
  if (Store.data().xp > 0) return;
  document.getElementById('welcome').innerHTML = `
    <section class="welcome">
      <h1>Научитесь замечать мошенников — по 3 минуты в день</h1>
      <p>Короткие уроки с разными заданиями: оцените ситуацию, найдите подвох в сообщении, прочитайте адрес сайта,
        выберите ответ в переписке. Начните с первого урока на тропе.</p>
    </section>`;
}

// Открыть карту на текущем уроке.
if (location.hash === '#current' || Store.data().xp > 0) {
  const cur = document.getElementById('current');
  if (cur) requestAnimationFrame(() => cur.scrollIntoView({ block: 'center' }));
}
