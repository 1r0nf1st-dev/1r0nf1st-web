/**
 * 1r0nf1st Notes Web Clipper - Popup script
 * Corporate theme: clean, minimal, professional
 */

const DEFAULT_SITE_URL = 'https://1r0nf1st.vercel.app';

const $ = (id) => document.getElementById(id);

async function getStored() {
  const { token, siteUrl } = await chrome.storage.sync.get(['token', 'siteUrl']);
  return { token: token || '', siteUrl: siteUrl || DEFAULT_SITE_URL };
}

async function setStored(data) {
  await chrome.storage.sync.set(data);
}

function showPanel(name) {
  document.querySelectorAll('.panel').forEach((p) => {
    p.classList.toggle('hidden', p.id !== name);
  });
}

function showStatus(message, type) {
  const el = $('status');
  el.textContent = message;
  el.className = `status ${type}`;
  el.classList.remove('hidden');
}

function hideStatus() {
  $('status').classList.add('hidden');
}

async function init() {
  const { token, siteUrl } = await getStored();
  if (!token) {
    showPanel('setup');
    $('site-url').value = siteUrl;
    $('settings-link').href = `${siteUrl.replace(/\/$/, '')}/notes`;
    return;
  }
  showPanel('clip');
  await loadNotebooks(token, siteUrl);
  await loadTabInfo();
}

async function loadTabInfo() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.title) {
      $('title-input').value = tab.title;
    }
  } catch {
    // Ignore (e.g. chrome:// page)
  }
}

async function loadNotebooks(token, siteUrl) {
  const select = $('notebook-select');
  select.innerHTML = '<option value="">— Loading —</option>';
  hideStatus();
  try {
    const base = siteUrl.replace(/\/$/, '');
    const res = await fetch(`${base}/api/notes/clip/notebooks`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    if (!res.ok) {
      let msg = text;
      try {
        const j = JSON.parse(text);
        if (j.error) msg = j.error;
      } catch {
        /* use raw text */
      }
      throw new Error(msg || `HTTP ${res.status}`);
    }
    const notebooks = JSON.parse(text);
    select.innerHTML = '<option value="">— No notebook —</option>';
    notebooks.forEach((nb) => {
      const opt = document.createElement('option');
      opt.value = nb.id;
      opt.textContent = nb.name;
      select.appendChild(opt);
    });
  } catch (err) {
    select.innerHTML = '<option value="">— Failed to load —</option>';
    const hint =
      err.message === 'Failed to fetch'
        ? 'Check Site URL and CORS. If using production, ensure the server allows chrome-extension:// origins.'
        : err.message;
    showStatus(hint, 'error');
  }
}

async function getPageContent() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return { title: '', content: '', url: '' };
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const html = document.documentElement?.outerHTML ?? '';
        return {
          title: document.title || '',
          url: window.location.href || '',
          content: html.slice(0, 150000),
        };
      },
    });
    const data = results?.[0]?.result ?? {};
    return {
      title: data.title || tab.title || '',
      url: data.url || tab.url || '',
      content: data.content || '',
    };
  } catch {
    return {
      title: tab.title || '',
      url: tab.url || '',
      content: '',
    };
  }
}

async function handleSaveToken() {
  const siteUrl = $('site-url').value.trim() || DEFAULT_SITE_URL;
  const token = $('token-input').value.trim();
  if (!token) {
    showStatus('Please enter your token', 'error');
    return;
  }
  if (!token.startsWith('nc_')) {
    showStatus('Token should start with nc_. Check you copied it correctly.', 'error');
    return;
  }
  await setStored({ token, siteUrl: siteUrl.replace(/\/$/, '') });
  showPanel('clip');
  hideStatus();
  await loadNotebooks(token, siteUrl);
  await loadTabInfo();
}

async function handleClip() {
  const { token, siteUrl } = await getStored();
  if (!token) {
    showPanel('setup');
    return;
  }
  const titleInput = $('title-input');
  const notebookSelect = $('notebook-select');
  const btn = $('clip-btn');
  btn.disabled = true;
  hideStatus();
  try {
    const { title, content, url } = await getPageContent();
    const base = siteUrl.replace(/\/$/, '');
    const body = {
      title: titleInput.value.trim() || title,
      content,
      source_url: url,
      source_title: title,
      notebook_id: notebookSelect.value || undefined,
    };
    const res = await fetch(`${base}/api/notes/clip`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    showStatus('Clipped successfully!', 'success');
    titleInput.value = '';
  } catch (err) {
    let msg = err.message || 'Failed to clip';
    if (msg === 'Failed to fetch') {
      msg =
        'Network error. Check Site URL. If production, ensure the server allows chrome-extension:// (CORS).';
    }
    showStatus(msg, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function handleLogoutToken() {
  await chrome.storage.sync.remove(['token']);
  showPanel('setup');
  $('token-input').value = '';
  hideStatus();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  init();
  $('save-token').addEventListener('click', handleSaveToken);
  $('clip-btn').addEventListener('click', handleClip);
  $('logout-token').addEventListener('click', handleLogoutToken);
});
