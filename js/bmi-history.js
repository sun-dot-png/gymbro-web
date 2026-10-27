const bmiHistory = JSON.parse(localStorage.getItem('bmiHistory')) || [];

displayBMIHistory();

document.getElementById('calculatebtn').addEventListener('click', function() {
    const bmiResult = parseFloat(document.getElementById('result').textContent);
    const currentDate = new Date().toLocaleString('th-TH');

    const record = {
        bmi: bmiResult,
        date: currentDate
    };

    bmiHistory.push(record);
    localStorage.setItem('bmiHistory', JSON.stringify(bmiHistory));
    displayBMIHistory();
});

function displayBMIHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    if (bmiHistory.length === 0) {
        historyList.innerHTML = '<li>No BMI history available.</li>';
        return;
    }

    bmiHistory.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `BMI: ${item.bmi}, Date: ${item.date}`;
        historyList.appendChild(listItem);
    });
}

document.getElementById('clear-history').addEventListener('click', function() {
    bmiHistory.length = 0;
    localStorage.removeItem('bmiHistory');
    displayBMIHistory();
});