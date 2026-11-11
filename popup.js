// History Cleaner V2 - popup logic
const $ = id => document.getElementById(id);
const PRESETS = [
  ['0', 'Off (Manual Only)'], ['1', '1 Second'], ['3', '3 Seconds'], ['5', '5 Seconds'],
  ['10', '10 Seconds'], ['30', '30 Seconds'], ['60', '1 Minute'], ['300', '5 Minutes'],
  ['600', '10 Minutes'], ['1800', '30 Minutes'], ['3600', '1 Hour'], ['7200', '2 Hours'], ['custom', 'Custom']
];
const UNIT = { seconds: 1, minutes: 60, hours: 3600 };
const MAX_SECONDS = 7 * 24 * 3600;

const send = msg => new Promise(res => chrome.runtime.sendMessage(msg, r => {
  res(chrome.runtime.lastError ? { ok: false, error: chrome.runtime.lastError.message } : (r || { ok: false, error: 'No response' }));
}));

function fmt(sec) {
  if (sec % 3600 === 0) return sec / 3600 + (sec === 3600 ? ' hour' : ' hours');
  if (sec % 60 === 0) return sec / 60 + (sec === 60 ? ' minute' : ' minutes');
  return sec + (sec === 1 ? ' second' : ' seconds');
}

function flash(el, text, cls, ms = 1500) {
  el.textContent = text;
  el.className = 'status-text show ' + cls;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = 'status-text'; }, ms);
}

document.addEventListener('DOMContentLoaded', () => {
  const cleanBtn = $('clearHistoryBtn'), statusEl = $('status'), btnText = cleanBtn.querySelector('.btn-text');
  const sel = $('preset'), customRow = $('customRow'), cVal = $('customValue'), cUnit = $('customUnit');
  const saveBtn = $('saveBtn'), autoStatus = $('autoStatus');
  let timer;

  PRESETS.forEach(([v, t]) => sel.add(new Option(t, v)));

  // ---- Clean Now (same background cleanAll() used by the scheduler) ----
  cleanBtn.addEventListener('click', async () => {
    cleanBtn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Cleaning...';
    statusEl.className = 'status-text show';
    statusEl.textContent = 'Clearing history...';
    const r = await send({ action: 'clear' });
    if (r.ok) flash(statusEl, '✓ History cleared!', 'success');
    else flash(statusEl, '✗ ' + (r.error || 'Failed to clear'), 'error', 3500);
    setTimeout(() => { cleanBtn.disabled = false; btnText.textContent = 'Clean Now'; }, 1500);
  });
  cleanBtn.addEventListener('mouseenter', () => { if (!cleanBtn.disabled) cleanBtn.style.transform = 'translateY(-1px)'; });
  cleanBtn.addEventListener('mouseleave', () => { cleanBtn.style.transform = 'translateY(0)'; });

  // ---- Automatic cleaning UI ----
  sel.addEventListener('change', () => { customRow.hidden = sel.value !== 'custom'; $('formErr').textContent = ''; });

  /** Returns seconds (0 = off) or null if invalid (error shown). */
  function readInterval() {
    const err = $('formErr'); err.textContent = '';
    if (sel.value !== 'custom') return Number(sel.value);
    const raw = cVal.value.trim();
    if (!/^\d+(\.\d+)?$/.test(raw)) { err.textContent = 'Enter a positive number.'; return null; }
    const sec = Math.round(Number(raw) * UNIT[cUnit.value]);
    if (!(sec >= 1)) { err.textContent = 'Interval must be at least 1 second.'; return null; }
    if (sec > MAX_SECONDS) { err.textContent = 'Maximum is 7 days (168 hours).'; return null; }
    return sec;
  }

  saveBtn.addEventListener('click', async () => {
    const sec = readInterval();
    if (sec === null) return;
    saveBtn.disabled = true;
    const r = await send({ action: 'saveSchedule', intervalSec: sec, preset: sel.value, customValue: cVal.value.trim(), customUnit: cUnit.value });
    saveBtn.disabled = false;
    if (!r.ok) { $('formErr').textContent = r.error || 'Could not save.'; return; }
    render(r.state);
    flash(statusEl, sec ? '✓ Auto-clean saved' : '✓ Auto-clean off', 'success');
  });

  function render(s) {
    const on = s.intervalSec > 0;
    autoStatus.textContent = on ? 'ON' : 'OFF';
    autoStatus.className = 'badge ' + (on ? 'on' : 'off');
    $('selInterval').textContent = on ? 'Every ' + fmt(s.intervalSec) : 'Disabled';
    $('nextRun').textContent = !on ? 'Auto-cleaning is disabled' :
      s.next ? new Date(s.next).toLocaleTimeString() + ' (approx.)' : 'Scheduling...';
    $('lastRun').textContent = s.lastError ? 'Error: ' + s.lastError : (s.lastClean ? new Date(s.lastClean).toLocaleTimeString() : '—');
  }

  async function load(first) {
    const r = await send({ action: 'getState' });
    if (!r.ok) return;
    const s = r.state;
    if (first) {
      const known = PRESETS.some(([v]) => v === String(s.intervalSec));
      sel.value = s.preset && PRESETS.some(([v]) => v === s.preset) ? s.preset : (known ? String(s.intervalSec) : (s.intervalSec ? 'custom' : '0'));
      if (s.customValue) cVal.value = s.customValue;
      if (s.customUnit) cUnit.value = s.customUnit;
      customRow.hidden = sel.value !== 'custom';
    }
    render(s);
  }
  load(true);
  timer = setInterval(() => load(false), 2000); // UI refresh only; scheduling is done by chrome.alarms
  window.addEventListener('unload', () => clearInterval(timer));
});
