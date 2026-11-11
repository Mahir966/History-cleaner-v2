<div align="center">

<img src="assets/banner.svg" alt="History Cleaner V2" width="100%">

<br>

![Manifest V3](https://img.shields.io/badge/Manifest-V3-5a5aff?style=for-the-badge&logo=googlechrome&logoColor=white)
![Version](https://img.shields.io/badge/version-2.0.0-a0a0ff?style=for-the-badge)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=black)
![No dependencies](https://img.shields.io/badge/dependencies-0-90ff90?style=for-the-badge)

<a href="https://github.com/Mahir966"><img src="https://readme-typing-svg.demolab.com?font=Segoe+UI&weight=600&size=20&pause=1200&color=A0A0FF&center=true&vCenter=true&width=560&lines=Clear+history+in+one+click;Automatic+cleaning+on+a+schedule;Your+downloaded+files+stay+safe;Lightweight.+Private.+No+tracking." alt="Typing animation"></a>

</div>

---

## ✨ Features

| | Feature | Details |
|---|---|---|
| 🧹 | **Clean Now** | One click clears all browsing history and download records |
| ⏱️ | **Automatic Cleaning** | 12 presets (1 second → 2 hours) plus a custom interval |
| 🔁 | **Survives restarts** | Settings are saved and the schedule is restored after Chrome restarts |
| 🛡️ | **Files stay safe** | Only download *records* are erased, never your actual files |
| 🪶 | **Lightweight** | Vanilla HTML/CSS/JS, no frameworks, no network requests |
| 🌙 | **Dark UI** | Compact popup with a soft indigo accent |

<div align="center">
<img src="assets/popup.png" alt="Popup screenshot" width="300">
</div>

## ⚙️ How it works

<img src="assets/flow.svg" alt="Flow diagram" width="100%">

Manual and automatic cleaning share **one** `cleanAll()` function. Overlapping runs are blocked, and success is reported only after both operations complete.

## 🚀 Installation

1. Download or clone this repository
   ```bash
   git clone https://github.com/Mahir966/History-Cleaner-V2.git
   ```
2. Open `chrome://extensions` and enable **Developer mode**
3. Click **Load unpacked** and select the project folder
4. Pin the extension to your toolbar

## ⏲️ Automatic cleaning

1. Open the popup → **Automatic Cleaning**
2. Choose an interval and click **Save & Apply**
3. The first clean runs after one full interval, then repeats, even with the popup closed

**Custom interval:** choose *Custom*, enter a positive number, pick Seconds / Minutes / Hours. Zero, negative, invalid and values over 7 days are rejected.

**Turn off:** choose *Off (Manual Only)* and Save & Apply.

> [!NOTE]
> Scheduling uses `chrome.alarms`, which is approximate. Intervals under 30 seconds work in unpacked (developer-mode) installs; Chrome enforces a 30-second minimum for packed/Web Store extensions. If the computer sleeps, missed cleans run once Chrome is active again.

## 🔐 Permissions

| Permission | Why |
|---|---|
| `history` | `history.deleteAll()` clears browsing history |
| `downloads` | `downloads.erase({})` clears download records (not files) |
| `alarms` | Reliable scheduling that survives service-worker suspension |
| `storage` | Saves your interval and schedule state locally |

## 📁 Project structure

```
History_Cleaner_V2/
├── manifest.json
├── background.js     # cleanAll(), alarms, state
├── popup.html / popup.js
├── icons/            # 16, 48, 128 px
└── assets/           # README visuals
```

## 👤 Author

Created with 💜 by **[Mahir Ahmed](https://mahir966.github.io/ME/)**
