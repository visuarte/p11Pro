const APP_STATE = {
    currentProjectId: null,
    currentFileId: null,
    currentFiles: [],
    currentProjectDetail: null,
    dependencyCatalog: [],
    hubProjects: [],
    hubMilestoneFilter: "all",
    hubCategoryGroupBy: "estado",
    hubCategoryFilter: "all",
    hubSearchQuery: "",
    apiBaseUrl: null,
    isBusy: false,
    baselineFileContent: "",
    lastInstruction: "",
    hasPendingProposal: false,
    toastQueue: [],
    activeToastCount: 0,
    toastMaxVisible: 3,
    isToastDraining: false,
    lastDiscardedProposal: null,
};

const STORAGE_KEYS = {
    aiInstructionDraft: "cineops:aiInstructionDraft",
    preferredApiBase: "cineops:apiBaseUrl",
    hubPreferences: "cineops:hubPreferences",
    reportPreferences: "cineops:reportPreferences",
};

const ICON_SPRITE_URL = "/assets/icons.svg";
const ICON_ID_SET = new Set([
    "icon-vscode", "icon-trash", "icon-open-editor", "icon-sync", "icon-check-circle", "icon-alert",
    "icon-error", "icon-info", "icon-folder", "icon-file", "icon-notes", "icon-code", "icon-ai", "icon-hub",
    "icon-milestone", "icon-copy", "icon-download", "icon-refresh", "icon-close", "icon-menu", "icon-home",
    "icon-settings", "icon-user", "icon-search", "icon-plus", "icon-edit", "icon-external-link",
]);

const DOM = {
    initForm: null,
    projectName: null,
    clientName: null,
    taskName: null,
    projectProfile: null,
    creativeEngine: null,
    creativeRuntime: null,
    useThreeJsInterop: null,
    enableTailwindDirectives: null,
    projectDescription: null,
    projectTags: null,
    projectPreview: null,
    domainFunctionalRequirements: null,
    domainUseCases: null,
    domainDataModel: null,
    domainRequiredApis: null,
    uiPreset: null,
    uiToolingCsv: null,
    enableA11yChecks: null,
    enableVisualRegression: null,
    dependencyCatalog: null,
    addMilestoneBtn: null,
    milestoneList: null,
    resultDiv: null,
    btnText: null,
    editorSection: null,
    projectMetaTitle: null,
    projectMetaBadges: null,
    projectMetaDescription: null,
    projectMetaTimeline: null,
    aiInstruction: null,
    codeProposal: null,
    projectsHub: null,
    hubMilestoneDashboard: null,
    hubMilestoneFilter: null,
    hubCategoryGroupBy: null,
    hubCategoryFilter: null,
    hubSearchInput: null,
    hubResumen: null,
    refreshHubBtn: null,
    motorStatusText: null,
    refreshMotorStatusBtn: null,
    generateDailyReportBtn: null,
    generateWeeklyReportBtn: null,
    generateBothReportsBtn: null,
    reportResponsableInput: null,
    reportDateInput: null,
    reportWeekInput: null,
    discardProposalBtn: null,
    regenerateProposalBtn: null,
    toastViewport: null,
    toastStackCounter: null,
    modalOverlay: null,
    modalPanel: null,
    modalBadge: null,
    modalIcon: null,
    modalTitle: null,
    modalMessage: null,
    modalCancelBtn: null,
    modalConfirmBtn: null,
    fileSearchInput: null,
};

let modalResolver = null;
let modalHideTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    cacheDom();
    bindEvents();
    restoreDraftInstruction();
    restoreHubPreferences();
    restoreReportPreferences();
    createEditorEnhancements();
    showBootInfo();
    loadDependencyCatalog();
    updateProfileUiState();
    addMilestoneRow({ title: "Entrega final", type: "go-live", status: "planned" });
    loadProjectsHub();
    refreshMotorStatus();
});

function cacheDom() {
    DOM.initForm = document.getElementById("initProjectForm");
    DOM.projectName = document.getElementById("projectName");
    DOM.clientName = document.getElementById("clientName");
    DOM.taskName = document.getElementById("taskName");
    DOM.projectProfile = document.getElementById("projectProfile");
    DOM.creativeEngine = document.getElementById("creativeEngine");
    DOM.creativeRuntime = document.getElementById("creativeRuntime");
    DOM.useThreeJsInterop = document.getElementById("useThreeJsInterop");
    DOM.enableTailwindDirectives = document.getElementById("enableTailwindDirectives");
    DOM.projectDescription = document.getElementById("projectDescription");
    DOM.projectTags = document.getElementById("projectTags");
    DOM.projectPreview = document.getElementById("projectPreview");
    DOM.domainFunctionalRequirements = document.getElementById("domainFunctionalRequirements");
    DOM.domainUseCases = document.getElementById("domainUseCases");
    DOM.domainDataModel = document.getElementById("domainDataModel");
    DOM.domainRequiredApis = document.getElementById("domainRequiredApis");
    DOM.uiPreset = document.getElementById("uiPreset");
    DOM.uiToolingCsv = document.getElementById("uiToolingCsv");
    DOM.enableA11yChecks = document.getElementById("enableA11yChecks");
    DOM.enableVisualRegression = document.getElementById("enableVisualRegression");
    DOM.dependencyCatalog = document.getElementById("dependencyCatalog");
    DOM.addMilestoneBtn = document.getElementById("addMilestoneBtn");
    DOM.milestoneList = document.getElementById("milestoneList");
    DOM.resultDiv = document.getElementById("resultado");
    DOM.btnText = document.getElementById("btnText");
    DOM.editorSection = document.getElementById("editorSeccion");
    DOM.projectMetaTitle = document.getElementById("projectMetaTitle");
    DOM.projectMetaBadges = document.getElementById("projectMetaBadges");
    DOM.projectMetaDescription = document.getElementById("projectMetaDescription");
    DOM.projectMetaTimeline = document.getElementById("projectMetaTimeline");
    DOM.aiInstruction = document.getElementById("aiInstruction");
    DOM.codeProposal = document.getElementById("codeProposal");
    DOM.projectsHub = document.getElementById("projectsHub");
    DOM.hubMilestoneDashboard = document.getElementById("hubMilestoneDashboard");
    DOM.hubMilestoneFilter = document.getElementById("hubMilestoneFilter");
    DOM.hubCategoryGroupBy = document.getElementById("hubCategoryGroupBy");
    DOM.hubCategoryFilter = document.getElementById("hubCategoryFilter");
    DOM.hubSearchInput = document.getElementById("hubSearchInput");
    DOM.hubResumen = document.getElementById("hubResumen");
    DOM.refreshHubBtn = document.getElementById("refreshHubBtn");
    DOM.motorStatusText = document.getElementById("motorStatusText");
    DOM.refreshMotorStatusBtn = document.getElementById("refreshMotorStatusBtn");
    DOM.generateDailyReportBtn = document.getElementById("generateDailyReportBtn");
    DOM.generateWeeklyReportBtn = document.getElementById("generateWeeklyReportBtn");
    DOM.generateBothReportsBtn = document.getElementById("generateBothReportsBtn");
    DOM.reportResponsableInput = document.getElementById("reportResponsableInput");
    DOM.reportDateInput = document.getElementById("reportDateInput");
    DOM.reportWeekInput = document.getElementById("reportWeekInput");
    DOM.discardProposalBtn = document.getElementById("discardProposalBtn");
    DOM.regenerateProposalBtn = document.getElementById("regenerateProposalBtn");
    DOM.toastViewport = document.getElementById("toastViewport");
    DOM.toastStackCounter = document.getElementById("toastStackCounter");
    DOM.modalOverlay = document.getElementById("modalOverlay");
    DOM.modalPanel = document.getElementById("modalPanel");
    DOM.modalBadge = document.getElementById("modalBadge");
    DOM.modalIcon = document.getElementById("modalIcon");
    DOM.modalTitle = document.getElementById("modalTitle");
    DOM.modalMessage = document.getElementById("modalMessage");
    DOM.modalCancelBtn = document.getElementById("modalCancelBtn");
    DOM.modalConfirmBtn = document.getElementById("modalConfirmBtn");
}

function bindEvents() {
    DOM.initForm.addEventListener("submit", handleInitProjectSubmit);
    DOM.projectProfile?.addEventListener("change", updateProfileUiState);
    DOM.creativeEngine?.addEventListener("change", updateProfileUiState);
    DOM.aiInstruction.addEventListener("input", persistDraftInstruction);
    DOM.aiInstruction.addEventListener("keydown", onInstructionKeyDown);
    DOM.refreshHubBtn?.addEventListener("click", loadProjectsHub);
    DOM.refreshMotorStatusBtn?.addEventListener("click", refreshMotorStatus);
    DOM.generateDailyReportBtn?.addEventListener("click", () => generateOperationalReport("diario"));
    DOM.generateWeeklyReportBtn?.addEventListener("click", () => generateOperationalReport("semanal"));
    DOM.generateBothReportsBtn?.addEventListener("click", () => generateOperationalReport("ambos"));
    DOM.reportResponsableInput?.addEventListener("input", persistReportPreferences);
    DOM.reportDateInput?.addEventListener("change", persistReportPreferences);
    DOM.reportWeekInput?.addEventListener("input", persistReportPreferences);
    DOM.hubMilestoneFilter?.addEventListener("change", () => {
        APP_STATE.hubMilestoneFilter = DOM.hubMilestoneFilter.value || "all";
        updateHubCategoryFilterOptions(APP_STATE.hubProjects);
        persistHubPreferences();
        renderHub(APP_STATE.hubProjects);
    });
    DOM.hubCategoryGroupBy?.addEventListener("change", () => {
        APP_STATE.hubCategoryGroupBy = DOM.hubCategoryGroupBy.value || "estado";
        APP_STATE.hubCategoryFilter = "all";
        updateHubCategoryFilterOptions(APP_STATE.hubProjects);
        persistHubPreferences();
        renderHub(APP_STATE.hubProjects);
    });
    DOM.hubCategoryFilter?.addEventListener("change", () => {
        APP_STATE.hubCategoryFilter = DOM.hubCategoryFilter.value || "all";
        persistHubPreferences();
        renderHub(APP_STATE.hubProjects);
    });
    DOM.hubSearchInput?.addEventListener("input", () => {
        APP_STATE.hubSearchQuery = DOM.hubSearchInput.value.trim().toLowerCase();
        persistHubPreferences();
        renderHub(APP_STATE.hubProjects);
    });
    DOM.addMilestoneBtn?.addEventListener("click", () => addMilestoneRow());
    DOM.modalCancelBtn?.addEventListener("click", () => closeConfirmModal(false));
    DOM.modalConfirmBtn?.addEventListener("click", () => closeConfirmModal(true));
    DOM.modalOverlay?.addEventListener("click", (event) => {
        if (event.target === DOM.modalOverlay) closeConfirmModal(false);
    });
    document.addEventListener("keydown", onGlobalKeyDown);
}

function updateProfileUiState() {
    const profile = DOM.projectProfile?.value || "static";
    const needsBusinessContext = profile === "static" || profile === "angular";
    if (DOM.clientName) DOM.clientName.required = needsBusinessContext;
    if (DOM.taskName) DOM.taskName.required = needsBusinessContext;

    const isCreative = profile === "creative-coding";
    if (DOM.creativeEngine) DOM.creativeEngine.disabled = !isCreative;
    if (DOM.creativeRuntime) DOM.creativeRuntime.disabled = !isCreative;
    if (DOM.creativeEngine && !isCreative) DOM.creativeEngine.value = "processing";
    if (DOM.creativeRuntime && !isCreative) DOM.creativeRuntime.value = "java17";

    const selectedEngine = DOM.creativeEngine?.value || "processing";
    if (isCreative && DOM.creativeRuntime) {
        DOM.creativeRuntime.value = selectedEngine === "py5" ? "python3.11" : "java17";
    }
}

function onInstructionKeyDown(event) {
    if (event.metaKey && event.key === "Enter") {
        event.preventDefault();
        iterarArchivo();
    }
}

function onGlobalKeyDown(event) {
    if (event.key === "Escape" && DOM.modalOverlay && !DOM.modalOverlay.classList.contains("hidden")) {
        event.preventDefault();
        closeConfirmModal(false);
        return;
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        confirmarCambio();
    }
}

function persistDraftInstruction() {
    localStorage.setItem(STORAGE_KEYS.aiInstructionDraft, DOM.aiInstruction.value);
    syncProposalActions();
}

function restoreDraftInstruction() {
    const draft = localStorage.getItem(STORAGE_KEYS.aiInstructionDraft);
    if (draft) DOM.aiInstruction.value = draft;
}

function persistHubPreferences() {
    const payload = {
        hubMilestoneFilter: APP_STATE.hubMilestoneFilter || "all",
        hubCategoryGroupBy: APP_STATE.hubCategoryGroupBy || "estado",
        hubCategoryFilter: APP_STATE.hubCategoryFilter || "all",
        hubSearchQuery: String(APP_STATE.hubSearchQuery || "").slice(0, 120),
    };
    try {
        localStorage.setItem(STORAGE_KEYS.hubPreferences, JSON.stringify(payload));
    } catch (_error) {
        // Si localStorage falla, seguimos con estado en memoria.
    }
}

function restoreHubPreferences() {
    const validMilestoneFilters = new Set(["all", "planned", "on-track", "delayed", "completed"]);
    const validGroupBy = new Set(["estado", "cliente", "tarea", "riesgo-hitos"]);

    let raw = null;
    try {
        raw = localStorage.getItem(STORAGE_KEYS.hubPreferences);
    } catch (_error) {
        return;
    }
    if (!raw) return;

    try {
        const parsed = JSON.parse(raw) || {};
        const milestone = String(parsed.hubMilestoneFilter || "all");
        const groupBy = String(parsed.hubCategoryGroupBy || "estado");
        const category = String(parsed.hubCategoryFilter || "all");
        const query = String(parsed.hubSearchQuery || "").slice(0, 120).toLowerCase();

        APP_STATE.hubMilestoneFilter = validMilestoneFilters.has(milestone) ? milestone : "all";
        APP_STATE.hubCategoryGroupBy = validGroupBy.has(groupBy) ? groupBy : "estado";
        APP_STATE.hubCategoryFilter = category || "all";
        APP_STATE.hubSearchQuery = query;

        if (DOM.hubMilestoneFilter) DOM.hubMilestoneFilter.value = APP_STATE.hubMilestoneFilter;
        if (DOM.hubCategoryGroupBy) DOM.hubCategoryGroupBy.value = APP_STATE.hubCategoryGroupBy;
        if (DOM.hubSearchInput) DOM.hubSearchInput.value = APP_STATE.hubSearchQuery;
    } catch (_error) {
        try {
            localStorage.removeItem(STORAGE_KEYS.hubPreferences);
        } catch (_innerError) {
            // Ignoramos error de limpieza; usamos defaults en memoria.
        }
    }
}

function showBootInfo() {
    renderResult("Listo para crear proyecto. Si el API no responde, revisa Docker y puertos.", "info");
}

function isoWeekLabelFromDate(dateValue) {
    const date = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(date.getTime())) return "";

    const day = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - day + 3);
    const firstThursday = new Date(date.getFullYear(), 0, 4);
    const firstThursdayDay = (firstThursday.getDay() + 6) % 7;
    firstThursday.setDate(firstThursday.getDate() - firstThursdayDay + 3);
    const weekNumber = 1 + Math.round((date - firstThursday) / 604800000);
    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
}

function todayIsoDate() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function persistReportPreferences() {
    const payload = {
        responsable: String(DOM.reportResponsableInput?.value || "").slice(0, 80),
        date: String(DOM.reportDateInput?.value || "").trim(),
        week: String(DOM.reportWeekInput?.value || "").trim().toUpperCase(),
    };
    try {
        localStorage.setItem(STORAGE_KEYS.reportPreferences, JSON.stringify(payload));
    } catch (_error) {
        // Fallback sin persistencia; la UI sigue operativa.
    }
}

function restoreReportPreferences() {
    const fallbackDate = todayIsoDate();
    const fallbackWeek = isoWeekLabelFromDate(fallbackDate);

    let raw = null;
    try {
        raw = localStorage.getItem(STORAGE_KEYS.reportPreferences);
    } catch (_error) {
        raw = null;
    }

    let parsed = {};
    if (raw) {
        try {
            parsed = JSON.parse(raw) || {};
        } catch (_error) {
            try {
                localStorage.removeItem(STORAGE_KEYS.reportPreferences);
            } catch (_innerError) {
                // Ignoramos fallo de limpieza.
            }
            parsed = {};
        }
    }

    const responsable = String(parsed.responsable || "").slice(0, 80);
    const dateCandidate = String(parsed.date || "").trim();
    const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(dateCandidate);
    const dateValue = dateValid ? dateCandidate : fallbackDate;

    const weekCandidate = String(parsed.week || "").trim().toUpperCase();
    const weekValid = /^\d{4}-W\d{2}$/.test(weekCandidate);
    const weekValue = weekValid ? weekCandidate : isoWeekLabelFromDate(dateValue);

    if (DOM.reportResponsableInput) DOM.reportResponsableInput.value = responsable;
    if (DOM.reportDateInput) DOM.reportDateInput.value = dateValue;
    if (DOM.reportWeekInput) DOM.reportWeekInput.value = weekValue;

    persistReportPreferences();
}

function buildReportPayload(tipo) {
    const payload = { tipo };
    const responsable = DOM.reportResponsableInput?.value?.trim();
    const date = DOM.reportDateInput?.value?.trim();
    const week = DOM.reportWeekInput?.value?.trim();

    if (responsable) payload.responsable = responsable;
    if (date) payload.date = date;
    if (week) payload.week = week.toUpperCase();
    return payload;
}

function setReportButtonsDisabled(disabled) {
    [DOM.generateDailyReportBtn, DOM.generateWeeklyReportBtn, DOM.generateBothReportsBtn].forEach((btn) => {
        if (!btn) return;
        btn.disabled = disabled;
        btn.classList.toggle("opacity-60", disabled);
        btn.classList.toggle("cursor-not-allowed", disabled);
    });
}

function setMotorStatusText(message, tone = "info") {
    if (!DOM.motorStatusText) return;
    DOM.motorStatusText.innerText = message;
    DOM.motorStatusText.classList.remove("text-gray-300", "text-emerald-300", "text-amber-300", "text-red-300");
    const colorByTone = {
        success: "text-emerald-300",
        warn: "text-amber-300",
        error: "text-red-300",
        info: "text-gray-300",
    };
    DOM.motorStatusText.classList.add(colorByTone[tone] || "text-gray-300");
}

async function refreshMotorStatus() {
    setMotorStatusText("Comprobando estado del motor...", "info");
    try {
        const base = await detectApiBaseUrl();
        const response = await fetch(`${base}/status`, { method: "GET" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const text = (await response.text()).trim() || "ONLINE";
        const now = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setMotorStatusText(`${text} · actualizado ${now}`, "success");
    } catch (error) {
        setMotorStatusText(`Motor no disponible (${error.message})`, "error");
    }
}

async function generateOperationalReport(tipo) {
    setReportButtonsDisabled(true);
    try {
        const tipos = tipo === "ambos" ? ["diario", "semanal"] : [tipo];
        const generated = [];

        for (const item of tipos) {
            const data = await apiRequest("/api/v1/projects/reports/generate", {
                method: "POST",
                body: JSON.stringify(buildReportPayload(item)),
            });
            if (data?.status !== "SUCCESS") {
                throw new Error(data?.error || `No se pudo generar reporte ${item}`);
            }
            generated.push(data.payload || {});
        }

        const names = generated.map((p) => p.fileName || "reporte.md");
        const mainPath = generated[0]?.filePath || "docs/reportes_generados";
        renderResult(`Reporte(s) generado(s): ${names.join(", ")}`, "success");
        showToast({
            type: "success",
            title: "Reporte generado",
            message: `${names.join(", ")} (${mainPath})`,
            actions: [
                {
                    label: "Copiar ruta",
                    variant: "ghost",
                    onClick: async () => {
                        if (navigator.clipboard?.writeText) {
                            await navigator.clipboard.writeText(mainPath);
                        }
                    },
                },
            ],
        });
    } catch (error) {
        renderResult(`No se pudo generar reporte: ${error.message}`, "error");
        showToast({
            type: "error",
            title: "Error al generar reporte",
            message: error.message,
            duration: 5000,
        });
    } finally {
        setReportButtonsDisabled(false);
    }
}

function setBusyState(isBusy, labelWhenBusy = "Procesando...") {
    APP_STATE.isBusy = isBusy;
    DOM.initForm.querySelector("button[type='submit']").disabled = isBusy;
    DOM.btnText.innerText = isBusy ? labelWhenBusy : "Construir Base del Proyecto";
}

function renderResult(message, type = "success") {
    DOM.resultDiv.classList.remove("hidden", "text-red-400", "text-green-400", "text-yellow-300", "text-blue-300");
    const colorByType = {
        success: "text-green-400",
        error: "text-red-400",
        info: "text-blue-300",
        warn: "text-yellow-300",
    };
    DOM.resultDiv.classList.add(colorByType[type] || "text-green-400");
    DOM.resultDiv.innerText = message;
}

function renderProposal(message, loading = false) {
    DOM.codeProposal.classList.toggle("animate-pulse", loading);
    DOM.codeProposal.innerText = message;
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizeIconId(iconId) {
    const raw = String(iconId || "").trim().toLowerCase();
    if (!raw) return "icon-alert";

    let base = raw;
    if (base.startsWith("icon-")) {
        base = base.slice(5);
    } else if (base.endsWith("-icon")) {
        base = base.slice(0, -5);
    }

    base = base.replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    return base ? `icon-${base}` : "icon-alert";
}

function renderSpriteIcon(iconId, size = 16, extraClass = "") {
    const css = extraClass ? ` class="${extraClass}"` : "";
    const normalizedId = normalizeIconId(iconId);
    const resolvedId = ICON_ID_SET.has(normalizedId) ? normalizedId : "icon-alert";
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"${css} style="stroke: currentColor; fill: none;" aria-hidden="true" focusable="false"><use href="${ICON_SPRITE_URL}#${resolvedId}"></use></svg>`;
}

function showToast({ type = "info", title, message, duration = 3600, actions = [] }) {
    APP_STATE.toastQueue.push({ type, title, message, duration, actions });
    updateToastStackCounter();
    drainToastQueue();
}

function updateToastStackCounter() {
    if (!DOM.toastStackCounter) return;
    const queued = APP_STATE.toastQueue.length;
    if (queued > 0) {
        DOM.toastStackCounter.innerText = `En cola +${queued}`;
        DOM.toastStackCounter.classList.remove("hidden");
    } else {
        DOM.toastStackCounter.classList.add("hidden");
    }
}

function drainToastQueue() {
    if (!DOM.toastViewport || APP_STATE.isToastDraining) return;
    APP_STATE.isToastDraining = true;

    while (APP_STATE.activeToastCount < APP_STATE.toastMaxVisible && APP_STATE.toastQueue.length > 0) {
        renderToast(APP_STATE.toastQueue.shift());
    }

    APP_STATE.isToastDraining = false;
}

function renderToast({ type = "info", title, message, duration = 3600, actions = [] }) {
    if (!DOM.toastViewport) return;

    const palette = {
        success: {
            border: "border-emerald-500/40",
            badge: "bg-emerald-500/15 text-emerald-300",
            glow: "shadow-emerald-900/30",
            icon: "✅",
        },
        error: {
            border: "border-red-500/40",
            badge: "bg-red-500/15 text-red-300",
            glow: "shadow-red-900/30",
            icon: "⛔",
        },
        warn: {
            border: "border-amber-500/40",
            badge: "bg-amber-500/15 text-amber-300",
            glow: "shadow-amber-900/30",
            icon: "⚠️",
        },
        info: {
            border: "border-cyan-500/40",
            badge: "bg-cyan-500/15 text-cyan-300",
            glow: "shadow-cyan-900/30",
            icon: "ℹ️",
        },
    };

    const theme = palette[type] || palette.info;
    APP_STATE.activeToastCount += 1;

    const toast = document.createElement("div");
    toast.className = `pointer-events-auto overflow-hidden rounded-2xl border ${theme.border} ${theme.glow} bg-gray-900/95 shadow-2xl backdrop-blur translate-y-2 scale-[0.98] opacity-0 transition-all duration-300 ease-out`;
    toast.innerHTML = `
        <div class="flex items-start gap-3 p-4">
            <div class="mt-0.5 text-lg">${theme.icon}</div>
            <div class="min-w-0 flex-1">
                <div class="inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${theme.badge}">${escapeHtml(type)}</div>
                <p class="mt-2 text-sm font-semibold text-white">${escapeHtml(title || "Notificación")}</p>
                <p class="mt-1 text-sm leading-5 text-gray-300">${escapeHtml(message || "")}</p>
            </div>
            <button class="toast-close rounded-md p-1 text-gray-400 hover:bg-gray-800 hover:text-white transition-all" aria-label="Cerrar popup">✕</button>
        </div>
        <div class="toast-actions hidden border-t border-gray-800/70 px-4 py-2.5"></div>
    `;

    if (actions.length > 0) {
        const actionsBox = toast.querySelector(".toast-actions");
        if (actionsBox) {
            actionsBox.classList.remove("hidden");
            actions.forEach((action, idx) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = `mr-2 mb-1 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                    action.variant === "ghost"
                        ? "border border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800"
                        : "bg-cyan-700 text-white hover:bg-cyan-600"
                }`;
                button.innerText = action.label || `Accion ${idx + 1}`;
                button.addEventListener("click", () => {
                    try {
                        action.onClick?.();
                    } finally {
                        removeToast();
                    }
                });
                actionsBox.appendChild(button);
            });
        }
    }

    DOM.toastViewport.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove("translate-y-2", "scale-[0.98]", "opacity-0");
    });

    let removed = false;
    const removeToast = () => {
        if (removed) return;
        removed = true;
        toast.classList.add("-translate-y-2", "scale-[0.98]", "opacity-0");
        window.setTimeout(() => {
            toast.remove();
            APP_STATE.activeToastCount = Math.max(0, APP_STATE.activeToastCount - 1);
            updateToastStackCounter();
            drainToastQueue();
        }, 250);
    };

    toast.querySelector(".toast-close")?.addEventListener("click", removeToast);
    if (duration > 0) window.setTimeout(removeToast, duration);
}

function openConfirmModal({
    badge = "Confirmación",
    title = "Continuar",
    message = "¿Deseas continuar?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    tone = "primary",
} = {}) {
    if (!DOM.modalOverlay) return Promise.resolve(window.confirm(message));

    if (modalResolver) {
        modalResolver(false);
        modalResolver = null;
    }

    if (modalHideTimer) {
        window.clearTimeout(modalHideTimer);
        modalHideTimer = null;
    }

    DOM.modalBadge.innerText = badge;
    DOM.modalTitle.innerText = title;
    DOM.modalMessage.innerText = message;
    DOM.modalConfirmBtn.innerText = confirmText;
    DOM.modalCancelBtn.innerText = cancelText;
    const toneMap = {
        danger: {
            icon: "🛑",
            badgeClass: "text-red-300",
            iconClass: "bg-red-500/20",
            buttonClass: "bg-red-600 hover:bg-red-500",
        },
        warn: {
            icon: "⚠️",
            badgeClass: "text-amber-300",
            iconClass: "bg-amber-500/20",
            buttonClass: "bg-amber-600 hover:bg-amber-500",
        },
        success: {
            icon: "✅",
            badgeClass: "text-emerald-300",
            iconClass: "bg-emerald-500/20",
            buttonClass: "bg-emerald-600 hover:bg-emerald-500",
        },
        primary: {
            icon: "✨",
            badgeClass: "text-purple-300",
            iconClass: "bg-purple-500/20",
            buttonClass: "bg-purple-600 hover:bg-purple-500",
        },
    };
    const toneStyle = toneMap[tone] || toneMap.primary;
    DOM.modalIcon.innerText = toneStyle.icon;
    DOM.modalBadge.classList.remove("text-red-300", "text-amber-300", "text-emerald-300", "text-purple-300");
    DOM.modalBadge.classList.add(toneStyle.badgeClass);
    DOM.modalIcon.classList.remove("bg-red-500/20", "bg-amber-500/20", "bg-emerald-500/20", "bg-purple-500/20");
    DOM.modalIcon.classList.add(toneStyle.iconClass);
    DOM.modalConfirmBtn.className = `rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all ${
        toneStyle.buttonClass
    }`;
    DOM.modalOverlay.classList.remove("hidden");
    DOM.modalOverlay.classList.add("flex");

    requestAnimationFrame(() => {
        DOM.modalOverlay.classList.remove("opacity-0", "bg-black/0", "backdrop-blur-none");
        DOM.modalOverlay.classList.add("opacity-100", "bg-black/70", "backdrop-blur-sm");
        DOM.modalPanel?.classList.remove("opacity-0", "scale-95", "translate-y-3");
        DOM.modalPanel?.classList.add("opacity-100", "scale-100", "translate-y-0");
        DOM.modalConfirmBtn.focus();
    });

    return new Promise((resolve) => {
        modalResolver = resolve;
    });
}

function closeConfirmModal(result) {
    if (!DOM.modalOverlay || DOM.modalOverlay.classList.contains("hidden")) return;

    DOM.modalOverlay.classList.remove("opacity-100", "bg-black/70", "backdrop-blur-sm");
    DOM.modalOverlay.classList.add("opacity-0", "bg-black/0", "backdrop-blur-none");
    DOM.modalPanel?.classList.remove("opacity-100", "scale-100", "translate-y-0");
    DOM.modalPanel?.classList.add("opacity-0", "scale-95", "translate-y-3");

    modalHideTimer = window.setTimeout(() => {
        DOM.modalOverlay.classList.add("hidden");
        DOM.modalOverlay.classList.remove("flex");
        modalHideTimer = null;
    }, 180);

    if (modalResolver) {
        modalResolver(result);
        modalResolver = null;
    }
}

function syncProposalActions() {
    if (DOM.discardProposalBtn) {
        DOM.discardProposalBtn.disabled = !APP_STATE.hasPendingProposal;
        DOM.discardProposalBtn.classList.toggle("opacity-50", !APP_STATE.hasPendingProposal);
        DOM.discardProposalBtn.classList.toggle("cursor-not-allowed", !APP_STATE.hasPendingProposal);
    }

    if (DOM.regenerateProposalBtn) {
        const disabled = !DOM.aiInstruction.value.trim() || !APP_STATE.currentFileId;
        DOM.regenerateProposalBtn.disabled = disabled;
        DOM.regenerateProposalBtn.classList.toggle("opacity-50", disabled);
        DOM.regenerateProposalBtn.classList.toggle("cursor-not-allowed", disabled);
    }
}

function setBaselineProposal(content) {
    APP_STATE.baselineFileContent = content || "";
    APP_STATE.hasPendingProposal = false;
    renderProposal(APP_STATE.baselineFileContent, false);
    syncProposalActions();
}

function resetEditorState() {
    APP_STATE.currentProjectId = null;
    APP_STATE.currentFileId = null;
    APP_STATE.currentFiles = [];
    APP_STATE.currentProjectDetail = null;
    APP_STATE.baselineFileContent = "";
    APP_STATE.lastInstruction = "";
    APP_STATE.hasPendingProposal = false;

    if (DOM.aiInstruction) DOM.aiInstruction.value = "";
    persistDraftInstruction();

    const fileSelector = document.getElementById("fileSelector");
    if (fileSelector) fileSelector.innerHTML = "";
    if (DOM.fileSearchInput) DOM.fileSearchInput.value = "";

    renderProposal("", false);
    renderProjectMeta(null);
    DOM.editorSection?.classList.add("hidden");
    syncProposalActions();
}

function getCheckedDependencies() {
    return Array.from(document.querySelectorAll(".dependency-cb:checked")).map((cb) => cb.value);
}

function renderDependencyCatalog(items) {
    if (!DOM.dependencyCatalog) return;
    DOM.dependencyCatalog.innerHTML = "";

    items.forEach((item) => {
        const disabled = item.status !== "allowed";
        const card = document.createElement("label");
        card.className = `flex items-start space-x-3 bg-gray-900 p-4 rounded-lg border transition ${
            disabled ? "border-red-500/30 opacity-60 cursor-not-allowed" : "border-transparent hover:border-blue-500 cursor-pointer"
        }`;

        card.innerHTML = `
            <input type="checkbox"
                   value="${escapeHtml(item.key)}"
                   class="dependency-cb mt-1 h-5 w-5 text-blue-500 rounded bg-gray-800 border-gray-600"
                   ${disabled ? "disabled" : ""}>
            <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-gray-100 font-semibold">${escapeHtml(item.label)}</span>
                    <span class="text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded bg-gray-800 text-cyan-300">${escapeHtml(item.version)}</span>
                    <span class="text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded ${disabled ? "bg-red-900/40 text-red-300" : "bg-emerald-900/30 text-emerald-300"}">${escapeHtml(item.status)}</span>
                </div>
                <p class="mt-1 text-xs text-gray-400">${escapeHtml(item.kind)} · ${escapeHtml(item.license)} · riesgo ${escapeHtml(item.risk)}</p>
                <p class="mt-1 text-xs text-gray-500">${escapeHtml(item.reason || "")}</p>
            </div>
        `;
        DOM.dependencyCatalog.appendChild(card);
    });
}

async function loadDependencyCatalog() {
    try {
        const data = await apiRequest("/api/v1/projects/dependency-catalog");
        if (data?.status !== "SUCCESS") {
            throw new Error(data?.error || "No se pudo cargar el catálogo");
        }
        APP_STATE.dependencyCatalog = data.payload || [];
        renderDependencyCatalog(APP_STATE.dependencyCatalog);
    } catch (error) {
        renderResult(`No se pudo cargar el catálogo de dependencias: ${error.message}`, "warn");
    }
}

function addMilestoneRow(initial = {}) {
    if (!DOM.milestoneList) return;

    const row = document.createElement("div");
    row.className = "grid grid-cols-1 md:grid-cols-5 gap-3 bg-gray-900 border border-gray-700 rounded-xl p-4 milestone-row";
    row.innerHTML = `
        <input type="text" class="milestone-title bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Título del hito" value="${escapeHtml(initial.title || "")}">
        <input type="text" class="milestone-type bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Tipo" value="${escapeHtml(initial.type || "")}">
        <input type="datetime-local" class="milestone-deadline bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm" value="${escapeHtml(initial.deadline || "")}">
        <select class="milestone-status bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
            <option value="planned" ${initial.status === "planned" ? "selected" : ""}>planned</option>
            <option value="on-track" ${initial.status === "on-track" ? "selected" : ""}>on-track</option>
            <option value="delayed" ${initial.status === "delayed" ? "selected" : ""}>delayed</option>
            <option value="completed" ${initial.status === "completed" ? "selected" : ""}>completed</option>
        </select>
        <button type="button" class="remove-milestone bg-red-700 hover:bg-red-600 rounded-lg px-3 py-2 text-sm font-bold">Eliminar</button>
    `;
    row.querySelector(".remove-milestone")?.addEventListener("click", () => row.remove());
    DOM.milestoneList.appendChild(row);
}

function collectTimelinePayload() {
    return Array.from(document.querySelectorAll(".milestone-row"))
        .map((row) => ({
            title: row.querySelector(".milestone-title")?.value?.trim() || "",
            type: row.querySelector(".milestone-type")?.value?.trim() || "",
            deadline: row.querySelector(".milestone-deadline")?.value || "",
            status: row.querySelector(".milestone-status")?.value || "planned",
        }))
        .filter((item) => item.title && item.type && item.deadline);
}

function parseDomainList(value) {
    return String(value || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 20);
}

function collectDomainSpecPayload() {
    return {
        functionalRequirements: parseDomainList(DOM.domainFunctionalRequirements?.value),
        useCases: parseDomainList(DOM.domainUseCases?.value),
        dataModel: parseDomainList(DOM.domainDataModel?.value),
        requiredApis: parseDomainList(DOM.domainRequiredApis?.value),
    };
}

function collectUiToolingPayload() {
    const uiTooling = String(DOM.uiToolingCsv?.value || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12);

    return {
        uiPreset: DOM.uiPreset?.value || "modern-saas",
        uiTooling,
        enableA11yChecks: Boolean(DOM.enableA11yChecks?.checked),
        enableVisualRegression: Boolean(DOM.enableVisualRegression?.checked),
    };
}

function renderProjectMeta(detail) {
    APP_STATE.currentProjectDetail = detail;
    if (!detail) {
        if (DOM.projectMetaTitle) DOM.projectMetaTitle.innerText = "Sin proyecto abierto";
        if (DOM.projectMetaBadges) DOM.projectMetaBadges.innerHTML = "";
        if (DOM.projectMetaDescription) DOM.projectMetaDescription.innerText = "";
        if (DOM.projectMetaTimeline) DOM.projectMetaTimeline.innerHTML = "";
        return;
    }

    if (DOM.projectMetaTitle) DOM.projectMetaTitle.innerText = `${detail.nombre} · ${detail.cliente} / ${detail.tarea}`;
    if (DOM.projectMetaDescription) DOM.projectMetaDescription.innerText = detail.descripcion || "Sin descripción adicional.";

    if (DOM.projectMetaBadges) {
        DOM.projectMetaBadges.innerHTML = "";
        (detail.dependencias || []).forEach((dep) => {
            const badge = document.createElement("span");
            badge.className = "rounded-full bg-purple-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-purple-200";
            badge.innerText = `${dep.label} ${dep.version}`;
            DOM.projectMetaBadges.appendChild(badge);
        });
    }

    if (DOM.projectMetaTimeline) {
        DOM.projectMetaTimeline.innerHTML = "";
        (detail.timeline || []).forEach((milestone) => {
            const card = document.createElement("div");
            card.className = "rounded-lg border border-gray-700 bg-gray-950/60 p-3";
            card.innerHTML = `
                <p class="text-xs uppercase tracking-[0.18em] text-cyan-300 font-bold">${escapeHtml(milestone.type)}</p>
                <p class="mt-1 text-sm font-semibold text-white">${escapeHtml(milestone.title)}</p>
                <p class="mt-1 text-xs text-gray-400">${escapeHtml(milestone.deadline)} · ${escapeHtml(milestone.status)}</p>
            `;
            DOM.projectMetaTimeline.appendChild(card);
        });
    }
}

async function loadProjectDetail(projectId) {
    const data = await apiRequest(`/api/v1/projects/${projectId}`);
    if (data?.status !== "SUCCESS") {
        throw new Error(data?.error || "No se pudo cargar el detalle del proyecto");
    }
    renderProjectMeta(data.payload);
    return data.payload;
}

function renderFileSelectorOptions(files, selectedFileId = null) {
    const fileSelector = document.getElementById("fileSelector");
    if (!fileSelector) return;

    fileSelector.innerHTML = "";
    files.forEach((file) => {
        const option = document.createElement("option");
        option.value = String(file.id);
        option.textContent = file.ruta && file.ruta !== "/" ? `${file.ruta}/${file.nombreArchivo}` : file.nombreArchivo;
        fileSelector.appendChild(option);
    });

    if (selectedFileId && files.some((file) => file.id === selectedFileId)) {
        fileSelector.value = String(selectedFileId);
    }
}

function selectProjectFileByName(fileName) {
    const target = APP_STATE.currentFiles.find((file) => file.nombreArchivo === fileName);
    if (!target) return false;

    APP_STATE.currentFileId = target.id;
    const fileSelector = document.getElementById("fileSelector");
    if (fileSelector) fileSelector.value = String(target.id);
    setBaselineProposal(target.contenido || "");
    return true;
}

function filteredProjectsByMilestoneStatus(projects) {
    const filter = APP_STATE.hubMilestoneFilter || "all";
    if (filter === "all") return projects;

    return projects.filter((project) => {
        const counts = project.milestoneStatusCounts || {};
        return Number(counts[filter] || 0) > 0;
    });
}

function normalizeCategoryValue(value, fallback = "Sin categoría") {
    const normalized = String(value || "").trim();
    return normalized || fallback;
}

function resolveProjectCategory(project, groupBy) {
    const by = groupBy || "estado";
    if (by === "cliente") return normalizeCategoryValue(project.cliente, "Sin cliente");
    if (by === "tarea") return normalizeCategoryValue(project.tarea, "Sin tarea");
    if (by === "riesgo-hitos") {
        const counts = project.milestoneStatusCounts || {};
        if (Number(counts.delayed || 0) > 0) return "Con retrasos";
        if (Number(counts["on-track"] || 0) > 0) return "En curso";
        if (Number(counts.planned || 0) > 0) return "Planificados";
        if (Number(counts.completed || 0) > 0) return "Completados";
        return "Sin hitos";
    }
    return normalizeCategoryValue(project.estado, "Sin estado");
}

function projectsAfterHubFilters(projects) {
    const byMilestone = filteredProjectsByMilestoneStatus(projects);
    const byCategory = byMilestone.filter((project) => {
        if ((APP_STATE.hubCategoryFilter || "all") === "all") return true;
        return resolveProjectCategory(project, APP_STATE.hubCategoryGroupBy) === APP_STATE.hubCategoryFilter;
    });

    const query = APP_STATE.hubSearchQuery || "";
    if (!query) return byCategory;

    return byCategory.filter((project) => {
        const haystack = [project.nombre, project.cliente, project.tarea, project.estado, String(project.id)].join(" ").toLowerCase();
        return haystack.includes(query);
    });
}

function buildHubGroups(projects) {
    const groups = new Map();
    projects.forEach((project) => {
        const key = resolveProjectCategory(project, APP_STATE.hubCategoryGroupBy);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(project);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0], "es", { sensitivity: "base" }));
}

function updateHubCategoryFilterOptions(projects) {
    if (!DOM.hubCategoryFilter) return;
    const byMilestone = filteredProjectsByMilestoneStatus(projects || []);
    const categories = Array.from(new Set(byMilestone.map((project) => resolveProjectCategory(project, APP_STATE.hubCategoryGroupBy)))).sort((a, b) =>
        a.localeCompare(b, "es", { sensitivity: "base" })
    );

    const previous = APP_STATE.hubCategoryFilter || "all";
    DOM.hubCategoryFilter.innerHTML = "";

    const allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "Todas";
    DOM.hubCategoryFilter.appendChild(allOption);

    categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        DOM.hubCategoryFilter.appendChild(option);
    });

    APP_STATE.hubCategoryFilter = categories.includes(previous) ? previous : "all";
    DOM.hubCategoryFilter.value = APP_STATE.hubCategoryFilter;
    persistHubPreferences();
}

function renderHubProjectCard(project) {
    const card = document.createElement("article");
    card.className = "bg-gray-900 border border-gray-700 rounded-xl p-4 shadow";
    const statusCounts = project.milestoneStatusCounts || {};
    const statusBadges = Object.entries(statusCounts)
        .filter(([, count]) => Number(count) > 0)
        .map(([status, count]) => `<span class="text-[10px] px-2 py-1 rounded bg-gray-800 text-gray-300">${escapeHtml(status)}: ${count}</span>`)
        .join(" ");
    card.innerHTML = `
        <div class="flex items-start justify-between gap-3">
            <div>
                <p class="text-xs text-gray-500 font-mono">ID #${project.id}</p>
                <h3 class="text-lg font-semibold text-white break-all">${project.nombre}</h3>
                <p class="mt-1 text-xs text-cyan-300">${escapeHtml(project.cliente || "Sin cliente")} · ${escapeHtml(project.tarea || "Sin tarea")}</p>
            </div>
            <span class="text-xs bg-gray-700 text-cyan-300 px-2 py-1 rounded">${project.estado}</span>
        </div>
        <p class="mt-3 text-sm text-gray-300">Archivos registrados: <strong>${project.totalArchivos}</strong></p>
        <p class="mt-1 text-xs text-gray-400">Hitos: <strong>${project.milestoneCount || 0}</strong></p>
        ${statusBadges ? `<div class="mt-2 flex flex-wrap gap-1">${statusBadges}</div>` : ""}
        ${
            project.nextMilestone
                ? `<p class="mt-1 text-xs text-amber-300">Próximo: ${escapeHtml(project.nextMilestone.title)} · ${escapeHtml(project.nextMilestone.deadline)}</p>`
                : `<p class="mt-1 text-xs text-gray-500">Sin hitos programados</p>`
        }
        <div class="mt-4 flex gap-2 flex-wrap">
            <button data-open-project="${project.id}" class="inline-flex items-center gap-1.5 bg-cyan-700 hover:bg-cyan-600 text-white text-sm font-bold px-3 py-2 rounded-lg">
                ${renderSpriteIcon("open-editor", 15)}
                Abrir en editor
            </button>
            <button data-sync-project="${project.id}" data-project-name="${escapeHtml(project.nombre)}" class="inline-flex items-center gap-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-bold px-3 py-2 rounded-lg">
                ${renderSpriteIcon("vscode", 15)}
                Sincronizar
            </button>
            <button data-delete-project="${project.id}" data-project-name="${escapeHtml(project.nombre)}" class="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-600 text-white text-sm font-bold px-3 py-2 rounded-lg">
                ${renderSpriteIcon("trash", 14)}
                Borrar
            </button>
        </div>
    `;
    return card;
}

function wireHubCardActions() {
    DOM.projectsHub.querySelectorAll("[data-open-project]").forEach((button) => {
        button.addEventListener("click", async () => {
            const projectId = Number(button.getAttribute("data-open-project"));
            await openProjectFromHub(projectId);
        });
    });

    DOM.projectsHub.querySelectorAll("[data-delete-project]").forEach((button) => {
        button.addEventListener("click", async () => {
            const projectId = Number(button.getAttribute("data-delete-project"));
            const projectName = button.getAttribute("data-project-name") || `Proyecto ${projectId}`;
            await deleteProjectFromHub(projectId, projectName);
        });
    });

    DOM.projectsHub.querySelectorAll("[data-sync-project]").forEach((button) => {
        button.addEventListener("click", async () => {
            const projectId = Number(button.getAttribute("data-sync-project"));
            const projectName = button.getAttribute("data-project-name") || `Proyecto ${projectId}`;
            await syncProjectFromDisk(projectId, projectName);
        });
    });
}

async function syncProjectFromDisk(projectId, projectName) {
    const confirmed = await openConfirmModal({
        badge: "Sync desde VSCode",
        title: `¿Sincronizar ${projectName}?`,
        message: "Importará archivos nuevos/editados desde disco al Hub. No borra archivos en DB salvo que se active explícitamente deleteMissing.",
        confirmText: "Sincronizar",
        cancelText: "Cancelar",
        tone: "primary",
    });

    if (!confirmed) return;

    try {
        const data = await apiRequest(`/api/v1/projects/${projectId}/sync-from-disk`, {
            method: "POST",
            body: JSON.stringify({ dryRun: false, deleteMissing: false }),
        });
        if (data?.status !== "SUCCESS") {
            throw new Error(data?.error || "No se pudo sincronizar desde disco");
        }

        const r = data.payload || {};
        const msg = `+${r.created || 0} nuevos, ~${r.updated || 0} actualizados, =${r.unchanged || 0} sin cambios, omitidos ${r.skippedBinaryOrUnreadable || 0}`;
        renderResult(`Sync OK (${projectName}): ${msg}`, "success");
        showToast({
            type: "success",
            title: "Sincronización completada",
            message: `${projectName}: ${msg}`,
            actions: [
                {
                    label: "Abrir proyecto",
                    onClick: () => openProjectFromHub(projectId),
                },
            ],
        });

        await loadProjectsHub();
        if (APP_STATE.currentProjectId === projectId) {
            await cargarArchivosYMostrarEditor(projectId, { keepSelection: true });
        }
    } catch (error) {
        showToast({
            type: "error",
            title: "Sync fallido",
            message: error.message,
            duration: 5000,
        });
    }
}

function computeHubMilestoneDashboard(projects) {
    const totals = { planned: 0, "on-track": 0, delayed: 0, completed: 0 };
    projects.forEach((project) => {
        const counts = project.milestoneStatusCounts || {};
        Object.keys(totals).forEach((status) => {
            totals[status] += Number(counts[status] || 0);
        });
    });
    return totals;
}

function renderHubMilestoneDashboard(projects) {
    if (!DOM.hubMilestoneDashboard) return;
    const totals = computeHubMilestoneDashboard(projects);
    const styles = {
        planned: "border-cyan-500/40 text-cyan-300",
        "on-track": "border-emerald-500/40 text-emerald-300",
        delayed: "border-amber-500/40 text-amber-300",
        completed: "border-purple-500/40 text-purple-300",
    };

    DOM.hubMilestoneDashboard.innerHTML = Object.keys(totals)
        .map((status) => {
            const css = styles[status] || "border-gray-600 text-gray-300";
            return `
                <div class="rounded-lg border ${css} bg-gray-900/70 px-3 py-2">
                    <p class="text-[10px] uppercase tracking-[0.18em]">${escapeHtml(status)}</p>
                    <p class="mt-1 text-xl font-semibold">${totals[status]}</p>
                </div>
            `;
        })
        .join("");
}

function createEditorEnhancements() {
    const wrapper = document.createElement("div");
    wrapper.id = "editorTools";
    wrapper.className = "mb-4 grid grid-cols-1 md:grid-cols-[1.4fr_1fr_repeat(4,auto)] gap-3";

    wrapper.innerHTML = `
        <select id="fileSelector" class="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm"></select>
        <input id="fileSearchInput" class="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Buscar archivo...">
        <button id="refreshFilesBtn" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">Refrescar archivos</button>
        <button id="openNotesBtn" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">Notas</button>
        <button id="openResourcesBtn" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">Recursos</button>
        <button id="copyProposalBtn" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">Copiar propuesta</button>
        <button id="downloadProposalBtn" class="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">Descargar .kt</button>
    `;

    DOM.editorSection.querySelector(".space-y-6")?.prepend(wrapper);

    const fileSelector = document.getElementById("fileSelector");
    DOM.fileSearchInput = document.getElementById("fileSearchInput");
    const refreshFilesBtn = document.getElementById("refreshFilesBtn");
    const openNotesBtn = document.getElementById("openNotesBtn");
    const openResourcesBtn = document.getElementById("openResourcesBtn");
    const copyProposalBtn = document.getElementById("copyProposalBtn");
    const downloadProposalBtn = document.getElementById("downloadProposalBtn");

    fileSelector.addEventListener("change", () => {
        APP_STATE.currentFileId = Number(fileSelector.value);
        const selected = APP_STATE.currentFiles.find((f) => f.id === APP_STATE.currentFileId);
        if (selected) {
            setBaselineProposal(selected.contenido || "");
        }
    });
    refreshFilesBtn.addEventListener("click", async () => {
        if (!APP_STATE.currentProjectId) return;
        await cargarArchivosYMostrarEditor(APP_STATE.currentProjectId, { keepSelection: true });
    });
    DOM.fileSearchInput?.addEventListener("input", () => {
        const query = DOM.fileSearchInput.value.trim().toLowerCase();
        const filtered = query
            ? APP_STATE.currentFiles.filter((file) => `${file.ruta}/${file.nombreArchivo}`.toLowerCase().includes(query))
            : APP_STATE.currentFiles;
        renderFileSelectorOptions(filtered, APP_STATE.currentFileId);
    });
    openNotesBtn.addEventListener("click", () => selectProjectFileByName("NOTES.md"));
    openResourcesBtn.addEventListener("click", () => selectProjectFileByName("RESOURCES.md"));
    copyProposalBtn.addEventListener("click", copyProposalToClipboard);
    downloadProposalBtn.addEventListener("click", downloadProposalAsFile);
    syncProposalActions();
}

async function detectApiBaseUrl() {
    if (APP_STATE.apiBaseUrl) return APP_STATE.apiBaseUrl;

    const saved = localStorage.getItem(STORAGE_KEYS.preferredApiBase);
    const host = window.location.hostname || "localhost";
    const candidates = [
        saved,
        `http://${host}:8081`,
        `http://${host}:8080`,
    ].filter(Boolean);

    for (const base of candidates) {
        try {
            const res = await fetch(`${base}/status`, { method: "GET" });
            if (res.ok) {
                APP_STATE.apiBaseUrl = base;
                localStorage.setItem(STORAGE_KEYS.preferredApiBase, base);
                return base;
            }
        } catch (_error) {
            // Se intenta con el siguiente candidato.
        }
    }

    const fallback = saved || `http://${host}:8080`;
    APP_STATE.apiBaseUrl = fallback;
    return fallback;
}

async function apiRequest(path, options = {}) {
    const base = await detectApiBaseUrl();
    const url = `${base}${path}`;

    const response = await fetch(url, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options,
    });

    let data = null;
    try {
        data = await response.json();
    } catch (_error) {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} en ${path}`);
        }
    }

    if (!response.ok) {
        throw new Error(data?.error || `Error HTTP ${response.status} en ${path}`);
    }

    return data;
}

async function handleInitProjectSubmit(event) {
    event.preventDefault();
    if (APP_STATE.isBusy) return;

    const projectName = DOM.projectName.value.trim();
    const clientName = DOM.clientName.value.trim();
    const taskName = DOM.taskName.value.trim();
    const profile = DOM.projectProfile?.value || "static";
    const needsBusinessContext = profile === "static" || profile === "angular";
    const projectDescription = DOM.projectDescription.value.trim();
    const engine = DOM.creativeEngine?.value || "processing";
    const runtime = DOM.creativeRuntime?.value || (engine === "py5" ? "python3.11" : "java17");
    const tags = (DOM.projectTags?.value || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    const preview = DOM.projectPreview?.value?.trim() || null;
    if (!projectName) {
        renderResult("Debes ingresar un nombre de proyecto.", "warn");
        return;
    }
    if (needsBusinessContext && !clientName) {
        renderResult("Debes ingresar el cliente.", "warn");
        return;
    }
    if (needsBusinessContext && !taskName) {
        renderResult("Debes ingresar la tarea.", "warn");
        return;
    }

    const dependencias = getCheckedDependencies();
    const timeline = collectTimelinePayload();
    const domainSpec = collectDomainSpecPayload();
    const uiSettings = collectUiToolingPayload();

    setBusyState(true, "Construyendo...");
    renderResult("Iniciando arquitectura base...", "info");

    try {
        const data = await apiRequest("/api/v1/projects/init-static", {
            method: "POST",
            body: JSON.stringify({
                nombre: projectName,
                name: projectName,
                profile,
                cliente: clientName || null,
                tarea: taskName || null,
                descripcion: projectDescription || null,
                dependencias,
                timeline,
                useThreeJsInterop: Boolean(DOM.useThreeJsInterop?.checked),
                enableTailwindDirectives: Boolean(DOM.enableTailwindDirectives?.checked),
                engine: profile === "creative-coding" ? engine : null,
                runtime: profile === "creative-coding" ? runtime : null,
                tags,
                preview,
                domainSpec,
                uiPreset: uiSettings.uiPreset,
                uiTooling: uiSettings.uiTooling,
                enableA11yChecks: uiSettings.enableA11yChecks,
                enableVisualRegression: uiSettings.enableVisualRegression,
            }),
        });

        if (data?.status !== "CREATED") {
            throw new Error(data?.error || "Respuesta inesperada al crear proyecto");
        }

        APP_STATE.currentProjectId = data.payload;
        // Al crear un proyecto nuevo, forzamos el filtro a "all" para que no quede oculto en el Hub.
        APP_STATE.hubMilestoneFilter = "all";
        APP_STATE.hubCategoryFilter = "all";
        APP_STATE.hubSearchQuery = "";
        if (DOM.hubMilestoneFilter) DOM.hubMilestoneFilter.value = "all";
        if (DOM.hubCategoryFilter) DOM.hubCategoryFilter.value = "all";
        if (DOM.hubSearchInput) DOM.hubSearchInput.value = "";
        persistHubPreferences();

        renderResult(`Proyecto \"${projectName}\" (ID ${APP_STATE.currentProjectId}) creado correctamente.`, "success");
        await loadProjectsHub();
        await cargarArchivosYMostrarEditor(APP_STATE.currentProjectId);
    } catch (error) {
        renderResult(`Error al crear proyecto: ${error.message}`, "error");
    } finally {
        setBusyState(false);
    }
}

function sanitizeKotlinProposal(rawText) {
    if (!rawText) return "";

    let clean = rawText
        .replace(/[`]{3}(?:kotlin|java|kt)?\s*/gi, "")
        .replace(/[`]{3}/gi, "")
        .trim();

    const packageMatches = [...clean.matchAll(/package\s+[a-z0-9.]+/gi)];
    const importMatches = [...clean.matchAll(/import\s+[a-z0-9.]+/gi)];

    let bestStart = -1;
    if (packageMatches.length > 0) {
        bestStart = packageMatches[0].index;
    } else if (importMatches.length > 0) {
        bestStart = importMatches[0].index;
    } else {
        bestStart = clean.search(/fun\s+|class\s+|val\s+|var\s+/);
    }

    if (bestStart !== -1) clean = clean.substring(bestStart);

    const lastBrace = clean.lastIndexOf("}");
    if (lastBrace !== -1) clean = clean.substring(0, lastBrace + 1);

    return clean.trim();
}

async function cargarArchivosYMostrarEditor(projectId, options = {}) {
    try {
        await loadProjectDetail(projectId);
        const data = await apiRequest(`/api/v1/projects/${projectId}/files`);
        if (data?.status !== "SUCCESS") {
            throw new Error(data?.error || "No se pudieron recuperar archivos");
        }

        APP_STATE.currentFiles = data.payload || [];
        APP_STATE.currentProjectId = projectId;
        if (!APP_STATE.currentFiles.length) {
            renderResult("Proyecto creado, pero no se encontraron archivos.", "warn");
            return;
        }

        const preferred = ["Application.kt", "ApplicationGenerated.kt", "README_GENERADO.md", "NOTES.md"];
        const defaultFile = preferred
            .map((name) => APP_STATE.currentFiles.find((file) => file.nombreArchivo === name))
            .find(Boolean) || APP_STATE.currentFiles[0];
        const selectedFileId = options.keepSelection && APP_STATE.currentFileId ? APP_STATE.currentFileId : defaultFile.id;

        APP_STATE.currentFileId = selectedFileId;
        renderFileSelectorOptions(APP_STATE.currentFiles, selectedFileId);

        const selected = APP_STATE.currentFiles.find((f) => f.id === selectedFileId);
        setBaselineProposal(selected?.contenido || "");

        DOM.editorSection.classList.remove("hidden");
        DOM.editorSection.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
        renderResult(`Error al cargar archivos: ${error.message}`, "error");
    }
}

function renderHub(projects) {
    if (!DOM.projectsHub) return;
    const filteredProjects = projectsAfterHubFilters(projects);

    DOM.projectsHub.innerHTML = "";
    if (!filteredProjects.length) {
        DOM.hubResumen.innerText = projects.length
            ? "No hay proyectos para los filtros seleccionados."
            : "No hay proyectos todavia. Crea uno para comenzar.";
        const empty = document.createElement("div");
        empty.className = "bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-400";
        empty.innerText = "Hub vacio";
        DOM.projectsHub.appendChild(empty);
        return;
    }

    const filter = APP_STATE.hubMilestoneFilter || "all";
    const categoryBy = APP_STATE.hubCategoryGroupBy || "estado";
    const categoryFilter = APP_STATE.hubCategoryFilter || "all";
    const searchLabel = APP_STATE.hubSearchQuery ? ` · búsqueda: "${APP_STATE.hubSearchQuery}"` : "";
    DOM.hubResumen.innerText = `Proyectos visibles: ${filteredProjects.length}/${projects.length} · hitos: ${filter} · categoría: ${categoryBy}/${categoryFilter}${searchLabel}`;

    const groups = buildHubGroups(filteredProjects);
    groups.forEach(([groupName, groupProjects]) => {
        const section = document.createElement("section");
        section.className = "space-y-3";

        const header = document.createElement("div");
        header.className = "flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900/70 px-3 py-2";
        header.innerHTML = `
            <p class="text-xs uppercase tracking-[0.18em] text-cyan-300 font-bold">${escapeHtml(groupName)}</p>
            <span class="text-xs text-gray-300">${groupProjects.length} proyecto(s)</span>
        `;
        section.appendChild(header);

        const grid = document.createElement("div");
        grid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";
        groupProjects.forEach((project) => {
            grid.appendChild(renderHubProjectCard(project));
        });
        section.appendChild(grid);

        DOM.projectsHub.appendChild(section);
    });

    wireHubCardActions();
}

async function loadProjectsHub() {
    if (!DOM.projectsHub) return;

    DOM.projectsHub.innerHTML = '<div class="text-sm text-gray-400">Cargando proyectos...</div>';
    if (DOM.hubResumen) DOM.hubResumen.innerText = "Sincronizando con el backend...";

    try {
        const data = await apiRequest("/api/v1/projects");
        if (data?.status !== "SUCCESS") {
            throw new Error(data?.error || "No se pudo cargar el hub de proyectos");
        }
        APP_STATE.hubProjects = data.payload || [];
        updateHubCategoryFilterOptions(APP_STATE.hubProjects);
        renderHubMilestoneDashboard(APP_STATE.hubProjects);
        renderHub(APP_STATE.hubProjects);
    } catch (error) {
        DOM.projectsHub.innerHTML = '<div class="text-sm text-red-400">No se pudo cargar el hub.</div>';
        if (DOM.hubResumen) DOM.hubResumen.innerText = "Revisa la conexion al API.";
        renderResult(`Error en hub: ${error.message}`, "error");
    }
}

async function openProjectFromHub(projectId) {
    try {
        await cargarArchivosYMostrarEditor(projectId);
        const projectName = APP_STATE.hubProjects.find((p) => p.id === projectId)?.nombre || `Proyecto ${projectId}`;
        autoSyncDryRunOnOpen(projectId, projectName);
        renderResult(`Proyecto ${projectId} abierto en el editor.`, "success");
        showToast({
            type: "success",
            title: "Proyecto abierto",
            message: `Ya puedes trabajar sobre el proyecto ${projectId}.`,
            actions: [
                {
                    label: "Ver proyecto",
                    onClick: () => {
                        DOM.editorSection?.scrollIntoView({ behavior: "smooth", block: "start" });
                        DOM.aiInstruction?.focus();
                    },
                },
            ],
        });
    } catch (error) {
        renderResult(`No se pudo abrir el proyecto ${projectId}: ${error.message}`, "error");
    }
}

async function autoSyncDryRunOnOpen(projectId, projectName) {
    try {
        const data = await apiRequest(`/api/v1/projects/${projectId}/sync-from-disk`, {
            method: "POST",
            body: JSON.stringify({ dryRun: true, deleteMissing: false }),
        });
        if (data?.status !== "SUCCESS") return;

        const result = data.payload || {};
        const created = Number(result.created || 0);
        const updated = Number(result.updated || 0);
        const deleted = Number(result.deleted || 0);
        const pending = created + updated + deleted;
        if (pending <= 0) return;

        showToast({
            type: "warn",
            title: "Cambios detectados en VSCode",
            message: `${projectName}: ${created} nuevos, ${updated} modificados, ${deleted} faltantes en disco.`,
            duration: 5500,
            actions: [
                {
                    label: "Sincronizar ahora",
                    onClick: () => syncProjectFromDisk(projectId, projectName),
                },
                {
                    label: "Ignorar",
                    variant: "ghost",
                    onClick: () => {},
                },
            ],
        });
    } catch (_error) {
        // Fallback silencioso: si el endpoint no está disponible no bloqueamos apertura del editor.
    }
}

function undoDiscardedProposal() {
    const discarded = APP_STATE.lastDiscardedProposal;
    if (!discarded || discarded.fileId !== APP_STATE.currentFileId) {
        showToast({
            type: "warn",
            title: "No se puede deshacer",
            message: "La propuesta descartada ya no coincide con el archivo activo.",
        });
        return;
    }

    APP_STATE.hasPendingProposal = true;
    renderProposal(discarded.content, false);
    syncProposalActions();
    APP_STATE.lastDiscardedProposal = null;
    showToast({
        type: "success",
        title: "Propuesta restaurada",
        message: "Se recuperó la propuesta que habías descartado.",
    });
}

async function deleteProjectFromHub(projectId, projectName) {
    const confirmed = await openConfirmModal({
        badge: "Borrado de proyecto",
        title: `¿Eliminar ${projectName}?`,
        message: "Se borrarán el proyecto, sus archivos registrados y la salida generada. Esta acción no se puede deshacer.",
        confirmText: "Sí, borrar",
        cancelText: "Cancelar",
        tone: "danger",
    });

    if (!confirmed) {
        showToast({
            type: "info",
            title: "Borrado cancelado",
            message: `El proyecto ${projectName} sigue disponible en el hub.`,
        });
        return;
    }

    try {
        const data = await apiRequest(`/api/v1/projects/${projectId}`, { method: "DELETE" });
        if (data?.status !== "DELETED") {
            throw new Error(data?.error || "No se pudo borrar el proyecto");
        }

        if (APP_STATE.currentProjectId === projectId) {
            resetEditorState();
        }

        await loadProjectsHub();
        renderResult(`Proyecto ${projectId} eliminado correctamente.`, "success");
        showToast({
            type: "success",
            title: "Proyecto borrado",
            message: `${projectName} fue eliminado del hub.`,
        });
    } catch (error) {
        showToast({
            type: "error",
            title: "Error al borrar",
            message: error.message,
            duration: 5000,
        });
    }
}

async function iterarArchivo() {
    const instruccion = DOM.aiInstruction.value.trim();
    if (!instruccion) {
        renderProposal("Escribe una instruccion para generar una propuesta.", false);
        return;
    }
    if (!APP_STATE.currentFileId) {
        renderProposal("Primero crea o selecciona un proyecto/archivo.", false);
        return;
    }

    APP_STATE.lastInstruction = instruccion;
    APP_STATE.hasPendingProposal = false;
    syncProposalActions();
    renderProposal("El arquitecto IA esta diseniando la solucion...", true);

    try {
        const data = await apiRequest("/api/v1/projects/iterate", {
            method: "POST",
            body: JSON.stringify({ fileId: APP_STATE.currentFileId, instruccion }),
        });

        if (data?.status !== "PROPOSAL") {
            throw new Error(data?.error || "Respuesta inesperada de la IA");
        }

        const clean = sanitizeKotlinProposal(data.payload);
        APP_STATE.hasPendingProposal = Boolean(clean);
        renderProposal(clean || "La IA no devolvio codigo util.", false);
        syncProposalActions();
    } catch (error) {
        APP_STATE.hasPendingProposal = false;
        renderProposal(`Error: ${error.message}`, false);
        syncProposalActions();
    }
}

async function descartarPropuesta() {
    if (!APP_STATE.currentFileId) {
        renderResult("No hay archivo activo para restaurar.", "warn");
        return;
    }

    if (!APP_STATE.hasPendingProposal) {
        renderResult("No hay una propuesta pendiente para descartar.", "warn");
        setBaselineProposal(APP_STATE.baselineFileContent);
        return;
    }

    const confirmed = await openConfirmModal({
        badge: "Descartar propuesta",
        title: "¿Descartar esta propuesta?",
        message: "Se perderá la propuesta actual y se restaurará el contenido base del archivo seleccionado.",
        confirmText: "Sí, descartar",
        cancelText: "Seguir revisando",
        tone: "warn",
    });

    if (!confirmed) {
        showToast({
            type: "info",
            title: "Descarte cancelado",
            message: "La propuesta sigue disponible para revisarla o guardarla.",
        });
        return;
    }

    APP_STATE.lastDiscardedProposal = {
        fileId: APP_STATE.currentFileId,
        content: DOM.codeProposal.innerText,
    };
    setBaselineProposal(APP_STATE.baselineFileContent);
    renderResult("Propuesta descartada. Se ha restaurado el contenido original del archivo.", "info");
    showToast({
        type: "info",
        title: "Propuesta descartada",
        message: "Se restauró el contenido base del archivo actual.",
        actions: [
            {
                label: "Deshacer",
                onClick: undoDiscardedProposal,
            },
        ],
    });
}

async function regenerarPropuesta() {
    const instruction = DOM.aiInstruction.value.trim() || APP_STATE.lastInstruction;
    if (!instruction) {
        renderResult("Escribe una instruccion antes de regenerar.", "warn");
        return;
    }

    DOM.aiInstruction.value = instruction;
    persistDraftInstruction();
    await iterarArchivo();
}

async function confirmarCambio() {
    const nuevoCodigo = DOM.codeProposal.innerText;

    if (!APP_STATE.currentFileId) {
        showToast({
            type: "warn",
            title: "Archivo no seleccionado",
            message: "Abre un proyecto y selecciona un archivo antes de aplicar cambios.",
        });
        return;
    }

    if (!nuevoCodigo || nuevoCodigo.startsWith("El arquitecto IA") || nuevoCodigo.startsWith("Error:")) {
        showToast({
            type: "warn",
            title: "Propuesta inválida",
            message: "Genera una propuesta de código válida antes de guardarla.",
        });
        return;
    }

    const confirmed = await openConfirmModal({
        badge: "Aplicar cambios",
        title: "¿Guardar esta propuesta?",
        message: "Se actualizará el archivo en la base de datos y se escribirá la versión generada en disco.",
        confirmText: "Sí, aplicar",
        cancelText: "Seguir revisando",
        tone: "success",
    });

    if (!confirmed) {
        showToast({
            type: "info",
            title: "Guardado cancelado",
            message: "La propuesta sigue abierta para que la revises o la regeneres.",
        });
        return;
    }

    try {
        const data = await apiRequest(`/api/v1/projects/files/${APP_STATE.currentFileId}`, {
            method: "PUT",
            body: JSON.stringify({ contenido: nuevoCodigo }),
        });

        if (data?.status !== "OK") {
            throw new Error(data?.error || "Error al guardar cambios");
        }

        showToast({
            type: "success",
            title: "Cambios aplicados",
            message: "La propuesta fue guardada en la base de datos y generada en disco.",
        });
        DOM.aiInstruction.value = "";
        persistDraftInstruction();
        APP_STATE.lastInstruction = "";

        if (APP_STATE.currentProjectId) {
            await cargarArchivosYMostrarEditor(APP_STATE.currentProjectId, { keepSelection: true });
        }
    } catch (error) {
        showToast({
            type: "error",
            title: "Error al guardar",
            message: error.message,
            duration: 5000,
        });
    }
}

async function copyProposalToClipboard() {
    const text = DOM.codeProposal.innerText.trim();
    if (!text) {
        renderResult("No hay propuesta para copiar.", "warn");
        return;
    }
    try {
        await navigator.clipboard.writeText(text);
        renderResult("Propuesta copiada al portapapeles.", "success");
    } catch (_error) {
        renderResult("No se pudo copiar al portapapeles.", "error");
    }
}

function downloadProposalAsFile() {
    const text = DOM.codeProposal.innerText.trim();
    if (!text) {
        renderResult("No hay propuesta para descargar.", "warn");
        return;
    }

    const selected = APP_STATE.currentFiles.find((f) => f.id === APP_STATE.currentFileId);
    const filename = (selected?.nombreArchivo || "Application.kt").replace(/\s+/g, "_");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    renderResult(`Archivo ${filename} descargado.`, "success");
}

window.iterarArchivo = iterarArchivo;
window.confirmarCambio = confirmarCambio;
window.descartarPropuesta = descartarPropuesta;
window.regenerarPropuesta = regenerarPropuesta;
