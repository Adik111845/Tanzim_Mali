/*
    notification-service.js
    -----------------------
    Simulates the notification service.

    Architectural role:
    - Receives events, sends notifications.
    - Completely decoupled from compliance and application logic.
    - Confirms adjustment #3 (connected ecosystem via events).
*/

const NotificationService = (() => {

    const log = [];

    async function send(eventType, payload) {
        await new Promise(r => setTimeout(r, 120));

        const entry = {
            eventType,
            payload,
            sentAt: new Date().toISOString()
        };

        log.push(entry);
        console.log(`[notification-service] ${eventType}`, payload);
        return entry;
    }

    function getLog() {
        return [...log];
    }

    return { send, getLog };
})();