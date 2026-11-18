const getModal = (id) => bootstrap.Modal.getOrCreateInstance(document.getElementById(id));
document.getElementById("forgotLink").addEventListener("click", (e) => {
    e.preventDefault()
    getModal("forgotModal").show()
})
document.getElementById("forgotForm").addEventListener("submit", async (e) => {
    e.preventDefault()
    try{
        const res = await fetch("/forgot-password", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                email: document.getElementById("forgotEmail").value
            })
        })
        const data = await res.json()
        alert(data.message)
        if(res.ok && data.success){
            getModal("forgotModal").hide()
            e.target.reset()
        }
    } catch(err){
        console.error(err)
        alert("Something went wrong")
    }
})

const resetToken = new URLSearchParams(window.location.search).get("token")
if (resetToken) {
    getModal("resetModal").show()
}
document.getElementById("resetForm").addEventListener("submit", async (e) => {
    e.preventDefault()
    try{
        const res = await fetch("/reset-password", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                token: resetToken,
                newPassword: document.getElementById("resetNewPassword").value,
                confirmPassword: document.getElementById("resetConfirmPassword").value
            })
        })
        const data = await res.json()
        if(res.ok && data.success){
            getModal("resetModal").hide()
            e.target.reset()
            history.replaceState(null, "", "login.html")
        }
    } catch(err){
        console.error(err)
        alert("Something went wrong")
    }
})