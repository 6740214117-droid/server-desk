const serviceTabs = [...document.querySelectorAll('.service-tab')];
const rowsElement = document.querySelector('#user-rows');
const searchInput = document.querySelector('#user-search');
const form = document.querySelector('#user-form');
const formMessage = document.querySelector('#form-message');
const emptyState = document.querySelector('#empty-state');
const visibleCount = document.querySelector('#visible-count');
const serviceTitle = document.querySelector('#service-title');
const serviceKicker = document.querySelector('#service-kicker');
const toast = document.querySelector('#toast');
const databaseAlert = document.querySelector('.database-alert');
const databaseMessage = document.querySelector('#database-message');
const activeService = window.location.pathname.split('/').filter(Boolean)[0] === 'nginx' ? 'nginx' : 'apache';
const serviceLabel = activeService === 'apache' ? 'Apache' : 'Nginx';
let toastTimer;
let currentUsers = [];

serviceTabs.forEach((tab) => {
  const selected = tab.dataset.service === activeService;
  tab.classList.toggle('is-active', selected);
  if (selected) tab.setAttribute('aria-current', 'page');
  else tab.removeAttribute('aria-current');
});
serviceTitle.textContent = serviceLabel;
serviceKicker.textContent = `${serviceLabel.toUpperCase()} WEB SERVER`;
document.title = `${serviceLabel} Web Server User Console`;

async function readApiResponse(response) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('ไม่พบ API server: ให้รัน npm start แทน Python server');
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'คำขอไม่สำเร็จ');
  return data;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function renderRows() {
  const query = searchInput.value.trim().toLocaleLowerCase('th');
  const filtered = currentUsers.filter((user) =>
    `${user.name} ${user.email} ${user.phone}`.toLocaleLowerCase('th').includes(query)
  );

  rowsElement.innerHTML = filtered.map((user) => `
    <tr>
      <td>${escapeHtml(user.id)}</td>
      <td>${escapeHtml(user.name)}${user.isStudent ? '<span class="student-tag">นักศึกษา</span>' : ''}</td>
      <td>${escapeHtml(user.email)}</td>
      <td>${escapeHtml(user.phone || 'ไม่ระบุ')}</td>
    </tr>
  `).join('');

  emptyState.hidden = filtered.length !== 0;
  rowsElement.hidden = filtered.length === 0;
  visibleCount.textContent = filtered.length;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

searchInput.addEventListener('input', renderRows);
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;

  try {
    const response = await fetch(`/api/${activeService}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim()
      })
    });
    const result = await readApiResponse(response);

    currentUsers.unshift(result);
    form.reset();
    searchInput.value = '';
    formMessage.textContent = 'เพิ่มข้อมูลเรียบร้อย';
    renderRows();
    showToast(`เพิ่มผู้ใช้ใน ${serviceLabel} แล้ว`);
  } catch (error) {
    formMessage.textContent = error.message || 'เชื่อมต่อฐานข้อมูลไม่สำเร็จ';
  } finally {
    submitButton.disabled = false;
  }
});

async function connectDatabase() {
  try {
    const healthResponse = await fetch('/api/health');
    await readApiResponse(healthResponse);

    const usersResponse = await fetch(`/api/${activeService}/users`);
    currentUsers = await readApiResponse(usersResponse);
    databaseMessage.textContent = 'เชื่อมต่อ PostgreSQL แล้ว';
    databaseAlert.classList.add('is-connected');
  } catch (error) {
    databaseMessage.textContent = error.message || 'เชื่อมต่อฐานข้อมูลไม่ได้';
    databaseAlert.classList.add('is-error');
  }
  renderRows();
}

connectDatabase();
