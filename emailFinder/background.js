/**
 * eMail Address Finder - background.js
 * 
 * Validated against Mozilla Thunderbird 115+ up to modern stable releases (157.0.1).
 */

const EMAIL_GLOBAL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Helper to safely extract all email addresses from a field (string or array), resolving multiline header foldings
function parseAddresses(field) {
    let result = [];
    if (!field) return result;

    if (Array.isArray(field)) {
        field.forEach(item => {
            if (typeof item === "string") {
                const matches = item.match(EMAIL_GLOBAL_REGEX);
                if (matches) {
                    matches.forEach(m => result.push(m.trim().toLowerCase()));
                }
            }
        });
    } else if (typeof field === "string") {
        const matches = field.match(EMAIL_GLOBAL_REGEX);
        if (matches) {
            matches.forEach(m => result.push(m.trim().toLowerCase()));
        }
    }
    return result;
}

// Extract email addresses categorized by source field
function extractCategorizedAddresses(messagePart) {
    let data = {
        from: [],
        to: [],
        cc: [],
        bcc: [],
        body: []
    };

    function traverse(part) {
        if (!part) return;

        if (part.headers && typeof part.headers === "object") {
            if (part.headers.from) data.from.push(...parseAddresses(part.headers.from));
            if (part.headers.to) data.to.push(...parseAddresses(part.headers.to));
            if (part.headers.cc) data.cc.push(...parseAddresses(part.headers.cc));
            if (part.headers.bcc) data.bcc.push(...parseAddresses(part.headers.bcc));
        }

        if (part.body && typeof part.body === "string") {
            const bodyMatches = part.body.match(EMAIL_GLOBAL_REGEX);
            if (bodyMatches) {
                data.body.push(...bodyMatches.map(e => e.trim().toLowerCase()));
            }
        }

        if (Array.isArray(part.parts)) {
            part.parts.forEach(traverse);
        }
    }

    traverse(messagePart);

    for (const key in data) {
        data[key] = Array.from(new Set(data[key]));
    }

    return data;
}

// Update context menu items upon message display (Right Click menu)
async function updateContextMenu(tabId, messageId) {
    try {
        await messenger.menus.removeAll();

        const fullMessage = await messenger.messages.getFull(messageId);
        const categorized = extractCategorizedAddresses(fullMessage);

        const settings = await messenger.storage.local.get({
            menuLayout: "below",
            excludeAddresses: []
        });

        const excludedList = (settings.excludeAddresses || []).map(addr => addr.trim().toLowerCase()).filter(Boolean);
        const filterList = (list) => list.filter(email => !excludedList.includes(email));

        const toList = filterList(categorized.to);
        const ccList = filterList(categorized.cc);
        const bccList = filterList(categorized.bcc);
        const fromList = filterList(categorized.from);
        const bodyList = filterList(categorized.body);

        const toCcList = Array.from(new Set([...toList, ...ccList]));
        const fromCcList = Array.from(new Set([...fromList, ...ccList]));
        const allList = Array.from(new Set([...fromList, ...toList, ...ccList, ...bccList, ...bodyList]));

        messenger.menus.create({
            id: "count-header",
            title: `Found ${allList.length} email address(es)`,
            contexts: ["message_display_action"],
            enabled: false
        });

        messenger.menus.create({
            id: "sep-top",
            type: "separator",
            contexts: ["message_display_action"]
        });

        if (allList.length === 0) {
            messenger.menus.create({
                id: "no-addresses",
                title: "No email addresses found",
                contexts: ["message_display_action"],
                enabled: false
            });
        } else {
            const renderCopyActions = () => {
                if (toList.length > 0) {
                    messenger.menus.create({
                        id: "copy-to",
                        title: `Copy To (${toList.length})`,
                        contexts: ["message_display_action"],
                        onclick: async () => {
                            await navigator.clipboard.writeText(toList.join(", "));
                        }
                    });
                }

                if (ccList.length > 0) {
                    messenger.menus.create({
                        id: "copy-cc",
                        title: `Copy Cc (${ccList.length})`,
                        contexts: ["message_display_action"],
                        onclick: async () => {
                            await navigator.clipboard.writeText(ccList.join(", "));
                        }
                    });
                }

                if (toCcList.length > 0 && toList.length > 0 && ccList.length > 0) {
                    messenger.menus.create({
                        id: "copy-to-cc",
                        title: `Copy To + Cc (${toCcList.length})`,
                        contexts: ["message_display_action"],
                        onclick: async () => {
                            await navigator.clipboard.writeText(toCcList.join(", "));
                        }
                    });
                }

                if (fromList.length > 0) {
                    messenger.menus.create({
                        id: "copy-from",
                        title: `Copy From (${fromList.length})`,
                        contexts: ["message_display_action"],
                        onclick: async () => {
                            await navigator.clipboard.writeText(fromList.join(", "));
                        }
                    });
                }

                if (fromCcList.length > 0 && fromList.length > 0 && ccList.length > 0) {
                    messenger.menus.create({
                        id: "copy-from-cc",
                        title: `Copy From + Cc (${fromCcList.length})`,
                        contexts: ["message_display_action"],
                        onclick: async () => {
                            await navigator.clipboard.writeText(fromCcList.join(", "));
                        }
                    });
                }

                messenger.menus.create({
                    id: "copy-all",
                    title: `Copy All (${allList.length})`,
                    contexts: ["message_display_action"],
                    onclick: async () => {
                        await navigator.clipboard.writeText(allList.join(", "));
                    }
                });
            };

            const renderIndividualAddresses = () => {
                const displayAddresses = allList.slice(0, 15);
                displayAddresses.forEach((email, index) => {
                    messenger.menus.create({
                        id: `email-addr-${index}`,
                        title: email,
                        contexts: ["message_display_action"],
                        onclick: async () => {
                            await navigator.clipboard.writeText(email);
                        }
                    });
                });
            };

            if (settings.menuLayout === "above") {
                renderIndividualAddresses();
                messenger.menus.create({
                    id: "sep-layout",
                    type: "separator",
                    contexts: ["message_display_action"]
                });
                renderCopyActions();
            } else {
                renderCopyActions();
                messenger.menus.create({
                    id: "sep-layout",
                    type: "separator",
                    contexts: ["message_display_action"]
                });
                renderIndividualAddresses();
            }
        }

        messenger.menus.create({
            id: "sep-settings",
            type: "separator",
            contexts: ["message_display_action"]
        });

        messenger.menus.create({
            id: "open-settings",
            title: "Open Settings",
            contexts: ["message_display_action"],
            onclick: () => {
                messenger.runtime.openOptionsPage();
            }
        });

    } catch (error) {
        console.error("eMail Address Finder error:", error);
    }
}

// Expose address extractor to popup
messenger.runtime.onMessage.addListener(async (message) => {
    if (message.action === "getAddresses") {
        const fullMessage = await messenger.messages.getFull(message.messageId);
        return extractCategorizedAddresses(fullMessage);
    }
});

messenger.messageDisplay.onMessageDisplayed.addListener((tab, message) => {
    updateContextMenu(tab.id, message.id);
});