// Shared helpers used by every page.

// Escape text before putting it into HTML.
function esc(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

// GET JSON from the Flask API.
async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Request failed: ' + url);
  return res.json();
}

// POST JSON to the Flask API.
async function apiPost(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data || {})
  });
  return res.json();
}

// Build one exercise preview card (used on Home and Exercises pages).
function exerciseCard(ex, status) {
  let tag = '';
  if (status === 'correct') tag = '<span class="tag done">Completed &#10003;</span>';
  else if (status === 'incorrect') tag = '<span class="tag wrong">Completed &#10007;</span>';

  return `
    <div class="ex-card">
      <img src="/static/img/${esc(ex.icon)}" alt="${esc(ex.topic)} icon">
      <h3>${ex.id}. ${esc(ex.title)}</h3>
      <div class="meta"><span class="tag">${esc(ex.topic)}</span><span class="tag">${esc(ex.difficulty)}</span> ${tag}</div>
      <p>${esc(ex.summary)}</p>
      <a class="btn" href="/exercise/${ex.id}">${status && status !== 'not_started' ? 'Try again' : 'Start exercise'}</a>
    </div>`;
}
