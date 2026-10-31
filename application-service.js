/*
    application-service.js
    ----------------------
    Simulates the core application & disbursement service.

    Architectural role:
    - Handles application submission and storage.
    - Isolated from compliance logic — it does NOT evaluate Sharia rules.
    - In a real system, disbursement would be a separate service.
*/

const ApplicationService = (() => {

    let applications = [];
    let counter = 10482;

    async function submit(applicationData) {
        await new Promise(r => setTimeout(r, 250));

        const application = {
            id: `TM-${counter++}`,
            ...applicationData,
            submittedAt: new Date().toISOString(),
            status: "submitted"
        };

        applications.push(application);
        console.log(`[application-service] submitted ${application.id}`);
        return application;
    }

    function getById(id) {
        return applications.find(a => a.id === id);
    }

    return { submit, getById };
})();