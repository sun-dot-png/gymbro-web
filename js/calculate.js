const weight = document.getElementById('weight')
const height = document.getElementById('height')
const calculatebtn = document.getElementById('calculatebtn')
const result = document.getElementById('result')

calculatebtn.addEventListener('click', function(){
    let answer = weight.value / (height.value * height.value);
    let bmi = answer.toFixed(1);
    result.innerText = bmi;

    let bmiHistory = JSON.parse(localStorage.getItem('bmiHistory')) || [];
    const record= {
        bmi :bmi,
        date :new Date().toLocaleString('th-TH')
    };

    bmiHistory.push(record);
    localStorage.setItem('bmiHistory', JSON.stringify(bmiHistory));
});

weight.addEventListener('input', function(){
    const check = /^[0-9]+(\.[0-9]+)?$/;
    if (check.test(weight.value)){
        console.log('');
} else{
    console.log('Son😭');
    result.innerText = 'Son😭';
    alert('Number only bro !')
    weight.value = '';
}
});

height.addEventListener('input', function(){
    const check = /^[0-9]+(\.[0-9]+)?$/;
    if (check.test(height.value)){
        console.log('');
} else{
    console.log('Son😭');
    result.innerText = 'Son😭';
    alert('Number only bro !')
    height.value = '';
}
});