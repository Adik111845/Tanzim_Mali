/*
    script.js
    ---------
    Tanzim Mali — HCI Interactive Prototype

    Architectural role:
    - This file contains ONLY UI orchestration.
    - No compliance rules, no business logic, no data storage.
    - Every backend interaction goes through ApiGateway.
    - Confirms adjustments #4 (refined UI) and #5 (modular design).

    Dependencies (must be loaded before this file):
        compliance-service.js
        application-service.js
        notification-service.js
        api-gateway.js
*/


// ================================
// Application state (UI-only)
// ================================

let currentApplication = null;
let currentComplianceResult = null;


// ================================
// Screen management
// ================================

const screens = {
    1: document.getElementById("screen-1"),
    2: document.getElementById("screen-2"),
    3: document.getElementById("screen-3"),
    4: document.getElementById("screen-4")
};

const progressSteps = document.querySelectorAll(".progress-step");
const progressLines = document.querySelectorAll(".progress-line");


function showScreen(number) {

    Object.values(screens).forEach(screen => {
        screen.classList.remove("active");
    });

    screens[number].classList.add("active");

    progressSteps.forEach((step, index) => {

        const stepNumber = index + 1;

        step.classList.remove("active");
        step.classList.remove("completed");

        if (stepNumber < number) step.classList.add("completed");
        if (stepNumber === number) step.classList.add("active");
    });

    progressLines.forEach((line, index) => {
        line.style.background =
            index < number - 1 ? "var(--green)" : "#dfe6e2";
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}


// ================================
// Boot — initialize gateway + show service version
// ================================

(async function boot() {

    try {
        await ApiGateway.initialize();

        const meta = ApiGateway.getComplianceMetadata();

        document.getElementById("service-version").textContent =
            `compliance-service v${meta.version}`;

        document.getElementById("rules-meta").textContent =
            `${meta.ruleCount} rules · updated ${meta.lastUpdated} · ${meta.regulatorySource}`;

        console.log(
            `[UI] booted — compliance-service v${meta.version} (${meta.ruleCount} rules)`
        );
    } catch (err) {
        console.error("[UI] boot failed:", err);
        document.getElementById("service-version").textContent =
            "compliance-service unavailable";
    }

})();


// ================================
// SCREEN 1 — Submit application
// ================================

const applicationForm = document.getElementById("application-form");

applicationForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const data = {
        businessName: document.getElementById("business-name").value,
        amount: document.getElementById("amount").value,
        purpose: document.getElementById("purpose").value,
        structure: document.getElementById("structure").value,
        documents: document.getElementById("documents").value
    };

    // Disable the submit button while work is happening
    const submitButton = applicationForm.querySelector("button[type='submit']");
    const originalLabel = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = "Processing…";

    try {

        // 1. Submit through gateway → application service
        currentApplication = await ApiGateway.submitApplication(data);

        // 2. Run compliance check through gateway → compliance microservice
        currentComplianceResult =
            await ApiGateway.runComplianceCheck(currentApplication);

        // 3. Render results
        renderComplianceFindings(currentComplianceResult);
        renderBoardDetails(currentApplication, currentComplianceResult);

        // 4. Move to Screen 2
        showScreen(2);

    } catch (err) {
        console.error("[UI] submission failed:", err);
        alert("Something went wrong submitting the application. Check console.");
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = originalLabel;
    }

});


// ================================
// SCREEN 2 — Render compliance findings
// ================================

function renderComplianceFindings(result) {

    // ----- Dynamic findings list -----
    const container = document.getElementById("findings-container");
    container.innerHTML = "";

    result.findings.forEach(finding => {

        const row = document.createElement("div");
        row.className = "finding";

        const iconClass  = finding.status === "clear" ? "success" : "warning";
        const iconGlyph  = finding.status === "clear" ? "✓" : "!";
        const statusText = finding.status === "clear" ? "Clear" : "Review";
        const statusCls  = finding.status === "clear"
            ? "success-text"
            : "warning-text";

        row.innerHTML = `
            <div class="finding-left">
                <span class="finding-icon ${iconClass}">${iconGlyph}</span>
                <div>
                    <strong>${finding.category}</strong>
                    <span>${finding.plainLanguage}</span>
                </div>
            </div>
            <span class="finding-status ${statusCls}">${statusText}</span>
        `;

        container.appendChild(row);
    });

    // ----- Explainability panel (adjustment #2) -----
    document.getElementById("ai-rationale").textContent =
        result.decisionRationale;

    const ruleIds = result.findings.map(f => f.ruleId).join(", ");
    document.getElementById("rules-applied").textContent =
        `Rules applied: ${ruleIds}`;

    // ----- Application ID + service version inline -----
    document.getElementById("application-id-label").textContent =
        `Application #${result.applicationId}`;

    document.getElementById("service-version-inline").textContent =
        `compliance-service v${result.serviceVersion}`;
}


// ================================
// SCREEN 3 — Populate board details
// ================================

function renderBoardDetails(app, result) {

    // Application IDs on all screens
    document.getElementById("application-id-label").textContent =
        `Application #${app.id}`;
    document.getElementById("application-id-label-3").textContent =
        `Application #${app.id}`;
    document.getElementById("application-id-label-4").textContent =
        `Application #${app.id}`;

    // Service version inline
    document.getElementById("service-version-inline").textContent =
        `compliance-service v${result.serviceVersion}`;

    // Detail rows on Screen 3
    document.getElementById("detail-business").textContent  = app.businessName;
    document.getElementById("detail-amount").textContent    = `₸${app.amount}`;
    document.getElementById("detail-purpose").textContent   = app.purpose;
    document.getElementById("detail-structure").textContent = app.structure;
    document.getElementById("detail-contract").textContent  = app.documents;

    // Mini findings list on Screen 3
    const mini = document.getElementById("mini-findings-container");
    mini.innerHTML = "";

    result.findings.forEach(finding => {

        const div = document.createElement("div");

        const dotClass = finding.status === "clear"
            ? "success-dot"
            : "warning-dot";

        const label = finding.status === "clear" ? "No issue" : "Review";

        div.innerHTML = `
            <span class="dot ${dotClass}"></span>
            ${finding.category}
            <strong>${label}</strong>
        `;

        mini.appendChild(div);
    });
}


// ================================
// SCREEN 2 — Send to Sharia Board
// ================================

document.getElementById("send-board")
    .addEventListener("click", function () {

        // This is the handoff from the automated preliminary
        // analysis to human review. No business logic — just navigation.
        showScreen(3);
    });


// ================================
// SCREEN 3 — Approve
// ================================

document.getElementById("approve")
    .addEventListener("click", async function () {

        if (currentApplication) {
            await NotificationService.send("application.approved", {
                id: currentApplication.id
            });
        }

        showScreen(4);
    });


// ================================
// SCREEN 3 — Request Changes
// ================================

document.getElementById("request-changes")
    .addEventListener("click", function () {

        const message = document.getElementById("change-message");
        message.classList.remove("hidden");

        message.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    });


// ================================
// ADMIN PANEL (adjustment #6)
// ================================

const adminPanel  = document.getElementById("admin-panel");
const adminToggle = document.getElementById("admin-toggle");

adminToggle.addEventListener("click", () => {

    adminPanel.classList.toggle("hidden");
    renderNotificationLog();
});


// ----- Hot-reload rules -----

document.getElementById("reload-rules")
    .addEventListener("click", async () => {

        const statusEl = document.getElementById("admin-status");
        statusEl.textContent = "Reloading…";

        try {

            const meta = await ApiGateway.reloadComplianceRules();

            // Update header version label
            document.getElementById("service-version").textContent =
                `compliance-service v${meta.version}`;

            // Update admin meta line
            document.getElementById("rules-meta").textContent =
                `${meta.ruleCount} rules · updated ${meta.lastUpdated} · ${meta.regulatorySource}`;

            // If an application is already loaded, re-run live
            if (currentApplication) {

                currentComplianceResult =
                    await ApiGateway.runComplianceCheck(currentApplication);

                renderComplianceFindings(currentComplianceResult);
                renderBoardDetails(currentApplication, currentComplianceResult);

                statusEl.textContent =
                    `Rules reloaded (v${meta.version}) — core disbursement & notification flow untouched.`;
            } else {
                statusEl.textContent =
                    `Rules reloaded (v${meta.version}) — no active application to re-check.`;
            }

            renderNotificationLog();

        } catch (err) {
            console.error("[UI] rule reload failed:", err);
            statusEl.textContent = "Reload failed — check console.";
        }
    });


// ================================
// Notification log (admin panel)
// ================================

function renderNotificationLog() {

    const log = ApiGateway.getNotificationLog();
    const el  = document.getElementById("notification-log");

    if (!log.length) {
        el.innerHTML = "<div>No events yet.</div>";
        return;
    }

    el.innerHTML = log
        .map(entry => {
            const time = entry.sentAt
                .split("T")[1]
                .split(".")[0];
            return `<div>[${time}] ${entry.eventType}</div>`;
        })
        .join("");
}