    let bmiHistory = JSON.parse(localStorage.getItem('bmiHistory')) || [];
    const historyList = document.getElementById('historyList')
    const clearHistory = document.getElementById('clear-history')

    function updateHistoryList() {
        if (!historyList) return;
        historyList.innerHTML = '';
        if (bmiHistory.length === 0) {
            historyList.innerHTML = '<li class="list-group-item bg-transparent text-secondary">No history available.</li>';
            return;
        }

    bmiHistory.forEach(function(item) {
        const itemlist = document.createElement('li');
        itemlist.textContent = `BMI 💪🏻: ${item.bmi}, (Date 📅: ${item.date})`;
        itemlist.style.margin = '5px 0';
        itemlist.style.padding = '5px';
        historyList.appendChild(itemlist);
    });

    clearHistory.addEventListener('click', function() {
        bmiHistory = [];
        localStorage.removeItem('bmiHistory');
        updateHistoryList();
    });
}

updateHistoryList();
