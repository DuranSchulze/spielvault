const urlInput = document.getElementById("url");
const tokenInput = document.getElementById("token");
const saveBtn = document.getElementById("save");
const statusEl = document.getElementById("status");
const profileLink = document.getElementById("profileLink");

chrome.storage.sync.get(["svUrl", "svToken"], ({ svUrl, svToken }) => {
  if (svUrl) {
    urlInput.value = svUrl;
    profileLink.href = svUrl.replace(/\/$/, "") + "/profile";
  }
  if (svToken) tokenInput.value = svToken;
});

urlInput.addEventListener("input", () => {
  const base = urlInput.value.trim().replace(/\/$/, "");
  profileLink.href = base ? base + "/profile" : "#";
});

saveBtn.addEventListener("click", () => {
  const svUrl = urlInput.value.trim().replace(/\/$/, "");
  const svToken = tokenInput.value.trim();
  chrome.storage.sync.set({ svUrl, svToken }, () => {
    statusEl.style.display = "block";
    setTimeout(() => { statusEl.style.display = "none"; }, 2500);
  });
});
