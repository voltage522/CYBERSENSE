// Общие помощники: экранирование текста, иконки, отрисовка учебных интерфейсов.

function esc(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

// Склонение: plural(3, ['ситуация', 'ситуации', 'ситуаций'])
function plural(n, forms) {
  const rule = new Intl.PluralRules('ru-RU').select(n);
  return rule === 'one' ? forms[0] : rule === 'few' ? forms[1] : forms[2];
}

// ---- Иконки: один набор, контур 1.75px, сетка 24×24 ----
const ICONS = {
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z"/>',
  message: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12Z"/>',
  cart: '<path d="M3 4h2.2l2.3 11h10.8L20.5 8H6.4"/><circle cx="9.5" cy="19" r="1.4"/><circle cx="17" cy="19" r="1.4"/>',
  lock: '<rect x="4.5" y="10.5" width="15" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4L12 4Z"/><path d="M12 10v4.5M12 17.3v.2"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z"/>',
  shieldCheck: '<path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6l-7-3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8M12 17.2v.2"/>',
  arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  rotate: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  paperclip: '<path d="m20 11.5-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.7 17.2a1.7 1.7 0 0 1-2.4-2.4L15 7"/>',
  star: '<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z"/>',
  bookmark: '<path d="M6.5 3.5h11v17L12 16.5l-5.5 4v-17Z"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1-3.8 4-5.8 7.5-5.8s6.5 2 7.5 5.8"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8.5 7.5h7"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5M12 14v3.5M8.5 20.5h7M9.5 17.5h5"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.4 3.6-8.3.4 1.9 1.4 3 2.6 3.6-.2-2.9 1-5.6 3.3-7.1-.3 3 1.2 4.8 2.4 6.6.9 1.4 1.1 2.4 1.1 3.9C18.5 18.4 15.9 21 12 21Z"/>',
  bolt: '<path d="M13 2.5 4.5 13.5H11l-1 8 8.5-11H12l1-8Z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.8"/>'
};

// Закрашенная звезда (для наград)
function starIcon(filled, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round" aria-hidden="true">${ICONS.star}</svg>`;
}

// Шапка приложения: логотип, навигация, серия и опыт.
function renderTopbar(active) {
  const s = streak();
  const el = document.getElementById('topbar');
  if (!el) return;
  el.innerHTML = `
    <div class="wrap topbar-inner">
      <a class="brand" href="index.html"><img src="img/logo.svg" alt="" width="28" height="28">CyberSense</a>
      <nav class="nav" aria-label="Основная навигация">
        <a href="index.html" ${active === 'map' ? 'aria-current="page"' : ''}>Путь</a>
        <a href="progress.html" ${active === 'progress' ? 'aria-current="page"' : ''}>Прогресс</a>
      </nav>
      <div class="stats" aria-label="Ваша статистика">
        <span class="stat-pill streak ${studiedToday() ? 'lit' : ''}" title="Серия: дней подряд с уроками">${icon('flame')}<b class="num">${s}</b><span class="sr">${plural(s, ['день', 'дня', 'дней'])} подряд</span></span>
        <span class="stat-pill xp" title="Опыт">${icon('bolt')}<b class="num">${Store.data().xp}</b><span class="sr">XP</span></span>
      </div>
    </div>`;
}
function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

const VERDICT_ICON = { safe: 'shieldCheck', suspicious: 'help', scam: 'alert' };

// Подсветить ссылку внутри текста сообщения.
function withLink(text, link) {
  const safe = esc(text);
  return link ? safe.replace(esc(link), `<span class="m-link">${esc(link)}</span>`) : safe;
}
function initials(name) {
  return Array.from(name.trim()).filter((ch, i, arr) => i === 0 || arr[i - 1] === ' ').slice(0, 2).join('').toUpperCase();
}

// ---- Учебные интерфейсы: одна функция на каждый kind из data.js ----
const Scenes = {
  sms(s) {
    return `
      <div class="m-phone">
        <div class="m-phone-head">
          <span class="m-avatar">${esc(initials(s.sender))}</span>
          <div><strong>${esc(s.sender)}</strong><small>SMS · сегодня</small></div>
        </div>
        <div class="m-chat">
          <p class="m-bubble">${withLink(s.text, s.link)}</p>
        </div>
      </div>`;
  },

  email(s) {
    return `
      <div class="m-window m-mail">
        <div class="m-mail-head">
          <p class="m-mail-subject">${esc(s.subject)}</p>
          <div class="m-mail-from">
            <span class="m-avatar">${esc(initials(s.sender))}</span>
            <div><strong>${esc(s.sender)}</strong> <span class="m-muted">&lt;${esc(s.address)}&gt;</span><br>
              <span class="m-muted">кому: мне</span></div>
          </div>
        </div>
        <div class="m-mail-body">
          ${s.body.map(p => `<p>${esc(p)}</p>`).join('')}
          ${s.button ? `<span class="m-fake-btn">${esc(s.button)}</span>
            <p class="m-hover">${icon('link')} Ссылка ведёт на: ${esc(s.link)}</p>` : ''}
        </div>
      </div>`;
  },

  browser(s) {
    const p = s.page;
    let content = '';
    if (p.product) {
      content = `
        <div class="m-product">
          <img src="${esc(p.product.image)}" alt="Фото товара: чёрные беспроводные наушники" width="300" height="260">
          <div>
            <p class="m-product-name">${esc(p.product.name)}</p>
            <p><span class="m-price">${esc(p.product.price)}</span> <s class="m-muted">${esc(p.product.old)}</s> <span class="m-badge">${esc(p.product.discount)}</span></p>
            <ul class="m-facts">${p.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
          </div>
        </div>`;
    } else {
      content = `
        <div class="m-site">
          <p class="m-site-title">${esc(p.heading)}</p>
          <p class="m-muted">${esc(p.text)}</p>
          ${(p.fields || []).map(f => `<label class="m-field"><span>${esc(f)}</span><input type="text" disabled aria-label="${esc(f)} (учебный пример, ввод отключён)"></label>`).join('')}
          ${p.button ? `<span class="m-fake-btn">${esc(p.button)}</span>` : ''}
        </div>`;
    }
    return `
      <div class="m-window">
        ${urlBar(s.url, s.secure, s.bookmark)}
        ${content}
      </div>`;
  },

  search(s) {
    return `
      <div class="m-window">
        <div class="m-search-bar">${icon('search')} ${esc(s.query)}</div>
        <div class="m-results">
          ${s.results.map(r => `
            <div class="m-result">
              <p class="m-result-url">${r.ad ? '<span class="m-ad">Реклама</span>' : ''}${esc(r.url)}</p>
              <p class="m-result-title">${esc(r.title)}</p>
              <p class="m-muted">${esc(r.text)}</p>
            </div>`).join('')}
        </div>
      </div>`;
  },

  chat(s) {
    return `
      <div class="m-phone">
        <div class="m-phone-head">
          <span class="m-avatar">${esc(initials(s.contact))}</span>
          <div><strong>${esc(s.contact)}</strong><small>${esc(s.app)} · ${esc(s.note)}</small></div>
        </div>
        <div class="m-chat">
          ${s.messages.map(m => `<p class="m-bubble">${s.group ? `<b class="m-author">${esc(s.group)}</b>` : ''}${withLink(m, m.match(/[a-z0-9-]+\.(example|com)[^\s]*/)?.[0])}</p>`).join('')}
        </div>
      </div>`;
  },

  listing(s) {
    return `
      <div class="m-window m-listing">
        <div class="m-seller">
          <span class="m-avatar">${esc(initials(s.seller))}</span>
          <div><strong>${esc(s.seller)}</strong><small>${esc(s.sellerNote)}</small></div>
        </div>
        <p class="m-product-name">${esc(s.product)}</p>
        <p><span class="m-price">${esc(s.price)}</span>${s.priceNote ? ` <span class="m-muted">${esc(s.priceNote)}</span>` : ''}</p>
        <ul class="m-facts">${s.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      </div>`;
  },

  popup(s) {
    return `
      <div class="m-window">
        ${urlBar(s.url, true)}
        <div class="m-popup-stage">
          <div class="m-popup" role="presentation">
            <p class="m-popup-title">${icon('alert')} ${esc(s.popup.title)}</p>
            <p>${esc(s.popup.text)}</p>
            <span class="m-fake-btn danger">${esc(s.popup.button)}</span>
          </div>
        </div>
      </div>`;
  }
};

function urlBar(url, secure, bookmark) {
  return `
    <div class="m-urlbar">
      <span class="${secure ? 'm-secure' : 'm-insecure'}">${secure ? icon('lock') : icon('alert')}${secure ? '' : ' Не защищено'}</span>
      <span class="m-url">${esc(url)}</span>
      ${bookmark ? `<span class="m-bookmark" title="Открыто из закладок">${icon('bookmark')}</span>` : ''}
    </div>`;
}

function renderScene(s) {
  return `
    <figure class="scene">
      <figcaption class="scene-label">${icon('shield')} Учебная симуляция · всё вымышлено, ничего не работает</figcaption>
      ${Scenes[s.kind](s)}
    </figure>`;
}
