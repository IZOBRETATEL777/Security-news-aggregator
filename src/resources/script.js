const params = new URLSearchParams(window.location.search);
const count = params.get("count");
const summary = params.get("summary") === "true";

window.addEventListener("load", () => {
    const newsCountInput = document.getElementById("newsCount");
    const getSummaryBtn = document.getElementById("getSummary");
    const exportExcelBtn = document.getElementById("exportExcel");
    const applyFilterBtn = document.getElementById("applyFilter");
    const resetFilterBtn = document.getElementById("resetFilter");
    const top5Btn = document.getElementById("top5");

    if (count) newsCountInput.value = count;

    getSummaryBtn.style.display = "none";
    exportExcelBtn.style.display = "none";

    if (count) {
        getSummaryBtn.style.display = "inline-block";
        exportExcelBtn.style.display = "inline-block";

        if (summary) {
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

    exportExcelBtn.onclick = () => {
        const table = document.getElementById("newsTable");
        if (!table) return;

        const rows = Array.from(table.querySelectorAll("tbody tr"));
        if (rows.length === 0) {
            alert("No news items to export.");
            return;
        }

        const includeSummary = summary;
        const data = includeSummary
            ? ["Title", "Summary", "Date", "URL"]
            : ["Title", "Keywords", "Date", "URL"];

        rows.forEach(row => {
            const cells = row.querySelectorAll("td");

            const title = cells[0]?.innerText.trim() || "No title";
            const middleCol = includeSummary
                ? (cells[2]?.innerText.trim() || "No summary")
                : (cells[1]?.innerText.trim() || "No keywords");
            const date = cells[3]?.innerText.trim() || "No date";
            const url = cells[5]?.innerText.trim() || "";

            data.push([
                title,
                middleCol,
                date,
                { f: `HYPERLINK("${url}", "Open")` }
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(data);

        ws['!cols'] = [
            { wch: 80 }, // Title
            { wch: 80 }, // Summary or Keywords
            { wch: 20 }, // Date
            { wch: 25 }  // Link
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, includeSummary ? "CyberNews_Summary" : "CyberNews_Keywords");
        XLSX.writeFile(wb, "SRE_Team_News.xlsx");
    };

    applyFilterBtn.onclick = () => {
        const count = newsCountInput.value;
        if (parseInt(count) >= 5) {
            window.location.href = "/?count=" + count;
        } else {
            alert("Minimum number of news items is 5.");
        }
    };

    resetFilterBtn.onclick = () => {
        window.location.href = window.location.pathname;
    };

    top5Btn.onclick = () => {
        window.location.href = "/?count=5";
    };

    getSummaryBtn.onclick = () => {
        const count = newsCountInput.value;
        if (parseInt(count) >= 5) {
            window.location.href = `/?summary=true&count=${count}`;
        } else {
            alert("Minimum number of news items is 5.");
        }
    };
});
