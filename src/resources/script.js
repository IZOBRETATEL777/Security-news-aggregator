document.getElementById("exportExcel").onclick = () => {
    const table = document.getElementById("newsTable");
    const rows = Array.from(table.querySelectorAll("tbody tr"));

    const data = [
        ["🔐 TITLE", "🗝️ KEYWORDS", "📅 DATE", "🔗 URL"]
    ];

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        if (cells.length < 5) return;

        const title = cells[0].innerText.trim();
        const keywords = cells[1].innerText.trim();
        const date = cells[2].innerText.trim();
        const url = cells[4].innerText.trim();

        data.push([
            title,
            keywords,
            date,
            { f: `HYPERLINK("${url}", "Open 🔗")` }
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(ws, data);

    ws['!cols'] = [
        { wch: 80 },
        { wch: 40 },
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

const params = new URLSearchParams(window.location.search);
const count = params.get("count") || 5;
document.getElementById("newsCount").value = count;
