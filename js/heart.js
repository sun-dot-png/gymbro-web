const age = document.getElementById('age')
const result = document.getElementById('result')
const calculate = document.getElementById('heartcalculatebtn')
const zone = document.getElementById('zone')

heartcalculatebtn.addEventListener('click', function(){
    let heartMax = 220 - age.value;
    let selectZone = zone.value;
    if (selectZone === "zone1") {
        let zone1Min = heartMax * 0.50;
        let zone1Max = heartMax * 0.60;
        result.innerHTML = `${zone1Min} - ${zone1Max}`;
    } else if (selectZone === "zone2"){
        let zone2Min = heartMax * 0.60;
        let zone2Max = heartMax * 0.70;
        result.innerHTML = `${zone2Min} - ${zone2Max}`;
    } else if (selectZone === "zone3"){
        let zone3Min = heartMax * 0.70;
        let zone3Max = heartMax * 0.80;
        result.innerHTML = `${zone3Min} - ${zone3Max}`;
    } else if (selectZone === "zone4"){
        let zone4Min = heartMax * 0.80;
        let zone4Max = heartMax * 0.90;
        result.innerHTML = `${zone4Min} - ${zone4Max}`;
    } else {
        let zone5Min = heartMax * 0.90;
        let zone5Max = heartMax * 1.00;
        result.innerHTML = `${zone5Min} - ${zone5Max}`;
    }
});

age.addEventListener('input', function(){
    const check = /^[0-9]+(\.[0-9]+)?$/;
    if (check.test(age.value)){
        console.log('');
} else{
    console.log('Son😭');
    result.innerText = 'Son😭';
    alert('Number only bro !')
    age.value = '';
}
});
