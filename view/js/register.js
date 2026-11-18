document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("registerForm");
    if (registerForm){
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault()

            const username = document.getElementById("username").value
            const email = document.getElementById("email").value
            const password = document.getElementById("password").value
            const confirmPassword = document.getElementById("Cpassword").value

            if (password !== confirmPassword){
            alert("Password not match")
            return;
        }
        try {
            const response = await fetch("http://localhost:3000/register", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    username,
                    email,
                    password,
                    confirmPassword
                })
            })
            const data = await response.json()

            if (response.ok && data.success){
                alert(data.message)
                window.location.href = "login.html";
            } else {
                alert(data.message || "Register failed")
            }
        } catch(err){
            console.error("Connection error:", err)
            alert("Something went wrong")
        }
        })
    }
})