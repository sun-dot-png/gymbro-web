    document.addEventListener("DOMContentLoaded", async () => {
        try {
            const response = await fetch("http://localhost:3000/check-auth", {
                method: "GET",
                credentials: "include"
            })
            const data = await response.json()
            if (!response.ok || !data.isLoggedIn){
                alert("Login first !")
                window.location.href = "login.html"
            }
        } catch(err) {
            console.error("Auth check error:", err)
            window.location.href = "login.html"
        }
    })