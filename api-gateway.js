/*
    api-gateway.js
    --------------
    Simulates the API Gateway.

    Architectural role:
    - The UI NEVER calls services directly.
    - All requests pass through this gateway.
    - Confirms adjustment #3 (connected ecosystem, single entry point).

    This keeps the UI decoupled from backend service boundaries.
*/

const ApiGateway = (() => {

    async function initialize() {
        await ComplianceService.loadRules();
    }

    // --- Application endpoints ---
    async function submitApplication(data) {
        const application = await ApplicationService.submit(data);
        await NotificationService.send("application.submitted", {
            id: application.id
        });
        return application;
    }

    // --- Compliance endpoints ---
    async function runComplianceCheck(application) {
        const result = await ComplianceService.checkApplication(application);
        await NotificationService.send("compliance.checked", {
            id: application.id,
            status: result.overallStatus
        });
        return result;
    }

    // --- Admin endpoints ---
    async function reloadComplianceRules() {
        const meta = await ComplianceService.reloadRules();
        await NotificationService.send("compliance.rules_reloaded", meta);
        return meta;
    }

    function getComplianceMetadata() {
        return ComplianceService.getMetadata();
    }

    function getNotificationLog() {
        return NotificationService.getLog();
    }

    return {
        initialize,
        submitApplication,
        runComplianceCheck,
        reloadComplianceRules,
        getComplianceMetadata,
        getNotificationLog
    };
})();