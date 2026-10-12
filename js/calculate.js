const weight = document.getElementById('weight')
const height = document.getElementById('height')
const calculate = document.getElementById('calculatebtn')
const result = document.getElementById('result')

calculatebtn.addEventListener('click', function(){
    let answer = weight.value / (height.value * height.value);
    let bmi = answer.toFixed(1);
    result.innerText = bmi;
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