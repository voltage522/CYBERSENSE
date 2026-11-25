// Прохождение урока: задание → «Проверить» → объяснение → «Дальше».
// Ошибки в обычном уроке повторяются в конце. В испытании — 3 щита и без повторов.

const stage = document.getElementById('stage');
const foot = document.getElementById('foot');
const fb = document.getElementById('fb');
const action = document.getElementById('action');
const bar = document.getElementById('bar');
const statusEl = document.getElementById('status');

const nodeId = new URLSearchParams(location.search).get('n');
const node = allNodes().find(n => n.id === nodeId);
const isTest = node && node.kind === 'test';

let steps, queue, pos = 0, resolved = 0, current = null;
let mode = 'answer';          // 'answer' — ждём ответ; 'continue' — показано объяснение
let lives = 3, combo = 0, xp = 0, mistakes = 0;
const firstTry = new Set();   // задания, решённые с первой попытки

// ---------------------------------------------------------------- старт
function start() {
  if (!node) return message('Урок не найден', 'Вернитесь на карту и выберите урок.');
  if (node.status === 'locked') return message('Урок пока закрыт', 'Сначала пройдите предыдущие уроки на карте.');
  document.title = `${node.title} — CyberSense`;
  steps = isTest ? shuffle(node.steps) : node.steps;
  queue = steps.map((step, i) => ({ step, i, retry: false }));
  renderStatus();
  renderStep();
}

function renderStep() {
  mode = 'answer';
  const item = queue[pos];
  foot.className = 'lesson-foot';
  fb.innerHTML = '';
  action.textContent = 'Проверить';
  action.disabled = true;

  stage.innerHTML = `<div class="narrow ex">${item.retry ? `<p class="retry-tag">${icon('rotate')} Повторим ошибку</p>` : ''}<div id="ex"></div></div>`;
  current = Exercises[item.step.type](item.step, document.getElementById('ex'), ready => {
    if (mode === 'answer') action.disabled = !ready;
  });
  stage.scrollTop = 0;
  window.scrollTo({ top: 0 });
  stage.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- проверка
function check() {
  const item = queue[pos];
  const res = current.check();
  mode = 'continue';

  if (res.ok) {
    combo++;
    xp += item.retry ? 5 : 10;
    if (!item.retry) firstTry.add(item.i);
    resolved++;
  } else {
    combo = 0;
    mistakes++;
    if (isTest) { lives--; resolved++; }
    else if (!item.retry) queue.push({ ...item, retry: true }); // вернётся в конце урока
    else resolved++;
  }

  const praise = ['Верно!', 'Точно!', 'Отлично!', 'Так держать!'];
  const title = res.ok ? praise[Math.floor(Math.random() * praise.length)] : 'Не совсем';
  foot.className = `lesson-foot ${res.ok ? 'ok' : 'bad'}`;
  fb.innerHTML = `
    <p class="fb-head">${icon(res.ok ? 'check' : 'x')} ${title}
      ${res.ok && combo >= 3 ? `<span class="combo">${icon('bolt')} ${combo} подряд</span>` : ''}</p>
    <div class="fb-body">${res.body}</div>
    ${!res.ok && !isTest && !item.retry ? '<p class="fb-note">Это задание вернётся в конце урока.</p>' : ''}`;
  action.textContent = 'Дальше';
  action.disabled = false;
  action.focus({ preventScroll: true });
  renderStatus();
}

function next() {
  if (isTest && lives === 0) return failScreen();
  pos++;
  if (pos >= queue.length) return finish();
  renderStep();
}

function renderStatus() {
  const pct = Math.round(resolved / steps.length * 100);
  bar.style.width = pct + '%';
  bar.parentElement.setAttribute('aria-valuenow', pct);
  statusEl.innerHTML = isTest
    ? `<span class="lives" aria-label="Осталось щитов: ${lives}">${[0, 1, 2].map(i =>
        `<span class="life ${i < lives ? 'on' : ''}">${icon('shield')}</span>`).join('')}</span>`
    : `<span class="xp-live">${icon('bolt')}<b class="num">${xp}</b></span>`;
}

// ---------------------------------------------------------------- финал
function finish() {
  const accuracy = firstTry.size / steps.length;
  const stars = isTest ? lives : accuracy >= 0.9 ? 3 : accuracy >= 0.6 ? 2 : 1;
  const bonus = 10 + (accuracy === 1 ? 10 : 0);
  const total = xp + bonus;
  const extendsStreak = !studiedToday();
  Store.completeNode(node.id, stars, Math.round(accuracy * 100), total);
  const s = streak();

  const titles = { 3: 'Безупречно!', 2: 'Хорошая работа', 1: 'Урок пройден' };
  foot.className = 'lesson-foot done';
  fb.innerHTML = '';
  bar.style.width = '100%';
  stage.innerHTML = `
    <div class="narrow finish">
      <div class="stars-row" aria-label="Звёзд: ${stars} из 3">
        ${[0, 1, 2].map(i => `<span class="big-star ${i < stars ? 'on' : ''}" style="--d:${i * 140}ms">${starIcon(i < stars)}</span>`).join('')}
      </div>
      <h1 class="finish-title">${titles[stars]}</h1>
      <p class="ex-lead">${esc(node.unit.title)} · ${esc(node.title)}</p>
      <div class="finish-stats">
        <div><span class="lab">Опыт</span><span class="val num">+${total} XP</span></div>
        <div><span class="lab">С первой попытки</span><span class="val num">${Math.round(accuracy * 100)}%</span></div>
        <div class="${extendsStreak ? 'lit' : ''}"><span class="lab">Серия</span><span class="val num">${icon('flame')} ${s} ${plural(s, ['день', 'дня', 'дней'])}</span></div>
      </div>
      ${extendsStreak ? '<p class="finish-note">Серия продлена — возвращайтесь завтра, чтобы не прервать её.</p>' : ''}
      ${mistakes > 0 && !isTest ? `<p class="finish-note">Ошибок по ходу: ${mistakes}. Звёзды можно улучшить, пройдя урок ещё раз.</p>` : ''}
    </div>`;
  action.textContent = 'Продолжить';
  action.disabled = false;
  action.onclick = () => { location.href = 'index.html#current'; };
  action.focus({ preventScroll: true });
  mode = 'done';
}

function failScreen() {
  foot.className = 'lesson-foot bad';
  fb.innerHTML = '';
  stage.innerHTML = `
    <div class="narrow finish">
      <div class="stars-row">${[0, 1, 2].map(() => `<span class="big-star">${icon('shield')}</span>`).join('')}</div>
      <h1 class="finish-title">Щиты закончились</h1>
      <p class="ex-lead">В испытании можно ошибиться только дважды. Повторите уроки раздела и попробуйте снова — задания будут в другом порядке.</p>
      <div class="actions"><a class="btn" href="index.html#current">${icon('arrowLeft')} На карту</a></div>
    </div>`;
  action.textContent = 'Попробовать снова';
  action.disabled = false;
  action.onclick = () => location.reload();
  mode = 'done';
}

function message(title, text) {
  foot.hidden = true;
  stage.innerHTML = `<div class="narrow finish"><h1 class="finish-title">${esc(title)}</h1>
    <p class="ex-lead">${esc(text)}</p><div class="actions"><a class="btn primary" href="index.html">На карту</a></div></div>`;
}

// ---------------------------------------------------------------- управление
action.addEventListener('click', () => {
  if (mode === 'answer') check();
  else if (mode === 'continue') next();
});

document.getElementById('quit').addEventListener('click', quit);
function quit() {
  if (mode !== 'done' && pos + resolved > 0 && !confirm('Выйти из урока? Прогресс этого урока не сохранится.')) return;
  location.href = 'index.html';
}

// 1–9 — выбрать вариант, Enter — проверить / дальше, Esc — выйти.
document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Enter') {
    if (!action.disabled) { e.preventDefault(); action.click(); }
    return;
  }
  if (e.key === 'Escape') return quit();
  const n = Number(e.key);
  if (mode === 'answer' && n >= 1 && n <= 9 && current?.pick) { e.preventDefault(); current.pick(n - 1); }
});

start();
