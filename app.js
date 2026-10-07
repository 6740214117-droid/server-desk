const serviceTabs = [...document.querySelectorAll('.service-tab')];
const rowsElement = document.querySelector('#user-rows');
const searchInput = document.querySelector('#user-search');
const form = document.querySelector('#user-form');
const formMessage = document.querySelector('#form-message');
const emptyState = document.querySelector('#empty-state');
const visibleCount = document.querySelector('#visible-count');
const serviceTitle = document.querySelector('#service-title');
const serviceKicker = document.querySelector('#service-kicker');
const servicePanel = document.querySelector('#service-panel');
const toast = document.querySelector('#toast');
const databaseAlert = document.querySelector('.database-alert');
const databaseMessage = document.querySelector('#database-message');
let activeService = 'apache';
let toastTimer;
let usersByService = { apache: [], nginx: [] };

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
  const filtered = usersByService[activeService].filter((user) =>
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
  document.querySelector('#apache-count').textContent = usersByService.apache.length;
  document.querySelector('#nginx-count').textContent = usersByService.nginx.length;
}

function selectService(service) {
  activeService = service;
  serviceTabs.forEach((tab) => {
    const selected = tab.dataset.service === service;
    tab.classList.toggle('is-active', selected);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  const label = service === 'apache' ? 'Apache' : 'Nginx';
  serviceTitle.textContent = label;
  serviceKicker.textContent = `${label.toUpperCase()} WEB SERVER`;
  servicePanel.setAttribute('aria-labelledby', `tab-${service}`);
  searchInput.value = '';
  formMessage.textContent = '';
  renderRows();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

serviceTabs.forEach((tab) => {
  tab.addEventListener('click', () => selectService(tab.dataset.service));
  tab.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const nextService = activeService === 'apache' ? 'nginx' : 'apache';
    selectService(nextService);
    document.querySelector(`#tab-${nextService}`).focus();
  });
});

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
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service: activeService,
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim()
      })
    });
    const result = await readApiResponse(response);

    usersByService[activeService].unshift(result);
    form.reset();
    searchInput.value = '';
    formMessage.textContent = 'เพิ่มข้อมูลเรียบร้อย';
    renderRows();
    showToast(`เพิ่มผู้ใช้ใน ${activeService === 'apache' ? 'Apache' : 'Nginx'} แล้ว`);
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

    const usersResponse = await fetch('/api/users');
    usersByService = await readApiResponse(usersResponse);
    databaseMessage.textContent = 'เชื่อมต่อ PostgreSQL แล้ว';
    databaseAlert.classList.add('is-connected');
  } catch (error) {
    databaseMessage.textContent = error.message || 'เชื่อมต่อฐานข้อมูลไม่ได้';
    databaseAlert.classList.add('is-error');
  }
  renderRows();
}

connectDatabase();
