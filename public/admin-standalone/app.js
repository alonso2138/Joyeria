const CSV_URL = "https://docs.google.com/spreadsheets/d/1UTNIkH7J9xPVrOHHL0RgqsZ0Yuz6r6StQWu6ASVQSww/export?format=csv";
const JSONBIN_ID = "6933a43ed0ea881f40160685";
const JSONBIN_KEY = "$2a$10$rPqE1JsFS6PXMYIptbDDTeMcuCSdqKBJEJOGouYQAqPDkhE0/eZaW ";
const SHEETS_HOOK_URL = "https://script.google.com/macros/s/AKfycbzciy1qvE6EVXbqoEB4ame0BBd4-1owpZ4ZzA5-pNdrVUma4h451Kkww1zgx7k7UXA3/exec"; // TODO: set to Apps Script URL when available
const REFRESH_MS = 10000;
const SERVER_URL = 'https://api.visualizalo.es/api'

const scoreWeights = {
  "cold-approach": 1,
  "open-cold": 1,
  "open-followup": 1,
  "link-click": 3,
  "reply": 6,
  "meeting": 10,
};

const actionLabels = {
  "cold-approach": "Cold abierto",
  "open-cold": "Cold abierto",
  "open-followup": "Follow-up abierto",
  "follow-up": "Follow-up abierto",
  "link-click": "Link click (email)",
  "reply": "Reply",
  "meeting": "Meeting agendada",
  "try-on": "Try-on demo",
  "try-on-started": "Try-on iniciado",
  "custom-jewel": "Joya personalizada",
};

let cachedLeads = new Map();
let currentCampaignFilter = "all";
let adminAction = "";
let currentLaunchContext = null;

document.addEventListener("DOMContentLoaded", () => {
  loadAllData();
  setInterval(loadAllData, REFRESH_MS);
  setupFilters();
  document.getElementById("searchInput").addEventListener("input", onSearch);
  setupControlButtons();
});

async function loadAllData() {
  setSyncStatus("Sincronizando...");
  try {
    const [csvRows, events] = await Promise.all([fetchCsv(), fetchEvents()]);
    const { rowsWithoutAdmin, adminAction: csvAdminAction } = extractAdminControl(csvRows);
    adminAction = csvAdminAction;

    const leadsMap = buildLeadsFromCsv(rowsWithoutAdmin);
    attachEvents(events, leadsMap);
    cachedLeads = leadsMap;

    computeLeadScores(leadsMap);
    updateCampaignFilterOptions(leadsMap);
    renderDashboard(leadsMap);
    setSyncStatus(`Actualizado ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error("Error cargando datos", err);
    setSyncStatus("Error al sincronizar");
  }
}

async function fetchCsv() {
  const res = await fetch(CSV_URL);
  if (!res.ok) {
    throw new Error("No se pudo descargar el CSV");
  }
  const text = await res.text();
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return parsed.data || [];
}

async function fetchEvents() {
  if (!JSONBIN_ID || JSONBIN_ID === "RELLENAR") {
    console.warn("Configura JSONBIN_ID y JSONBIN_KEY para traer eventos.");
    return [];
  }
  const url = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`;
  const res = await fetch(url, {
    headers: {
      "X-Master-Key": JSONBIN_KEY || "",
      "Content-Type": "text/plain;charset=utf-8",
    },
  });
  if (!res.ok) {
    throw new Error("No se pudo leer JSONBin");
  }
  const json = await res.json();
  const payload = json.record || json;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.events)) return payload.events;
  return [];
}

function extractAdminControl(rows) {
  let adminRowAction = "";
  const remaining = [];
  rows.forEach((row, idx) => {
    const name = (row["Nombre"] || "").trim().toUpperCase();
    if (name === "ADMIN") {
      adminRowAction = (row["Accion"] || "").trim();
    } else {
      remaining.push(row);
    }
  });
  return { rowsWithoutAdmin: remaining, adminAction: adminRowAction };
}

function buildLeadsFromCsv(rows) {
  const leads = new Map();
  rows.forEach((row) => {
    const email = normalizeEmail(row["Email"]);
    if (!email) return;
    const lead = {
      nombre: (row["Nombre"] || "").trim() || "Sin nombre",
      email,
      estado: (row["Estado"] || "").trim() || "Sin estado",
      campanaId: normalizeCampaignId(row["ID campana"]),
      aperturasCold: toInt(row["Aperturas de cold"]),
      aperturasFollow: toInt(row["Aperturas de follow-up"]),
      aperturasLink: toInt(row["Aperturas de link"]),
      respuesta: (row["Respuesta"] || "").trim(),
      tryOn: toInt(row["Try-On Generado"]),
      tryOnStarted: toInt(row["Try-On-Comenzado"]),
      eventos: [],
      score: 0,
      ultimaAccion: null,
    };
    if (leads.has(email)) {
      const merged = mergeLeadRecords(leads.get(email), lead);
      leads.set(email, merged);
    } else {
      leads.set(email, lead);
    }
  });
  return leads;
}

function attachEvents(events, leadsMap) {
  const noise = [];
  const counts = {};
  events.forEach((ev) => {
    const email = normalizeEmail(ev.email);
    if (!email) return;
    const action = normalizeActionType(ev.action_type);
    if (!action) return;

    const safeEvent = {
      email,
      action_type: action,
      timestamp: ev.timestamp || new Date().toISOString(),
    };

    if (leadsMap.has(email)) {
      leadsMap.get(email).eventos.push(safeEvent);
      if (!counts[action]) counts[action] = 0;
      counts[action] += 1;
    } else {
      noise.push(safeEvent);
    }
  });

  leadsMap.forEach((lead) => {
    lead.eventos.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    lead.ultimaAccion = lead.eventos[0] || null;
  });

  return { noise, eventCounts: counts };
}

function computeLeadScores(leadsMap) {
  leadsMap.forEach((lead) => {
    const score = lead.eventos.reduce((acc, ev) => {
      return acc + (scoreWeights[ev.action_type] || 0);
    }, 0);
    lead.score = score;
  });
}

function computeMetrics(leadsMap) {
  const totalLeads = leadsMap.size;
  let coldSent = 0;
  let followSent = 0;
  let coldOpeners = 0;
  let followOpeners = 0;
  let replied = 0;
  let tryOnCount = 0;
  let tryOnTotal = 0;
  let tryOnStartedCount = 0;
  let tryOnStartedTotal = 0;
  const uniqueClickers = new Set();

  leadsMap.forEach((lead, email) => {
    if (isFollowUpEstado(lead.estado)) {
      coldSent += 1;
      followSent += 1;
    } else if (isColdEstado(lead.estado)) {
      coldSent += 1;
    }

    if (lead.aperturasCold > 0) coldOpeners += 1;
    if (lead.aperturasFollow > 0) followOpeners += 1;
    if (lead.aperturasLink > 0) uniqueClickers.add(email);
    if (isYes(lead.respuesta)) replied += 1;
    if (lead.tryOn > 0) tryOnCount += 1;
    tryOnTotal += lead.tryOn;
    if (lead.tryOnStarted > 0) tryOnStartedCount += 1;
    tryOnStartedTotal += lead.tryOnStarted;
  });

  const openRateCold = rate(coldOpeners, coldSent);
  const openRateFollow = rate(followOpeners, followSent);
  const clickRate = rate(uniqueClickers.size, coldSent);
  const replyRate = rate(replied, coldSent);
  const tryOnRate = rate(tryOnCount, coldSent);
  const tryOnStartedRate = rate(tryOnStartedCount, coldSent);
  const progressRate = rate(followSent, totalLeads);

  return {
    totalLeads,
    coldSent,
    followSent,
    coldOpeners,
    followOpeners,
    clicked: uniqueClickers.size,
    replied,
    tryOnCount,
    tryOnTotal,
    tryOnStartedCount,
    tryOnStartedTotal,
    openRateCold,
    openRateFollow,
    clickRate,
    replyRate,
    tryOnRate,
    tryOnStartedRate,
    progressRate,
  };
}

function renderDashboard(leadsMap = cachedLeads) {
  const filteredLeads = getFilteredLeads(leadsMap);
  console.log(filteredLeads)
  const metrics = computeMetrics(filteredLeads);

  renderMetrics(metrics);
  renderAutomationStatus();
  renderActionButtonsState(filteredLeads);
  renderHotLeads(filteredLeads);
  const searchInput = document.getElementById("searchInput");
  renderSearchResults(filteredLeads, searchInput ? searchInput.value : "");
  renderRecentActions(filteredLeads);
}

function getFilteredLeads(leadsMap = cachedLeads) {
  if (currentCampaignFilter === "all") return leadsMap;
  const filtered = new Map();
  leadsMap.forEach((lead, email) => {
    if (lead.campanaId === currentCampaignFilter) {
      filtered.set(email, lead);
    }
  });
  return filtered;
}

function updateCampaignFilterOptions(leadsMap) {
  const select = document.getElementById("campaignFilter");
  if (!select) return;

  const campaignIds = Array.from(
    new Set(Array.from(leadsMap.values()).map((lead) => lead.campanaId))
  ).sort(campaignComparator);

  const previousSelection = currentCampaignFilter;
  select.innerHTML = "";

  const addOption = (value, label) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  };

  addOption("all", "Todas las campañas");
  console.log(campaignIds)
  campaignIds.forEach((id) => addOption(id, id));

  if (previousSelection !== "all" && !campaignIds.includes(previousSelection)) {
    currentCampaignFilter = "all";
  }
  select.value = currentCampaignFilter;
}

function campaignComparator(a, b) {
  if (a === b) return 0;
  if (a === "None") return -1;
  if (b === "None") return 1;
  const aNum = Number(a);
  const bNum = Number(b);
  const aIsNum = Number.isFinite(aNum);
  const bIsNum = Number.isFinite(bNum);
  if (aIsNum && bIsNum) return aNum - bNum;
  if (aIsNum) return -1;
  if (bIsNum) return 1;
  return String(a).localeCompare(String(b));
}

function renderMetrics(metrics) {
  setText("totalLeads", metrics.totalLeads);
  setText("totalCold", metrics.coldSent);
  setText("totalFollow", metrics.followSent);
  setText("coldOpens", metrics.coldOpeners);
  setText("followOpens", metrics.followOpeners);
  setText("clickers", metrics.clicked);
  setText("replies", metrics.replied);
  setText("tryOnCount", metrics.tryOnCount);
  setText("tryOnTotal", metrics.tryOnTotal);
  setText("tryOnStartedCount", metrics.tryOnStartedCount);
  setText("tryOnStartedTotal", metrics.tryOnStartedTotal);

  setText("openRateCold", formatPercent(metrics.openRateCold));
  setText("openRateFollow", formatPercent(metrics.openRateFollow));
  setText("clickRate", formatPercent(metrics.clickRate));
  setText("replyRate", formatPercent(metrics.replyRate));
  setText("tryOnRate", formatPercent(metrics.tryOnRate));
  setText("tryOnStartedRate", formatPercent(metrics.tryOnStartedRate));
  setText("progressRate", formatPercent(metrics.progressRate));
}


function renderHotLeads(leadsMap) {
  const tbody = document.getElementById("hotLeadsBody");
  tbody.innerHTML = "";
  const sorted = Array.from(leadsMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  if (!sorted.length) {
    tbody.innerHTML = `<tr><td colspan="4">Sin datos</td></tr>`;
    return;
  }

  sorted.forEach((lead) => {
    const tr = document.createElement("tr");
    tr.className = "clickable";
    tr.innerHTML = `
      <td>${lead.nombre}</td>
      <td class="highlight">${lead.email}</td>
      <td>${lead.score}</td>
      <td>${lead.ultimaAccion ? `${formatAction(lead.ultimaAccion.action_type)} - ${timeAgo(lead.ultimaAccion.timestamp)}` : "Sin acciones"}</td>
    `;
    tr.addEventListener("click", () => renderLeadByEmail(lead.email, leadsMap));
    tbody.appendChild(tr);
  });
}

function renderRecentActions(leadsMap) {
  const container = document.getElementById("recentActions");
  if (!container) return;
  container.innerHTML = "";

  const events = [];
  leadsMap.forEach((lead) => {
    lead.eventos.forEach((ev) => {
      events.push({
        email: lead.email,
        nombre: lead.nombre,
        action_type: ev.action_type,
        timestamp: ev.timestamp,
      });
    });
  });

  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const recent = events.slice(0, 20);

  if (!recent.length) {
    container.innerHTML = `<p class="muted-text">Sin acciones recientes</p>`;
    return;
  }

  recent.forEach((ev) => {
    const row = document.createElement("div");
    row.className = "recent-row clickable";
    row.innerHTML = `
      <div>
        <strong>${ev.nombre}</strong>
        <span class="muted-text">${ev.email}</span>
      </div>
      <div class="muted-text">${formatAction(ev.action_type)}</div>
      <div class="muted-text">${timeAgo(ev.timestamp)}</div>
      <button class="icon-button delete-action" title="Eliminar evento" aria-label="Eliminar evento">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="currentColor" d="M9 3h6a1 1 0 0 1 1 1v1h4v2h-1v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7H3V5h4V4a1 1 0 0 1 1-1Zm1 2v1h4V5h-4ZM6 7v12h12V7H6Zm4 2h2v8h-2V9Zm-4 0h2v8H6V9Z"/>
        </svg>
      </button>
    `;
    row.addEventListener("click", () => renderLeadByEmail(ev.email, leadsMap));
    const deleteBtn = row.querySelector(".delete-action");
    deleteBtn.addEventListener("click", (clickEv) => {
      clickEv.stopPropagation();
      onDeleteEvent(ev);
    });
    container.appendChild(row);
  });
}

function renderLeadByEmail(email, leadsMap = cachedLeads) {
  const lead = (leadsMap && leadsMap.get(email)) || cachedLeads.get(email);
  if (lead) renderLeadDetail(lead);
}

function renderSearchResults(leadsMap, query = "") {
  const container = document.getElementById("searchResults");
  container.innerHTML = "";
  const q = query.trim().toLowerCase();
  let matches = Array.from(leadsMap.values());
  if (q) {
    matches = matches.filter(
      (l) =>
        l.nombre.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
    );
  }
  matches.slice(0, 6).forEach((lead) => {
    const item = document.createElement("div");
    item.className = "result-item";
    item.innerHTML = `<strong>${lead.nombre}</strong><br><span class="muted-text">${lead.email}</span>`;
    item.addEventListener("click", () => renderLeadDetail(lead));
    container.appendChild(item);
  });
  if (q && matches.length === 0) {
    container.innerHTML = `<p class="muted-text">Sin resultados</p>`;
  }
}

function renderLeadDetail(lead) {
  setText("detailName", lead.nombre);
  setText("detailEmail", lead.email);
  setText("detailScore", lead.score);
  setText("detailStatus", lead.estado || "-");
  setText(
    "detailLastAction",
    lead.ultimaAccion
      ? `${formatAction(lead.ultimaAccion.action_type)} - ${timeAgo(lead.ultimaAccion.timestamp)}`
      : "Sin acciones"
  );
  const tryOnStarted = Number.isFinite(lead.tryOnStarted)
    ? lead.tryOnStarted
    : countEventsByAction(lead.eventos, "try-on-started");
  setText("detailTryOnStarted", tryOnStarted);
  setText("detailTryOn", Number.isFinite(lead.tryOn) ? lead.tryOn : "N/D");

  const pills = document.getElementById("detailCounts");
  pills.innerHTML = "";
  const pillData = [
    { label: "ID campana", value: lead.campanaId || "None" },
    { label: "Aperturas cold", value: lead.aperturasCold },
    { label: "Aperturas follow", value: lead.aperturasFollow },
    { label: "Aperturas link", value: lead.aperturasLink },
    { label: "Respuesta", value: lead.respuesta || "Ninguna" },
  ];
  pillData.forEach((p) => {
    const div = document.createElement("div");
    div.className = "pill";
    div.textContent = `${p.label}: ${p.value}`;
    pills.appendChild(div);
  });

  const timeline = document.getElementById("detailTimeline");
  timeline.innerHTML = "";
  if (!lead.eventos.length) {
    timeline.innerHTML = `<p class="muted-text">Sin eventos</p>`;
    return;
  }
  lead.eventos.forEach((ev) => {
    const row = document.createElement("div");
    row.className = "event";
    row.innerHTML = `
      <span class="action">${formatAction(ev.action_type)}</span>
      <span class="time">${timeAgo(ev.timestamp)}</span>
    `;
    timeline.appendChild(row);
  });
}

function onSearch(e) {
  renderSearchResults(getFilteredLeads(), e.target.value);
}

function setupFilters() {
  const select = document.getElementById("campaignFilter");
  if (!select) return;
  select.addEventListener("change", (e) => {
    currentCampaignFilter = e.target.value || "all";
    renderDashboard(cachedLeads);
  });
}

function setupControlButtons() {
  const emergencyBtn = document.getElementById("toggleStop");
  const launchFollowBtn = document.getElementById("launchFollow");
  const launchColdBtn = document.getElementById("launchCold");
  const launchConfirmBtn = document.getElementById("launchConfirm");
  const launchCancelBtn = document.getElementById("launchCancel");
  const launchSlider = document.getElementById("launchBatchSlider");

  if (emergencyBtn) {
    emergencyBtn.addEventListener("click", async () => {
      const nextValue = adminAction.toLowerCase() === "stop" ? "Listo" : "Stop";
      await setAdminAction(nextValue);
    });
  }
  if (launchFollowBtn) {
    launchFollowBtn.addEventListener("click", () => onLaunch("follow-up"));
  }
  if (launchColdBtn) {
    launchColdBtn.addEventListener("click", () => onLaunch("cold-approach"));
  }
  if (launchConfirmBtn) {
    launchConfirmBtn.addEventListener("click", () => confirmLaunch());
  }
  if (launchCancelBtn) {
    launchCancelBtn.addEventListener("click", () => closeLaunchModal());
  }
  if (launchSlider) {
    launchSlider.addEventListener("input", () => updateLaunchSliderLabel());
  }
}

function renderAutomationStatus() {
  const pill = document.getElementById("adminStatus");
  const textEl = document.getElementById("adminStatusText");
  const emergencyBtn = document.getElementById("toggleStop");
  const spinner = document.getElementById("adminSpinner");
  if (!pill || !textEl || !emergencyBtn) return;

  const state = (adminAction || "").trim().toLowerCase();
  pill.className = "status-pill";
  pill.classList.remove("status-stop", "status-running", "status-done");
  let label = "Accion: -";
  if (state === "stop") {
    pill.classList.add("status-stop");
    label = "Accion: Stop";
    emergencyBtn.textContent = "Reactivar";
  } else if (state === "corriendo") {
    pill.classList.add("status-running");
    label = "Accion: Corriendo";
    emergencyBtn.textContent = "Parada de emergencia";
  } else if (state === "acabado") {
    pill.classList.add("status-done");
    label = "Accion: Acabado";
    emergencyBtn.textContent = "Parada de emergencia";
  } else {
    pill.classList.add("status-done");
    label = "Accion: " + (state || "-");
    emergencyBtn.textContent = "Parada de emergencia";
  }

  textEl.textContent = label;
  if (spinner) {
    spinner.style.display = state === "corriendo" ? "inline-block" : "none";
  }
}

function renderActionButtonsState(leadsMap) {
  const emergencyBtn = document.getElementById("toggleStop");
  const launchFollowBtn = document.getElementById("launchFollow");
  const launchColdBtn = document.getElementById("launchCold");
  const stopActive = (adminAction || "").trim().toLowerCase() === "stop";
  const hasCampaign = currentCampaignFilter !== "all";

  if (emergencyBtn) {
    emergencyBtn.disabled = false;
  }

  if (!launchFollowBtn || !launchColdBtn) return;

  if (!hasCampaign || stopActive) {
    launchFollowBtn.disabled = true;
    launchColdBtn.disabled = true;
    return;
  }

  const leads = Array.from(leadsMap.values());
  const followCandidates = leads.filter(
    (l) => isColdEstado(l.estado) && !!l.email && isNoResponse(l.respuesta)
  );
  const coldCandidates = leads.filter(
    (l) => normalizeEstado(l.estado) === "no contactado" && !!l.email
  );

  launchFollowBtn.disabled = followCandidates.length === 0;
  launchColdBtn.disabled = coldCandidates.length === 0;

  launchFollowBtn.textContent = followCandidates.length
    ? `Lanzar follow-ups (${followCandidates.length})`
    : "Lanzar follow-ups";
  launchColdBtn.textContent = coldCandidates.length
    ? `Lanzar colds (${coldCandidates.length})`
    : "Lanzar colds";
}

async function setAdminAction(nextValue) {
  if (!SHEETS_HOOK_URL) {
    window.alert("No hay hook configurado para actualizar la accion ADMIN.");
    return;
  }
  setSyncStatus("Actualizando accion ADMIN...");
  try {
    await postToSheetsHook({ adminAction: nextValue });
    adminAction = nextValue;
    renderAutomationStatus();
    renderActionButtonsState(getFilteredLeads());
    setSyncStatus(`Actualizado ${new Date().toLocaleTimeString()}`);
    loadAllData();
  } catch (err) {
    console.error("Error actualizando ADMIN", err);
    setSyncStatus("Error al actualizar ADMIN");
    window.alert(`No se pudo actualizar la accion ADMIN: ${err.message || err}`);
  }
}

async function onLaunch(type) {
  const stopActive = (adminAction || "").trim().toLowerCase() === "stop";
  if (stopActive) return;
  const hasCampaign = currentCampaignFilter !== "all";
  if (!hasCampaign) return;

  const leads = Array.from(getFilteredLeads().values());
  const followCandidates = leads
    .filter(
      (l) => isColdEstado(l.estado) && !!l.email && isNoResponse(l.respuesta)
    )
    .map((l) => ({ email: l.email, nombre: l.nombre }));
  const coldCandidates = leads
    .filter((l) => normalizeEstado(l.estado) === "no contactado" && !!l.email)
    .map((l) => ({ email: l.email, nombre: l.nombre }));

  const payload =
    type === "follow-up" ? followCandidates : coldCandidates;
  if (!payload.length) return;

  currentLaunchContext = {
    type,
    maxBatch: payload.length,
  };
  openLaunchModal(type, payload.length);
}

function openLaunchModal(type, maxBatch) {
  const modal = document.getElementById("launchModal");
  const title = document.getElementById("launchModalTitle");
  const slider = document.getElementById("launchBatchSlider");
  const spinner = document.getElementById("launchModalSpinner");
  if (!modal || !slider) return;
  slider.min = 1;
  slider.max = Math.max(1, maxBatch);
  slider.value = maxBatch;
  updateLaunchSliderLabel();
  if (title) {
    title.textContent = type === "follow" ? "Lanzar follow-ups" : "Lanzar colds";
  }
  if (spinner) spinner.style.display = "none";
  modal.style.display = "flex";
}

function closeLaunchModal() {
  const modal = document.getElementById("launchModal");
  const confirmBtn = document.getElementById("launchConfirm");
  const cancelBtn = document.getElementById("launchCancel");
  const spinner = document.getElementById("launchModalSpinner");
  if (modal) modal.style.display = "none";
  if (confirmBtn) confirmBtn.disabled = false;
  if (cancelBtn) cancelBtn.disabled = false;
  if (spinner) spinner.style.display = "none";
  currentLaunchContext = null;
}

function updateLaunchSliderLabel() {
  const slider = document.getElementById("launchBatchSlider");
  const label = document.getElementById("launchBatchLabel");
  if (!slider || !label) return;
  label.textContent = `Batch size: ${slider.value}`;
}

async function confirmLaunch() {
  if (!currentLaunchContext) return;
  const slider = document.getElementById("launchBatchSlider");
  const spinner = document.getElementById("launchModalSpinner");
  const confirmBtn = document.getElementById("launchConfirm");
  const cancelBtn = document.getElementById("launchCancel");
  const batchsize = slider ? Number(slider.value) || 1 : 1;
  if (confirmBtn) confirmBtn.disabled = true;
  if (cancelBtn) cancelBtn.disabled = true;
  if (spinner) spinner.style.display = "inline-block";
  setSyncStatus("Enviando instruccion...");
  try {
    await postToLaunchWebhook(currentLaunchContext.type, {
      campaignId: currentCampaignFilter,
      batchsize,
    });
    setSyncStatus(`Actualizado ${new Date().toLocaleTimeString()}`);
    closeLaunchModal();
    renderActionButtonsState(getFilteredLeads());
    loadAllData();
  } catch (err) {
    console.error("Error lanzando accion", err);
    setSyncStatus("Error al lanzar accion");
    window.alert("No se pudo lanzar la accion.");
    if (confirmBtn) confirmBtn.disabled = false;
    if (cancelBtn) cancelBtn.disabled = false;
    if (spinner) spinner.style.display = "none";
  }
}

async function onDeleteEvent(evData) {
  const confirmed = window.confirm(
    `Eliminar el evento "${formatAction(evData.action_type)}" de ${evData.email}?`
  );
  if (!confirmed) return;

  setSyncStatus("Eliminando evento...");
  try {
    await removeEventFromJsonBin(evData);
    await decrementSheetMetric(evData);
    applyLocalDeletion(evData);
    computeLeadScores(cachedLeads);
    renderDashboard(cachedLeads);
    setSyncStatus(`Actualizado ${new Date().toLocaleTimeString()}`);
  } catch (err) {
    console.error("Error eliminando evento", err);
    setSyncStatus("Error al eliminar evento");
  }
}

async function removeEventFromJsonBin(evData) {
  if (!JSONBIN_ID || JSONBIN_ID === "RELLENAR") {
    console.warn("JSONBIN_ID no configurado; no se puede eliminar evento.");
    return;
  }
  const { events, record } = await getJsonBinSnapshot();
  const filteredEvents = events.filter(
    (ev) =>
      !(
        ev.email === evData.email &&
        ev.action_type === evData.action_type &&
        ev.timestamp === evData.timestamp
      )
  );

  const putUrl = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}`;
  const bodyPayload = Array.isArray(record?.events)
    ? { ...record, events: filteredEvents }
    : filteredEvents;

  const res = await fetch(putUrl, {
    method: "PUT",
    headers: {
      "X-Master-Key": JSONBIN_KEY || "",
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(bodyPayload),
  });
  if (!res.ok) {
    throw new Error("No se pudo actualizar JSONBin");
  }
}

async function getJsonBinSnapshot() {
  const url = `https://api.jsonbin.io/v3/b/${JSONBIN_ID}/latest`;
  const res = await fetch(url, {
    headers: {
      "X-Master-Key": JSONBIN_KEY || "",
      "Content-Type": "text/plain;charset=utf-8",
    },
  });
  if (!res.ok) {
    throw new Error("No se pudo leer JSONBin");
  }
  const json = await res.json();
  const record = json.record || json;
  if (Array.isArray(record)) {
    return { events: record, record };
  }
  if (Array.isArray(record.events)) {
    return { events: record.events, record };
  }
  return { events: [], record };
}

async function decrementSheetMetric(evData) {
  if (!SHEETS_HOOK_URL) {
    console.warn("SHEETS_HOOK_URL no configurado; omitiendo update en Sheets.");
    return;
  }
  // Solo decrementar acciones que impactan contadores en Sheet
  const allowed = ["open-followup", "open-cold", "link-click"];
  if (!allowed.includes(evData.action_type)) return;

  await postToSheetsHook({
    email: evData.email,
    action_type: evData.action_type,
    delta: -1,
    timestamp: evData.timestamp,
  });
}

function applyLocalDeletion(evData) {
  const lead = cachedLeads.get(evData.email);
  if (!lead) return;
  lead.eventos = lead.eventos.filter(
    (ev) =>
      !(
        ev.email === evData.email &&
        ev.action_type === evData.action_type &&
        ev.timestamp === evData.timestamp
      )
  );
  if (evData.action_type === "open-followup" && lead.aperturasFollow > 0) {
    lead.aperturasFollow -= 1;
  }
  if (evData.action_type === "open-cold" && lead.aperturasCold > 0) {
    lead.aperturasCold -= 1;
  }
  if (evData.action_type === "link-click" && lead.aperturasLink > 0) {
    lead.aperturasLink -= 1;
  }
  lead.eventos.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  lead.ultimaAccion = lead.eventos[0] || null;
}

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function normalizeCampaignId(campaignId) {
  const raw = (campaignId || "").toString().trim();
  if (!raw) return "None";
  if (raw.toLowerCase() === "none") return "None";
  return raw;
}

function normalizeActionType(action) {
  const a = (action || "").trim().toLowerCase();
  if (!a) return "";
  if (a === "follow-up" || a === "followup" || a === "open-followup" || a === "open follow-up") return "open-followup";
  if (a === "cold approach") return "cold-approach";
  if (a === "try-on-started" || a === "try on started" || a === "try-on start" || a === "try on start") return "try-on-started";
  if (a === "try on") return "try-on";
  return a;
}

function normalizeEstado(estado) {
  return (estado || "").trim().toLowerCase();
}

function isFollowUpEstado(estado) {
  const e = normalizeEstado(estado);
  return e.includes("follow-up enviado") || e.includes("follow up enviado");
}

function isColdEstado(estado) {
  const e = normalizeEstado(estado);
  return e.includes("cold-approach enviado") || e.includes("cold approach enviado");
}

function estadoWeight(estado) {
  if (isFollowUpEstado(estado)) return 2;
  if (isColdEstado(estado)) return 1;
  return 0;
}

function mergeLeadRecords(current, incoming) {
  const pickedEstado =
    estadoWeight(incoming.estado) > estadoWeight(current.estado)
      ? incoming.estado
      : current.estado;

  return {
    nombre: current.nombre || incoming.nombre,
    email: current.email,
    estado: pickedEstado || incoming.estado || current.estado,
    campanaId: current.campanaId || incoming.campanaId || "None",
    aperturasCold: current.aperturasCold + incoming.aperturasCold,
    aperturasFollow: current.aperturasFollow + incoming.aperturasFollow,
    aperturasLink: current.aperturasLink + incoming.aperturasLink,
    respuesta: current.respuesta || incoming.respuesta,
    tryOn: current.tryOn + incoming.tryOn,
    tryOnStarted: current.tryOnStarted + incoming.tryOnStarted,
    eventos: current.eventos,
    score: 0,
    ultimaAccion: null,
  };
}

function toInt(val) {
  const n = parseInt(val, 10);
  return Number.isFinite(n) ? n : 0;
}

function rate(part, total) {
  if (!total) return 0;
  return part / total;
}

function formatPercent(v) {
  return `${(v * 100).toFixed(1)}%`;
}

async function postToSheetsHook(payload) {
  const res = await fetch(SHEETS_HOOK_URL, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify(payload),
  });

  // En modo no-cors la respuesta es opaca; lo tratamos como best-effort.
  if (res.type === "opaque") {
    return { ok: true, opaque: true };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Hook HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  let data = {};
  try {
    data = await res.json();
  } catch (err) {
    data = {};
  }
  if (data && data.ok === false) {
    throw new Error(data.msg || "Hook respondio con error");
  }
  return data || {};
}

async function postToLaunchWebhook(type, payload) {
  let action = "api/launch/"
  console.log(SERVER_URL+action+type)
  const res = await fetch(SERVER_URL+action+type, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type,
      ...payload,
    }),
  });

  // Si el servidor bloquea CORS, la respuesta será opaca; lo consideramos best-effort.
  if (res.type === "opaque") return { ok: true, opaque: true };

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Launch HTTP ${res.status} ${res.statusText}: ${text}`);
  }

  let data = {};
  try {
    data = await res.json();
  } catch (err) {
    data = {};
  }
  if (data && data.ok === false) {
    throw new Error(data.msg || "Webhook respondio con error");
  }
  return data || {};
}

function countEventsByAction(events = [], actionType) {
  return (events || []).reduce(
    (acc, ev) => acc + (ev.action_type === actionType ? 1 : 0),
    0
  );
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function formatAction(action) {
  return actionLabels[action] || action;
}

function isYes(val) {
  const txt = (val || "").trim().toLowerCase();
  if (!txt) return false;
  const plain = txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return plain === "si" || plain === "sí" || plain === "si.";
}

function isNoResponse(val) {
  const txt = (val || "").trim().toLowerCase();
  if (!txt) return false;
  const plain = txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return plain === "no" || plain === "no." || plain === "ninguna";
}

function timeAgo(dateInput) {
  const ts = new Date(dateInput).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function setSyncStatus(msg) {
  setText("lastUpdated", msg);
  const dot = document.getElementById("liveDot");
  if (dot) {
    dot.style.opacity = msg.includes("Error") ? "0.4" : "1";
    dot.style.background = msg.includes("Error") ? "#ff6b6b" : "var(--accent)";
  }
}
