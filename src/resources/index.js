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