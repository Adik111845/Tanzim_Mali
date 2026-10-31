/*
    compliance-service.js
    ---------------------
    Simulates the dedicated Sharia-Compliance Microservice.

    Architectural role:
    - Owns its own rules (loaded from compliance-rules.json).
    - Exposes a single public interface: checkApplication(application)
    - Returns a structured decision + rationale (explainability contract).
    - Can hot-reload rules without affecting other services.

    This module does NOT touch the UI, the application service,
    or the notification service. It is isolated by design.
*/

const ComplianceService = (() => {

    let rules = [];
    let version = "unknown";
    let lastUpdated = "unknown";
    let regulatorySource = "unknown";

    // Load rules from the JSON "rule store"
    async function loadRules() {
        const response = await fetch("compliance-rules.json");
        const data = await response.json();

        rules = data.rules;
        version = data.serviceVersion;
        lastUpdated = data.lastUpdated;
        regulatorySource = data.regulatorySource;

        console.log(
            `[compliance-service] rules loaded — v${version} (${lastUpdated})`
        );
    }

    // Hot-reload: swap rules at runtime (adjustment #6)
    async function reloadRules() {
        await loadRules();
        return getMetadata();
    }

    function getMetadata() {
        return { version, lastUpdated, regulatorySource, ruleCount: rules.length };
    }

    // Public API — the only way anything talks to this service
    async function checkApplication(application) {
        // Simulate async microservice call
        await new Promise(r => setTimeout(r, 400));

        const findings = rules.map(rule => {
            const result = evaluateRule(rule, application);

            return {
                ruleId: rule.id,
                category: rule.category,
                regulation: rule.regulation,
                status: result.status,           // "clear" | "review" | "fail"
                reason: result.reason,           // plain-language explanation
                plainLanguage: rule.plainLanguage
            };
        });

        const overallStatus = findings.some(f => f.status === "fail")
            ? "fail"
            : findings.some(f => f.status === "review")
                ? "review"
                : "clear";

        return {
            applicationId: application.id,
            overallStatus,
            findings,
            decisionRationale: buildRationale(findings),
            serviceVersion: version,
            evaluatedAt: new Date().toISOString()
        };
    }

    // Mock rule evaluation logic (stand-in for real AI / rule engine)
    function evaluateRule(rule, application) {
        switch (rule.category) {
            case "Riba":
                return { status: "clear", reason: "No interest-based charges detected in the contract terms." };
            case "Gharar":
                return { status: "review", reason: "Contract text lacks explicit ownership sequence, which may introduce uncertainty." };
            case "Maysir":
                return { status: "clear", reason: "No speculative or gambling elements found in the stated purpose." };
            case "Business activity":
                return { status: "clear", reason: "Business activity matches the permissible categories list." };
            case "Contract structure":
                return { status: "review", reason: "Profit margin disclosure not fully detailed in the contract text." };
            default:
                return { status: "clear", reason: "No issue detected." };
        }
    }

    // Explainability contract (adjustment #2)
    function buildRationale(findings) {
        const reviewItems = findings.filter(f => f.status === "review");
        const failItems = findings.filter(f => f.status === "fail");

        if (failItems.length > 0) {
            return `Application flagged: ${failItems.length} critical issue(s) detected. Human review required.`;
        }
        if (reviewItems.length > 0) {
            return `Application passed automated checks but ${reviewItems.length} item(s) require Sharia reviewer attention.`;
        }
        return "All automated compliance checks passed. Ready for reviewer confirmation.";
    }

    return {
        loadRules,
        reloadRules,
        getMetadata,
        checkApplication
    };
})();