document.addEventListener("DOMContentLoaded", async () => {
    const headerEl = document.getElementById("header");
    const contentEl = document.getElementById("content");
    const statusEl = document.getElementById("status");

    function showCopied() {
        statusEl.style.display = "block";
        setTimeout(() => {
            statusEl.style.display = "none";
        }, 1500);
    }

    async function copyText(text) {
        await navigator.clipboard.writeText(text);
        showCopied();
    }

    document.getElementById("btn-settings").addEventListener("click", () => {
        messenger.runtime.openOptionsPage();
    });

    try {
        const tabs = await messenger.tabs.query({ active: true, currentWindow: true });
        const displayedMessage = await messenger.messageDisplay.getDisplayedMessage(tabs[0].id);

        if (!displayedMessage) {
            headerEl.textContent = "Nenhuma mensagem selecionada";
            return;
        }

        const categorized = await messenger.runtime.sendMessage({
            action: "getAddresses",
            messageId: displayedMessage.id
        });

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

        headerEl.textContent = `Found ${allList.length} email address(es)`;

        if (allList.length === 0) {
            const noEl = document.createElement("div");
            noEl.className = "item disabled";
            noEl.textContent = "No email addresses found";
            contentEl.appendChild(noEl);
            return;
        }

        const actionsEl = document.createElement("div");
        const listEl = document.createElement("div");

        if (toList.length > 0) {
            const btn = document.createElement("div");
            btn.className = "item";
            btn.textContent = `Copy To (${toList.length})`;
            btn.onclick = () => copyText(toList.join(", "));
            actionsEl.appendChild(btn);
        }

        if (ccList.length > 0) {
            const btn = document.createElement("div");
            btn.className = "item";
            btn.textContent = `Copy Cc (${ccList.length})`;
            btn.onclick = () => copyText(ccList.join(", "));
            actionsEl.appendChild(btn);
        }

        if (toCcList.length > 0 && toList.length > 0 && ccList.length > 0) {
            const btn = document.createElement("div");
            btn.className = "item";
            btn.textContent = `Copy To + Cc (${toCcList.length})`;
            btn.onclick = () => copyText(toCcList.join(", "));
            actionsEl.appendChild(btn);
        }

        if (fromList.length > 0) {
            const btn = document.createElement("div");
            btn.className = "item";
            btn.textContent = `Copy From (${fromList.length})`;
            btn.onclick = () => copyText(fromList.join(", "));
            actionsEl.appendChild(btn);
        }

        if (fromCcList.length > 0 && fromList.length > 0 && ccList.length > 0) {
            const btn = document.createElement("div");
            btn.className = "item";
            btn.textContent = `Copy From + Cc (${fromCcList.length})`;
            btn.onclick = () => copyText(fromCcList.join(", "));
            actionsEl.appendChild(btn);
        }

        const btnAll = document.createElement("div");
        btnAll.className = "item";
        btnAll.textContent = `Copy All (${allList.length})`;
        btnAll.onclick = () => copyText(allList.join(", "));
        actionsEl.appendChild(btnAll);

        allList.slice(0, 15).forEach(email => {
            const item = document.createElement("div");
            item.className = "item";
            item.textContent = email;
            item.onclick = () => copyText(email);
            listEl.appendChild(item);
        });

        const sep = document.createElement("div");
        sep.className = "divider";

        if (settings.menuLayout === "above") {
            contentEl.appendChild(listEl);
            contentEl.appendChild(sep);
            contentEl.appendChild(actionsEl);
        } else {
            contentEl.appendChild(actionsEl);
            contentEl.appendChild(sep);
            contentEl.appendChild(listEl);
        }

    } catch (err) {
        headerEl.textContent = "Erro ao carregar e-mails";
        console.error(err);
    }
});