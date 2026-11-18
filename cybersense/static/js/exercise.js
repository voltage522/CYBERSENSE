// Exercise page: loads one exercise from the API, draws the simulated
// interface, lets the user answer and shows the feedback from the server.

const exerciseId = parseInt(location.pathname.split('/').pop(), 10);
const box = document.getElementById('exercise');

const TRAINING_BANNER =
  '<div class="training-banner">&#9888; TRAINING EXAMPLE &mdash; simulated interface. ' +
  'Not a real company or website. Nothing here can be clicked or submitted.</div>';

// ---------------------------------------------------------------------------
// One function per simulated interface ("scene.type" from app.py)
// ---------------------------------------------------------------------------
const scenes = {

  email(s) {
    return `
      <div class="mail">
        <div class="mail-toolbar">Inbox &rsaquo; Message &nbsp;|&nbsp; Reply &nbsp; Forward &nbsp; Delete</div>
        <div class="mail-head">
          <div class="subject">${esc(s.subject)}</div>
          <div class="from">
            <div class="avatar">P</div>
            <div>
              <strong>${esc(s.sender_name)}</strong>
              <span class="addr">&lt;${esc(s.sender_email)}&gt;</span><br>
              <span class="addr">to ${esc(s.to)} &middot; ${esc(s.date)}</span>
            </div>
          </div>
        </div>
        <div class="mail-body">
          <img class="logo" src="/static/img/${esc(s.logo)}" alt="PayFlow logo (fictional company)">
          ${s.body.map(p => `<p>${esc(p)}</p>`).join('')}
          <span class="fake-button" title="${esc(s.button_url)}">${esc(s.button_text)}</span>
          <div class="hover-url">Link destination (shown when hovering): ${esc(s.button_url)}</div>
          <p>Kind regards,<br>${esc(s.signature)}</p>
          <div class="attachment">&#128206; ${esc(s.attachment)} <span class="addr">(184 KB)</span></div>
        </div>
      </div>`;
  },

  website(s) {
    return `
      <div class="browser">
        <div class="browser-tab">&#128196; ${esc(s.tab_title)}</div>
        <div class="browser-bar">
          <span>&larr; &rarr; &#8635;</span>
          <span class="not-secure">&#9888; Not secure</span>
          <span class="url">${esc(s.url)}</span>
        </div>
        <div class="site">
          <div class="alert">${esc(s.banner)}</div>
          <div class="login-box">
            <img src="/static/img/${esc(s.logo)}" alt="NorthStar Bank logo (fictional bank)">
            <h3 style="text-align:center;margin:0">${esc(s.heading)}</h3>
            ${s.fields.map(f => `
              <label>${esc(f.label)}</label>
              <input type="text" placeholder="${esc(f.placeholder)}" disabled>`).join('')}
            <button class="fake-submit" disabled>${esc(s.button)}</button>
            <div class="site-footer-fake">${esc(s.footer)}</div>
          </div>
        </div>
      </div>`;
  },

  sms(s) {
    const bubbles = s.messages.map(m => m.from === 'system'
      ? `<div class="bubble system"><b>New SMS &middot; NorthStar</b>${esc(m.text.replace('SMS from NorthStar: ', ''))}</div>`
      : `<div class="bubble them">${esc(m.text)}</div>`).join('');
    return `
      <div class="phone">
        <div class="phone-top">
          <img src="/static/img/${esc(s.avatar)}" alt="Unknown contact profile picture">
          <div><strong>${esc(s.contact)}</strong><div class="num">${esc(s.number)} &middot; not in your contacts</div></div>
        </div>
        <div class="chat">
          <div class="time">Today ${esc(s.time)}</div>
          ${bubbles}
        </div>
      </div>`;
  },

  shop(s) {
    const stars = n => '&#9733;'.repeat(n) + '&#9734;'.repeat(5 - n);
    const initials = name => name.split(' ').map(w => w[0]).join('');
    return `
      <div class="browser">
        <div class="browser-bar"><span>&#128274;</span><span class="url">${esc(s.url)}</span></div>
        <div class="shop-head">&#128722; ${esc(s.store)}</div>
        <div class="product">
          <img src="/static/img/${esc(s.image)}" alt="Product photo: black wireless headphones">
          <div>
            <h2 style="margin-top:0">${esc(s.product)}</h2>
            <div><span class="price">${esc(s.price)}</span><span class="old-price">${esc(s.old_price)}</span><span class="discount">${esc(s.discount)}</span></div>
            <div class="stock">&#9203; ${esc(s.stock)}</div>
            <div class="seller">
              <img src="/static/img/${esc(s.seller.avatar)}" alt="Seller profile picture">
              <div><strong>${esc(s.seller.name)}</strong><br>
                ${esc(s.seller.joined)} &middot; ${esc(s.seller.sales)}<br>
                <span class="stars">&#9733;</span> ${esc(s.seller.rating)}</div>
            </div>
            <button class="btn" style="margin-top:12px" disabled>Buy now</button>
          </div>
        </div>
        <div class="shop-section">
          <h3>Payment instructions</h3>
          <div class="payment-box"><ul style="margin:0;padding-left:18px">${s.payment.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>
          <h3>Customer reviews</h3>
          ${s.reviews.map(r => `
            <div class="review">
              <div class="initials">${esc(initials(r.name))}</div>
              <div><strong>${esc(r.name)}</strong> <span class="stars">${stars(r.stars)}</span>
                <span class="progress-label">&middot; ${esc(r.date)}</span><br>${esc(r.text)}</div>
            </div>`).join('')}
        </div>
      </div>`;
  },

  passwords(s) {
    return `<div class="card" style="margin:0">
      <img src="/static/img/icon-password.svg" alt="" style="width:40px;vertical-align:middle">
      <strong>University Portal &middot; Create account</strong>
      <p>${esc(s.intro)}</p>
      <p class="progress-label">The options are listed below. Think about length and how predictable each one is.</p>
    </div>`;
  }
};

// ---------------------------------------------------------------------------
// Page drawing
// ---------------------------------------------------------------------------
function render(ex) {
  document.title = ex.title + ' - CyberSense';
  const isPw = ex.scene.type === 'passwords';

  box.innerHTML = `
    <div class="card">
      <div class="ex-header">
        <img src="/static/img/${esc(ex.icon)}" alt="${esc(ex.topic)} icon">
        <div>
          <div class="progress-label">Exercise ${ex.id} of ${ex.total} &middot; ${esc(ex.topic)} &middot; ${esc(ex.difficulty)}</div>
          <h1>${esc(ex.title)}</h1>
        </div>
      </div>
      <p><strong>Scenario:</strong> ${esc(ex.scenario)}</p>
    </div>

    <div class="scene">${TRAINING_BANNER}${scenes[ex.scene.type](ex.scene)}</div>

    <div class="card">
      <h2 style="margin-top:0">${esc(ex.question)}</h2>
      <form class="options" id="options">
        ${ex.options.map((opt, i) => `
          <label class="${isPw ? 'pw-option' : ''}" data-option="${esc(opt)}">
            <input type="radio" name="answer" value="${esc(opt)}">
            ${isPw ? `<code>${esc(opt)}</code>` : esc(opt)}
          </label>`).join('')}
      </form>
      <p id="error" style="color:#b91c1c" hidden>Please choose an answer first.</p>
      <div class="btn-row">
        <button class="btn" id="submit">Submit Answer</button>
      </div>
      <div id="feedback"></div>
    </div>`;

  document.getElementById('submit').onclick = () => submitAnswer(ex);
}

async function submitAnswer(ex) {
  const chosen = document.querySelector('input[name="answer"]:checked');
  const error = document.getElementById('error');
  if (!chosen) { error.hidden = false; return; }
  error.hidden = true;

  const res = await apiPost('/api/answer', { exercise_id: ex.id, answer: chosen.value });
  if (res.error) { error.textContent = res.error; error.hidden = false; return; }

  // Lock the answers and highlight right / wrong choices.
  document.querySelectorAll('#options input').forEach(i => i.disabled = true);
  document.getElementById('submit').disabled = true;
  document.querySelectorAll('#options label').forEach(label => {
    const opt = label.dataset.option;
    if (opt === res.your_answer) label.classList.add(res.correct ? 'chosen-correct' : 'chosen-wrong');
    else if (opt === res.correct_answer) label.classList.add('right-answer');
  });

  const isLast = ex.id >= ex.total;
  const next = isLast
    ? '<a class="btn" href="/progress">See My Progress &rarr;</a>'
    : `<a class="btn" href="/exercise/${ex.id + 1}">Next Exercise &rarr;</a>`;

  document.getElementById('feedback').innerHTML = `
    <div class="feedback ${res.correct ? 'ok' : 'bad'}">
      <h2>${res.correct ? '&#10003; Correct!' : '&#10007; Not quite.'}</h2>
      <p><strong>Your answer:</strong> ${esc(res.your_answer)}<br>
         <strong>Correct answer:</strong> ${esc(res.correct_answer)}</p>
      <p>${esc(res.explanation)}</p>

      <h3>${ex.scene.type === 'passwords' ? 'Key lessons' : 'Warning signs you should notice'}</h3>
      <ul>${res.signs.map(s => `<li>${esc(s)}</li>`).join('')}</ul>

      <h3>What each choice means</h3>
      ${res.options_feedback.map(o => `
        <div class="option-review">
          ${o.is_correct ? '&#10003;' : '&#10007;'} <strong>${esc(o.option)}</strong><br>${esc(o.feedback)}
        </div>`).join('')}

      <div class="btn-row">
        ${next}
        <a class="btn secondary" href="/exercises">Back to Exercises</a>
      </div>
    </div>`;
  document.getElementById('feedback').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

apiGet('/api/exercises/' + exerciseId)
  .then(render)
  .catch(() => {
    box.innerHTML = '<div class="card"><h1>Exercise not found</h1>' +
      '<p>This exercise does not exist.</p><a class="btn" href="/exercises">Back to Exercises</a></div>';
  });
