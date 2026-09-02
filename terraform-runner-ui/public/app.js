const applyBtn = document.getElementById("applyBtn");
const destroyBtn = document.getElementById("destroyBtn");
const dbApplyBtn = document.getElementById("dbApplyBtn");
const dbDestroyBtn = document.getElementById("dbDestroyBtn");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const startCard = document.getElementById("startCard");
const stopCard = document.getElementById("stopCard");
const statusEl = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const healthDot = document.getElementById("healthDot");
const healthLabel = document.getElementById("healthLabel");
const logsEl = document.getElementById("logs");

const ALL_BUTTONS = [applyBtn, destroyBtn, dbApplyBtn, dbDestroyBtn, startBtn, stopBtn];

function setDotState(dot, state) {
  if (!dot) return;
  dot.classList.remove("is-idle", "is-running", "is-ok", "is-err");
  dot.classList.add(`is-${state}`);
}

function setStatus(text, state) {
  if (statusEl) statusEl.textContent = text;
  if (healthLabel) healthLabel.textContent = text;
  setDotState(statusDot, state);
  setDotState(healthDot, state);
}

function applyInstanceCardsVisibility(state) {
  if (startCard) startCard.classList.toggle("hidden", !state.showStart);
  if (stopCard) stopCard.classList.toggle("hidden", !state.showStop);
}

async function refreshInstanceCardsVisibility() {
  try {
    const response = await fetch("/api/instance-state");
    const result = await response.json();
    if (!response.ok || !result.ok) {
      if (startCard) startCard.classList.add("hidden");
      if (stopCard) stopCard.classList.add("hidden");
      return;
    }
    applyInstanceCardsVisibility(result);
  } catch (_err) {
    if (startCard) startCard.classList.add("hidden");
    if (stopCard) stopCard.classList.add("hidden");
  }
}

function setButtonsDisabled(disabled) {
  ALL_BUTTONS.forEach((btn) => {
    if (btn) btn.disabled = disabled;
  });
}

async function runAction(action) {
  const isDestroy = action === "destroy" || action === "db-destroy";
  const isPowerAction = action === "start-instances" || action === "stop-instances";
  const endpoint =
    action === "db-apply"
      ? "/api/db/apply"
      : action === "db-destroy"
        ? "/api/db/destroy"
        : `/api/${action}`;
  const actionLabel =
    action === "db-apply"
      ? "apply selfservice-db"
      : action === "db-destroy"
        ? "destroy selfservice-db"
        : action;

  if (isDestroy) {
    const confirmed = window.confirm(
      "Confirmer terraform destroy ? Cette action supprime les ressources creees."
    );
    if (!confirmed) {
      return;
    }
  }

  setButtonsDisabled(true);
  setStatus(`running ${actionLabel}`, "running");
  logsEl.textContent = isPowerAction
    ? `> ec2 ${action}\n`
    : `> terraform init && terraform ${actionLabel}\n`;

  try {
    const response = await fetch(endpoint, { method: "POST" });
    const result = await response.json();

    logsEl.textContent = result.logs || "// no output";

    if (!response.ok || !result.ok) {
      const code = result.exitCode ?? "?";
      const step = result.step || "unknown";
      setStatus(`error (${step}, code ${code})`, "err");
      return;
    }

    setStatus(`ok · ${actionLabel}`, "ok");
  } catch (err) {
    setStatus("network error", "err");
    logsEl.textContent += `\n\n! ${err.message}`;
  } finally {
    setButtonsDisabled(false);
    await refreshInstanceCardsVisibility();
  }
}

if (applyBtn) applyBtn.addEventListener("click", () => runAction("apply"));
if (destroyBtn) destroyBtn.addEventListener("click", () => runAction("destroy"));
if (dbApplyBtn) dbApplyBtn.addEventListener("click", () => runAction("db-apply"));
if (dbDestroyBtn) dbDestroyBtn.addEventListener("click", () => runAction("db-destroy"));
if (startBtn) startBtn.addEventListener("click", () => runAction("start-instances"));
if (stopBtn) stopBtn.addEventListener("click", () => runAction("stop-instances"));

setStatus("idle", "idle");
refreshInstanceCardsVisibility();
