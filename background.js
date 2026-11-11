// History Cleaner V2 - service worker (Manifest V3)
// Manual and automatic cleaning share the single cleanAll() function.
const ALARM = 'hc-auto-clean';
const MAX_SECONDS = 7 * 24 * 3600; // upper limit: 7 days

let running = null; // in-flight promise -> prevents duplicate/overlapping cleans

/** Clear browsing history + download RECORDS (downloaded files are never deleted). */
function cleanAll() {
  if (running) return running;
  running = (async () => {
    try {
      await chrome.history.deleteAll();
      await chrome.downloads.erase({}); // erase() removes list entries only, not files on disk
      await chrome.storage.local.set({ lastClean: Date.now(), lastError: null });
      return { ok: true };
    } catch (e) {
      const msg = (e && e.message) || String(e);
      await chrome.storage.local.set({ lastError: msg }).catch(() => {});
      return { ok: false, error: msg };
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Validate interval seconds: finite integer, 1..MAX_SECONDS. */
function validSeconds(s) {
  return Number.isInteger(s) && s >= 1 && s <= MAX_SECONDS;
}

/** Make the alarm match saved settings (create if missing, remove if off, fix if different). */
async function syncAlarm() {
  const { intervalSec = 0 } = await chrome.storage.local.get('intervalSec');
  const existing = await chrome.alarms.get(ALARM);
  if (!validSeconds(intervalSec)) {
    if (existing) await chrome.alarms.clear(ALARM);
    return;
  }
  const mins = intervalSec / 60;
  if (existing && Math.abs((existing.periodInMinutes || 0) - mins) < 1e-9) return; // already correct
  // Same name replaces any existing alarm, so duplicates cannot occur.
  await chrome.alarms.create(ALARM, { delayInMinutes: mins, periodInMinutes: mins });
}

async function setInterval_(intervalSec) {
  if (intervalSec !== 0 && !validSeconds(intervalSec)) throw new Error('Invalid interval.');
  await chrome.storage.local.set({ intervalSec });
  await chrome.alarms.clear(ALARM); // restart so first clean waits a full interval
  await syncAlarm();
}

async function getState() {
  const s = await chrome.storage.local.get(['intervalSec', 'preset', 'customValue', 'customUnit', 'lastClean', 'lastError']);
  const a = await chrome.alarms.get(ALARM);
  return { ...s, intervalSec: s.intervalSec || 0, next: a ? a.scheduledTime : null };
}

chrome.runtime.onMessage.addListener((req, _s, send) => {
  const run = async () => {
    if (req.action === 'clear') return cleanAll();
    if (req.action === 'getState') return { ok: true, state: await getState() };
    if (req.action === 'saveSchedule') {
      await setInterval_(req.intervalSec);
      await chrome.storage.local.set({ preset: req.preset, customValue: req.customValue, customUnit: req.customUnit });
      return { ok: true, state: await getState() };
    }
    return { ok: false, error: 'Unknown action' };
  };
  run().then(send, e => send({ ok: false, error: (e && e.message) || String(e) }));
  return true; // async response
});

chrome.alarms.onAlarm.addListener(a => { if (a.name === ALARM) cleanAll(); });

// Restore alarm after install/update, browser start, and any worker wake-up.
chrome.runtime.onInstalled.addListener(syncAlarm);
chrome.runtime.onStartup.addListener(syncAlarm);
syncAlarm();
