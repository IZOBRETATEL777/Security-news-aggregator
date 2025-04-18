document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const count = params.get("count");
    const summary = params.get("summary") === "true";

    const newsCountInput = document.getElementById("newsCount");
    const getSummaryBtn = document.getElementById("getSummary");
    const exportExcelBtn = document.getElementById("exportExcel");

    if (count) newsCountInput.value = count;

    getSummaryBtn.style.display = "none";
    exportExcelBtn.style.display = "none";

    if (count) {
        getSummaryBtn.style.display = "inline-block";
        if (summary) {
            exportExcelBtn.style.display = "inline-block";

            const table = document.getElementById("newsTable");
            const summaryHeader = table.querySelector("thead th:nth-child(3)");
            if (summaryHeader) summaryHeader.hidden = false;

            const rows = table.querySelectorAll("tbody tr");
            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                if (cells[2]) cells[2].hidden = false;
            });
        }
    }
});

document.getElementById("exportExcel").onclick = () => {
    const table = document.getElementById("newsTable");
    const rows = Array.from(table.querySelectorAll("tbody tr"));

    const params = new URLSearchParams(window.location.search);
    const includeSummary = params.get("summary") === "true";

    const headers = includeSummary
        ? ["🔐 TITLE", "📄 SUMMARY", "📅 DATE", "🔗 URL"]
        : ["🔐 TITLE", "🗝️ KEYWORDS", "📅 DATE", "🔗 URL"];

    const data = [headers];

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length < 5) return;

        const title = cells[0].innerText.trim();
        const middleCol = includeSummary ? cells[2].innerText.trim() : cells[1].innerText.trim();
        const date = cells[3].innerText.trim();
        const url = cells[5].innerText.trim();

        data.push([
            title,
            middleCol,
            date,
            { f: `HYPERLINK("${url}", "Open 🔗")` }
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(ws, data);

    ws['!cols'] = [
        { wch: 80 },
        { wch: 80 },
        { wch: 20 },
        { wch: 25 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CyberNews");
    XLSX.writeFile(wb, "SRE_Team_News.xlsx");
};

document.getElementById("applyFilter").onclick = () => {
    const count = document.getElementById("newsCount").value;
    if (parseInt(count) >= 5) {
        window.location.href = "/?count=" + count;
    } else {
        alert("Minimum number of news items is 5.");
    }
};

document.getElementById("resetFilter").onclick = () => {
    window.location.href = window.location.pathname;
};

document.getElementById("top5").onclick = () => {
    window.location.href = "/?count=5";
};

document.getElementById("getSummary").onclick = () => {
    const count = document.getElementById("newsCount").value;
    if (parseInt(count) >= 5) {
        window.location.href = `/?summary=true&count=${count}`;
    } else {
        alert("Minimum number of news items is 5.");
    }
};
