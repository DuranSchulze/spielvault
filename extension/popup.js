let svUrl = "";
let svToken = "";
let debounceTimer = null;

const mainEl = document.getElementById("main");
const setupMsgEl = document.getElementById("setupMsg");
const resultsEl = document.getElementById("results");
const searchInput = document.getElementById("searchInput");

document.getElementById("settingsBtn").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("openOptions").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

chrome.storage.sync.get(["svUrl", "svToken"], ({ svUrl: url, svToken: token }) => {
  if (!url || !token) {
    setupMsgEl.style.display = "block";
    return;
  }
  svUrl = url.replace(/\/$/, "");
  svToken = token;
  mainEl.style.display = "block";
  fetchSpiels("");
});

searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchSpiels(searchInput.value.trim()), 300);
});

async function fetchSpiels(q) {
  resultsEl.innerHTML = '<div class="loading">Loading…</div>';
  try {
    const params = new URLSearchParams({ take: "30" });
    if (q) params.set("q", q);
    const res = await fetch(`${svUrl}/api/spiels?${params}`, {
      headers: { Authorization: `Bearer ${svToken}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const spiels = await res.json();
    renderSpiels(spiels);
  } catch (err) {
    resultsEl.innerHTML = `<div class="empty">Error: ${err.message}</div>`;
  }
}

function renderSpiels(spiels) {
  if (!spiels.length) {
    resultsEl.innerHTML = '<div class="empty">No spiels found.</div>';
    return;
  }
  resultsEl.innerHTML = "";
  spiels.forEach((spiel) => {
    const row = document.createElement("div");
    row.className = "spiel-row";

    const meta = [spiel.department?.name, spiel.category?.name]
      .filter(Boolean)
      .join(" · ");

    row.innerHTML = `
      <div class="spiel-info">
        <div class="spiel-title">${escHtml(spiel.title)}</div>
        ${meta ? `<div class="spiel-meta">${escHtml(meta)}</div>` : ""}
      </div>
      <div class="spiel-actions">
        <button class="btn copy-btn" data-id="${spiel.id}">Copy</button>
        <button class="btn insert-btn" data-id="${spiel.id}">Insert</button>
      </div>
    `;

    row.querySelector(".copy-btn").addEventListener("click", (e) => {
      copySpiel(spiel, e.currentTarget);
    });
    row.querySelector(".insert-btn").addEventListener("click", (e) => {
      insertSpiel(spiel, e.currentTarget);
    });

    resultsEl.appendChild(row);
  });
}

async function copySpiel(spiel, btn) {
  try {
    await navigator.clipboard.writeText(spiel.contentPlain ?? spiel.title);
    flashBtn(btn, "Copied!", "copied");
  } catch {
    flashBtn(btn, "Error", "");
  }
}

function insertSpiel(spiel, btn) {
  chrome.runtime.sendMessage(
    { type: "SV_INSERT", contentHtml: spiel.contentHtml, contentPlain: spiel.contentPlain },
    () => { flashBtn(btn, "Inserted!", "inserted"); },
  );
}

function flashBtn(btn, label, cls) {
  const orig = btn.textContent;
  const origCls = btn.className;
  btn.textContent = label;
  if (cls) btn.className = `btn ${cls}`;
  setTimeout(() => {
    btn.textContent = orig;
    btn.className = origCls;
  }, 1500);
}

function escHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
