const weight = document.getElementById('weight')
const height = document.getElementById('height')
const calculatebtn = document.getElementById('calculatebtn')
const result = document.getElementById('result')

calculatebtn?.addEventListener("click", async () => {
    const w = parseFloat(weight.value)
    const h = parseFloat(height.value)
    if(!(w>0) || !(h > 0)){
        result.innerText = "Number only, bro 😭";
        return;
    }
    const res = await fetch("/api/bmi", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({weight: w, height: h})
    })
    const data = await res.json()
    result.innerText = data.success ? data.bmi : data.message
    document.dispatchEvent(new Event("bmi:saved"))
})