const params = new URLSearchParams(window.location.search);
const count = params.get("count");
const summary = params.get("summary") === "true";

const newsCountInput = document.getElementById("newsCount");
const getSummaryBtn = document.getElementById("getSummary");
const exportExcelBtn = document.getElementById("exportExcel");

// Set input
if (count) newsCountInput.value = count;

// Default hidden
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
