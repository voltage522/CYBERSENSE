// Типы заданий. Каждый тип — функция (step, el, setReady), которая
//   1) рисует задание в el,
//   2) вызывает setReady(true), когда ответ выбран (кнопка «Проверить» становится активной),
//   3) возвращает { pick(i), check() }. check() показывает правильный ответ и
//      возвращает { ok, body } — body это HTML объяснения для нижней панели.

const SCENARIOS = Object.fromEntries(CS_DATA.topics.flatMap(t => t.scenarios.map(s => [s.id, s])));

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Набор кнопок-вариантов с одиночным выбором (используют verdict, choice, tf, chat, domain).
function singleChoice(container, onSelect) {
  const buttons = [...container.querySelectorAll('[data-opt]')];
  let selected = null;
  function select(btn) {
    if (!btn || btn.disabled) return;
    buttons.forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
    selected = btn.dataset.opt;
    onSelect(selected);
  }
  buttons.forEach(b => b.addEventListener('click', () => select(b)));
  return {
    pick: i => select(buttons[i]),
    value: () => selected,
    lock(correctVal) {
      buttons.forEach(b => {
        b.disabled = true;
        if (b.dataset.opt === String(correctVal)) b.classList.add('is-correct');
        else if (b.dataset.opt === selected) b.classList.add('is-wrong');
      });
    }
  };
}

const kbd = i => `<kbd>${i + 1}</kbd>`;

const Exercises = {

  // ---------------------------------------------------- оценить ситуацию
  verdict(step, el, setReady) {
    const s = SCENARIOS[step.s];
    const V = CS_DATA.verdicts;
    el.innerHTML = `
      <h1 class="ex-title">Как вы оцените ситуацию?</h1>
      <p class="ex-lead">${esc(s.context)}</p>
      ${renderScene(s)}
      <div class="opts opts-3" role="group" aria-label="Варианты ответа">
        ${Object.keys(V).map((k, i) => `
          <button class="opt verdict-${k}" data-opt="${k}" aria-pressed="false">${icon(VERDICT_ICON[k])}<span>${V[k].label}</span>${kbd(i)}</button>`).join('')}
      </div>`;
    const sc = singleChoice(el, () => setReady(true));
    return {
      pick: sc.pick,
      check() {
        sc.lock(s.answer);
        const ok = sc.value() === s.answer;
        return {
          ok,
          body: `
            ${ok ? '' : `<p>Правильно: <strong>${V[s.answer].label}</strong></p>`}
            <ul class="fb-list">${s.signs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
            <p class="fb-tip">${icon('shieldCheck')} ${esc(s.tip)}</p>`
        };
      }
    };
  },

  // ---------------------------------------------------- вопрос с вариантами
  choice(step, el, setReady) {
    const order = shuffle(step.options.map((_, i) => i));
    el.innerHTML = `
      <p class="ex-kicker">${icon('help')} Вопрос</p>
      <h1 class="ex-title">${esc(step.q)}</h1>
      <div class="opts">
        ${order.map((orig, pos) => `
          <button class="opt" data-opt="${orig}" aria-pressed="false">${kbd(pos)}<span>${esc(step.options[orig])}</span></button>`).join('')}
      </div>`;
    const sc = singleChoice(el, () => setReady(true));
    return {
      pick: sc.pick,
      check() {
        sc.lock(step.correct);
        const ok = Number(sc.value()) === step.correct;
        return { ok, body: `${ok ? '' : `<p>Правильно: <strong>${esc(step.options[step.correct])}</strong></p>`}<p>${esc(step.why)}</p>` };
      }
    };
  },

  // ---------------------------------------------------- правда или миф
  tf(step, el, setReady) {
    el.innerHTML = `
      <p class="ex-kicker">${icon('target')} Правда или миф?</p>
      <blockquote class="statement">${esc(step.statement)}</blockquote>
      <div class="opts opts-2">
        <button class="opt" data-opt="true" aria-pressed="false">${icon('check')}<span>Правда</span>${kbd(0)}</button>
        <button class="opt" data-opt="false" aria-pressed="false">${icon('x')}<span>Миф</span>${kbd(1)}</button>
      </div>`;
    const sc = singleChoice(el, () => setReady(true));
    return {
      pick: sc.pick,
      check() {
        sc.lock(String(step.answer));
        const ok = sc.value() === String(step.answer);
        return { ok, body: `<p>Это <strong>${step.answer ? 'правда' : 'миф'}</strong>. ${esc(step.why)}</p>` };
      }
    };
  },

  // ---------------------------------------------------- ответ в переписке
  chat(step, el, setReady) {
    const order = shuffle(step.options.map((_, i) => i));
    el.innerHTML = `
      <h1 class="ex-title">${esc(step.prompt)}</h1>
      <figure class="scene">
        <figcaption class="scene-label">${icon('shield')} Учебная симуляция · всё вымышлено</figcaption>
        <div class="m-phone">
          <div class="m-phone-head"><span class="m-avatar">${esc(initials(step.contact))}</span>
            <div><strong>${esc(step.contact)}</strong><small>${esc(step.app)} · ${esc(step.note)}</small></div></div>
          <div class="m-chat" id="chat">${step.messages.map(m => `<p class="m-bubble">${esc(m)}</p>`).join('')}</div>
        </div>
      </figure>
      <div class="opts">
        ${order.map((orig, pos) => `
          <button class="opt reply" data-opt="${orig}" aria-pressed="false">${kbd(pos)}<span>${esc(step.options[orig].t)}</span></button>`).join('')}
      </div>`;
    const sc = singleChoice(el, () => setReady(true));
    const correct = step.options.findIndex(o => o.ok);
    return {
      pick: sc.pick,
      check() {
        const chosen = step.options[Number(sc.value())];
        sc.lock(correct);
        el.querySelector('#chat').insertAdjacentHTML('beforeend', `<p class="m-bubble mine">${esc(chosen.t)}</p>`);
        return {
          ok: chosen.ok,
          body: `<p>${esc(chosen.result)}</p>${chosen.ok ? '' : `<p>Лучше ответить: <strong>${esc(step.options[correct].t)}</strong></p>`}`
        };
      }
    };
  },

  // ---------------------------------------------------- найди подвох
  spot(step, el, setReady) {
    const head = {
      sms: `<div class="m-phone-head"><span class="m-avatar">${esc(initials(step.sender))}</span><div><strong>${esc(step.sender)}</strong><small>SMS</small></div></div>`,
      chat: `<div class="m-phone-head"><span class="m-avatar">${esc(initials(step.sender))}</span><div><strong>${esc(step.sender)}</strong><small>Telegram</small></div></div>`,
      post: `<div class="m-phone-head"><span class="m-avatar">${esc(initials(step.sender))}</span><div><strong>${esc(step.sender)}</strong><small>Объявление в Instagram</small></div></div>`,
      email: `<div class="m-phone-head"><span class="m-avatar">${esc(initials(step.sender))}</span><div><strong>${esc(step.sender)}</strong><small>Письмо</small></div></div>`
    }[step.frame];
    el.innerHTML = `
      <p class="ex-kicker">${icon('search')} Найдите подвох</p>
      <h1 class="ex-title">${esc(step.prompt)}</h1>
      <p class="ex-lead">Нажимайте на фрагменты текста. Можно выбрать несколько.</p>
      <figure class="scene">
        <figcaption class="scene-label">${icon('shield')} Учебная симуляция · всё вымышлено</figcaption>
        <div class="m-phone wide">${head}
          <div class="m-chat"><p class="m-bubble spot-text">
            ${step.parts.map((p, i) => p.plain ? esc(p.t)
              : `${i ? ' ' : ''}<button class="frag" data-i="${i}" aria-pressed="false">${esc(p.t)}</button>`).join('')}
          </p></div>
        </div>
      </figure>`;
    const frags = [...el.querySelectorAll('.frag')];
    frags.forEach(f => f.addEventListener('click', () => {
      if (f.disabled) return;
      f.setAttribute('aria-pressed', String(f.getAttribute('aria-pressed') !== 'true'));
      setReady(frags.some(x => x.getAttribute('aria-pressed') === 'true'));
    }));
    return {
      pick: i => frags[i]?.click(),
      check() {
        let ok = true;
        frags.forEach(f => {
          const part = step.parts[f.dataset.i];
          const on = f.getAttribute('aria-pressed') === 'true';
          f.disabled = true;
          if (part.bad && on) f.classList.add('hit');
          else if (part.bad && !on) { f.classList.add('missed'); ok = false; }
          else if (!part.bad && on) { f.classList.add('wrong'); ok = false; }
        });
        const bad = step.parts.filter(p => p.bad);
        return {
          ok,
          body: `${ok ? '' : '<p>Пунктиром отмечено то, что вы пропустили, красным — лишнее.</p>'}
            <ul class="fb-list">${bad.map(p => `<li><strong>«${esc(p.t)}»</strong> — ${esc(p.why)}</li>`).join('')}</ul>`
        };
      }
    };
  },

  // ---------------------------------------------------- настоящий домен
  domain(step, el, setReady) {
    el.innerHTML = `
      <p class="ex-kicker">${icon('globe')} Читаем адрес</p>
      <h1 class="ex-title">${esc(step.prompt)}</h1>
      <div class="url-puzzle" role="group" aria-label="Части адреса">
        ${step.chips.map((c, i) => `<button class="url-chip" data-opt="${i}" aria-pressed="false">${esc(c.t)}</button>`).join('')}
      </div>
      <p class="ex-lead">Подсказка: настоящий домен — это последние две части перед первым «/».</p>`;
    const sc = singleChoice(el, () => setReady(true));
    const real = step.chips.findIndex(c => c.real);
    return {
      pick: sc.pick,
      check() {
        sc.lock(real);
        const ok = Number(sc.value()) === real;
        return { ok, body: `<p>Настоящий домен: <strong>${esc(step.chips[real].t)}</strong>. ${esc(step.why)}</p>` };
      }
    };
  },

  // ---------------------------------------------------- разложи по группам
  sort(step, el, setReady) {
    const items = shuffle(step.items.map((it, i) => ({ ...it, i })));
    const answers = {};
    el.innerHTML = `
      <p class="ex-kicker">${icon('target')} Разложите по группам</p>
      <h1 class="ex-title">${esc(step.prompt)}</h1>
      <ul class="sort-list">
        ${items.map(it => `
          <li class="sort-row" data-i="${it.i}">
            <span class="sort-text">${esc(it.t)}</span>
            <span class="seg-control" role="group" aria-label="${esc(it.t)}">
              ${step.bins.map((b, bi) => `<button class="seg-btn" data-bin="${bi}" aria-pressed="false">${esc(b)}</button>`).join('')}
            </span>
          </li>`).join('')}
      </ul>`;
    el.querySelectorAll('.sort-row').forEach(row => {
      row.querySelectorAll('.seg-btn').forEach(btn => btn.addEventListener('click', () => {
        if (btn.disabled) return;
        row.querySelectorAll('.seg-btn').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
        answers[row.dataset.i] = Number(btn.dataset.bin);
        setReady(Object.keys(answers).length === step.items.length);
      }));
    });
    return {
      check() {
        let ok = true;
        el.querySelectorAll('.sort-row').forEach(row => {
          const it = step.items[row.dataset.i];
          const right = answers[row.dataset.i] === it.bin;
          if (!right) ok = false;
          row.classList.add(right ? 'is-correct' : 'is-wrong');
          row.querySelectorAll('.seg-btn').forEach(b => {
            b.disabled = true;
            if (Number(b.dataset.bin) === it.bin) b.classList.add('right-bin');
          });
        });
        return { ok, body: `${ok ? '' : '<p>Правильная группа подсвечена в каждой строке.</p>'}<p>${esc(step.why)}</p>` };
      }
    };
  },

  // ---------------------------------------------------- расставь по порядку
  order(step, el, setReady) {
    const bank = shuffle(step.steps.map((t, i) => ({ t, i })));
    const chosen = [];
    el.innerHTML = `
      <p class="ex-kicker">${icon('check')} По порядку</p>
      <h1 class="ex-title">${esc(step.prompt)}</h1>
      <ol class="order-slots" id="slots" aria-label="Ваш порядок"></ol>
      <p class="ex-lead" id="order-hint">Нажимайте на шаги в нужном порядке. Нажмите на шаг в списке, чтобы убрать его.</p>
      <div class="order-bank" id="bank" aria-label="Шаги"></div>`;
    const slots = el.querySelector('#slots');
    const bankEl = el.querySelector('#bank');
    let locked = false;

    function draw() {
      slots.innerHTML = step.steps.map((_, pos) => {
        const c = chosen[pos];
        return c ? `<li><button class="order-item" data-pos="${pos}">${esc(c.t)}</button></li>`
                 : `<li class="slot-empty"><span>Шаг ${pos + 1}</span></li>`;
      }).join('');
      bankEl.innerHTML = bank.filter(b => !chosen.includes(b))
        .map(b => `<button class="order-chip" data-i="${b.i}">${esc(b.t)}</button>`).join('');
      slots.querySelectorAll('.order-item').forEach(btn => btn.addEventListener('click', () => {
        if (locked) return;
        chosen.splice(Number(btn.dataset.pos), 1); draw();
      }));
      bankEl.querySelectorAll('.order-chip').forEach(btn => btn.addEventListener('click', () => {
        if (locked) return;
        chosen.push(bank.find(b => b.i === Number(btn.dataset.i))); draw();
      }));
      setReady(chosen.length === step.steps.length);
    }
    draw();

    return {
      pick: i => bankEl.querySelectorAll('.order-chip')[i]?.click(),
      check() {
        locked = true;
        const ok = chosen.every((c, pos) => c.i === pos);
        slots.querySelectorAll('.order-item').forEach((btn, pos) => {
          btn.disabled = true;
          btn.classList.add(chosen[pos].i === pos ? 'is-correct' : 'is-wrong');
        });
        return {
          ok,
          body: `${ok ? '' : `<p>Правильный порядок:</p><ol class="fb-list">${step.steps.map(t => `<li>${esc(t)}</li>`).join('')}</ol>`}<p>${esc(step.why)}</p>`
        };
      }
    };
  }
};
