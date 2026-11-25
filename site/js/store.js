// Прогресс в localStorage: опыт (XP), серия дней, звёзды за уроки.
// Структура:
// { xp: 120, days: { '2026-11-24': 40 }, nodes: { 'phishing/l1': { stars: 3, best: 100 } } }

const DAILY_GOAL = 30; // XP в день

const Store = (() => {
  const KEY = 'cybersense-v3';
  let memory = { xp: 0, days: {}, nodes: {} }; // если localStorage недоступен

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      return d && d.nodes ? d : { xp: 0, days: {}, nodes: {} };
    } catch (e) { return memory; }
  }
  function save(d) {
    memory = d;
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* остаётся в памяти */ }
  }

  return {
    data: load,
    node(id) { return load().nodes[id] || null; },

    // Урок пройден: сохраняем лучший результат и начисляем опыт за сегодня.
    completeNode(id, stars, accuracy, xp) {
      const d = load();
      const prev = d.nodes[id];
      d.nodes[id] = {
        stars: Math.max(stars, prev ? prev.stars : 0),
        best: Math.max(accuracy, prev ? prev.best : 0)
      };
      d.xp += xp;
      const today = dayKey(new Date());
      d.days[today] = (d.days[today] || 0) + xp;
      save(d);
    },

    reset() { save({ xp: 0, days: {}, nodes: {} }); }
  };
})();

// 'YYYY-MM-DD' по местному времени
function dayKey(date) {
  const p = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
}

// Серия: сколько дней подряд был хотя бы один урок (сегодня или по вчера включительно).
function streak() {
  const days = Store.data().days;
  const d = new Date();
  if (!days[dayKey(d)]) d.setDate(d.getDate() - 1); // сегодня ещё не занимались — серия не сгорела
  let n = 0;
  while (days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function todayXP() { return Store.data().days[dayKey(new Date())] || 0; }
function studiedToday() { return todayXP() > 0; }

// ---------------------------------------------------------------- карта
// Узлы раздела: урок 1, урок 2, мини-квиз, испытание.
function unitNodes(unit) {
  const meta = CS_MAP[unit.id];
  const lessons = meta.lessons.map((l, i) => ({
    id: `${unit.id}/l${i + 1}`, unit, kind: 'lesson', title: l.title, steps: l.steps
  }));
  return [
    ...lessons,
    { id: `${unit.id}/quiz`, unit, kind: 'quiz', title: 'Мини-квиз',
      steps: unit.quiz.map(q => ({ type: 'choice', ...q })) },
    { id: `${unit.id}/test`, unit, kind: 'test', title: 'Испытание',
      steps: [
        ...unit.scenarios.map(s => ({ type: 'verdict', s: s.id })),
        ...unit.quiz.map(q => ({ type: 'choice', ...q }))
      ] }
  ];
}

// Все узлы по порядку + статус: done / current / locked.
function allNodes() {
  const list = CS_DATA.topics.flatMap(unitNodes);
  const nodes = Store.data().nodes;
  let currentFound = false;
  list.forEach(n => {
    if (nodes[n.id]) { n.status = 'done'; n.stars = nodes[n.id].stars; }
    else if (!currentFound) { n.status = 'current'; currentFound = true; }
    else n.status = 'locked';
  });
  return list;
}

function nodeMeta(node) {
  const n = node.steps.length;
  if (node.kind === 'test') return `${n} ${plural(n, ['задание', 'задания', 'заданий'])} · 3 щита · без второго шанса`;
  if (node.kind === 'quiz') return `${n} ${plural(n, ['вопрос', 'вопроса', 'вопросов'])} по теме раздела`;
  return `${n} ${plural(n, ['задание', 'задания', 'заданий'])} · ошибки повторяются в конце`;
}
