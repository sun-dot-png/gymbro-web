document.addEventListener("DOMContentLoaded", () => {
    const historyList = document.getElementById('historyList')
    const clearHistory = document.getElementById('clear-history')

    async function updateHistoryList() {
        if (!historyList) return;
        const res = await fetch("/api/bmi")
        if(res.status === 401) {location.href = "/login.html"; return;}
        const rows = await res.json()
    
    historyList.innerHTML = "";
    if(rows.length === 0){
        historyList.innerHTML = '<li class="list-group-item bg-transparent text-secondary">No history available.</li>';
        return;
    }
    rows.forEach(({bmi, create_at}) => {
        const li = document.createElement("li")
        li.textContent = `BMI 💪🏻: ${bmi}, (Date 📅: ${new Date(create_at).toLocaleString("th-TH")})`;
        li.style.margin = "5px 0";
        li.style.padding = "5px";
        historyList.appendChild(li);
    })
}
    clearHistory?.addEventListener("click", async() => {
        await fetch("/api/bmi", {
            method: "DELETE"
        })
        updateHistoryList()
    })
    document.addEventListener("bmi:saved", updateHistoryList)
    updateHistoryList()
})