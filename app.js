// 金イクラカウンター v2（WAVE1〜3 & 合計のみ入力）
// 保存先：ブラウザの localStorage

const wave1Input = document.getElementById("wave1Input");
const wave2Input = document.getElementById("wave2Input");
const wave3Input = document.getElementById("wave3Input");
const manualTotalInput = document.getElementById("manualTotalInput");
const autoTotalEl = document.getElementById("autoTotal");
const errorMessageEl = document.getElementById("errorMessage");

const shiftNameEl = document.getElementById("shiftName");
const stageNameEl = document.getElementById("stageName");
const historyListEl = document.getElementById("historyList");
const saveShiftBtn = document.getElementById("saveShift");

const STORAGE_KEY = "goldenEggShifts_v2";

function clearError() {
  errorMessageEl.textContent = "";
}

// 入力値を整数 0〜500 に正規化して返す（空欄は0）
function getNormalizedValue(inputEl) {
  const raw = inputEl.value.trim();
  if (raw === "") return 0;

  let n = parseInt(raw, 10);
  if (isNaN(n)) n = 0;
  if (n < 0) n = 0;
  if (n > 500) n = 500;

  // 入力欄の表示も正規化した値にそろえる
  inputEl.value = n.toString();
  return n;
}

// 自動計算合計の更新
function updateAutoTotal() {
  clearError();

  const w1 = getNormalizedValue(wave1Input);
  const w2 = getNormalizedValue(wave2Input);
  const w3 = getNormalizedValue(wave3Input);

  const autoTotal = w1 + w2 + w3;
  autoTotalEl.textContent = autoTotal.toString();
}

// 入力イベントで自動計算を更新
[wave1Input, wave2Input, wave3Input].forEach((el) => {
  el.addEventListener("input", updateAutoTotal);
});

// localStorageから配列で取得
function loadShifts() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (e) {
    console.error("保存データの読み込みに失敗しました", e);
    return [];
  }
}

// localStorageに保存
function saveShifts(shifts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shifts));
}

// 履歴表示
function renderHistory() {
  const shifts = loadShifts();

  if (shifts.length === 0) {
    historyListEl.innerHTML = "<p>まだ保存されたシフトはありません。</p>";
    return;
  }

  historyListEl.innerHTML = "";

  shifts.forEach((shift) => {
    const item = document.createElement("div");
    item.className = "history-item";

    const header = document.createElement("div");
    header.className = "history-header";

    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent =
      (shift.shiftName || "シフト名なし") +
      " / " +
      (shift.stageName || "ステージ名なし");

    const time = document.createElement("div");
    time.className = "history-time";
    time.textContent = shift.timestamp;

    header.appendChild(meta);
    header.appendChild(time);

    const body = document.createElement("div");
    body.className = "history-body";

    const autoText = `自動合計: ${shift.autoTotal}`;
    const manualText =
      shift.manualTotal !== null && shift.manualTotal !== undefined
        ? `合計入力: ${shift.manualTotal}`
        : "合計入力: -";

    body.textContent =
      `W1: ${shift.wave1}, W2: ${shift.wave2}, W3: ${shift.wave3}\n` +
      `${autoText} / ${manualText}\n` +
      `記録合計: ${shift.usedTotal}`;

    const actions = document.createElement("div");
    actions.className = "history-actions";

    // コピー用テキスト
    const copyText =
      `[金イクラ記録]\n` +
      `${shift.timestamp}\n` +
      `${shift.shiftName || ""} / ${shift.stageName || ""}\n` +
      `W1: ${shift.wave1}, W2: ${shift.wave2}, W3: ${shift.wave3}\n` +
      `自動合計: ${shift.autoTotal}, 合計入力: ${
        shift.manualTotal !== null && shift.manualTotal !== undefined
          ? shift.manualTotal
          : "-"
      }\n` +
      `記録合計: ${shift.usedTotal}`;

    const copyBtn = document.createElement("button");
    copyBtn.className = "btn";
    copyBtn.textContent = "コピー";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyText);
        alert("クリップボードにコピーしました！");
      } catch (e) {
        alert("コピーに失敗しました…（HTTPS環境などでお試しください）");
      }
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn danger";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => {
      if (!confirm("このシフトを削除しますか？")) return;
      const current = loadShifts();
      const filtered = current.filter((s) => s.id !== shift.id);
      saveShifts(filtered);
      renderHistory();
    });

    actions.appendChild(copyBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(header);
    item.appendChild(body);
    item.appendChild(actions);

    historyListEl.appendChild(item);
  });
}

// シフト保存ボタンクリック
saveShiftBtn.addEventListener("click", () => {
  clearError();

  // 値を取得・正規化
  const w1 = getNormalizedValue(wave1Input);
  const w2 = getNormalizedValue(wave2Input);
  const w3 = getNormalizedValue(wave3Input);
  const autoTotal = w1 + w2 + w3;

  let manualTotal = null;
  const manualRaw = manualTotalInput.value.trim();
  if (manualRaw !== "") {
    let m = parseInt(manualRaw, 10);
    if (isNaN(m)) m = 0;
    if (m < 0) m = 0;
    if (m > 500) m = 500;
    manualTotal = m;
    manualTotalInput.value = m.toString();
  }

  // 1) 全部0チェック（autoTotal=0 かつ manualTotalがnull/0）
  const manualIsZeroOrNull = manualTotal === null || manualTotal === 0;
  if (autoTotal === 0 && manualIsZeroOrNull) {
    errorMessageEl.textContent =
      "WAVE1〜3のいずれか、または合計のみ入力のどちらかに1以上の値を入力してください。";
    return;
  }

  // 2) 合計の上限チェック（どちらかに値がある場合、最大500）
  if (autoTotal > 0 && autoTotal > 500) {
    errorMessageEl.textContent =
      `自動計算の合計が500を超えています（現在 ${autoTotal}）。合計は最大500までです。`;
    return;
  }

  if (manualTotal !== null && manualTotal > 500) {
    errorMessageEl.textContent =
      "合計のみ入力は0〜500の範囲で入力してください。";
    return;
  }

  // 3) 自動計算と手入力の両方に値がある場合は一致チェック
  if (autoTotal > 0 && manualTotal !== null && manualTotal > 0) {
    if (autoTotal !== manualTotal) {
      errorMessageEl.textContent =
        `自動計算の合計(${autoTotal})と合計のみ入力(${manualTotal})が一致していません。どちらかを修正してください。`;
      return;
    }
  }

  // 記録として使う合計（手入力が優先）
  let usedTotal = autoTotal;
  if (manualTotal !== null && manualTotal > 0) {
    usedTotal = manualTotal;
  }

  // 念のための最終チェック
  if (usedTotal <= 0) {
    errorMessageEl.textContent =
      "記録合計が0以下です。入力内容を確認してください。";
    return;
  }
  if (usedTotal > 500) {
    errorMessageEl.textContent =
      "記録合計が500を超えています。合計は最大500までです。";
    return;
  }

  const now = new Date();
  const timestamp = now.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });

  const shift = {
    id: Date.now(),
    timestamp,
    shiftName: shiftNameEl.value.trim(),
    stageName: stageNameEl.value.trim(),
    wave1: w1,
    wave2: w2,
    wave3: w3,
    autoTotal,
    manualTotal,
    usedTotal
  };

  const shifts = loadShifts();
  shifts.unshift(shift);
  saveShifts(shifts);
  renderHistory();

  alert("シフトを保存しました！");
});

// 初期表示
updateAutoTotal();
renderHistory();
