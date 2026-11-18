    document.addEventListener("DOMContentLoaded", async () => {
        try {
            const response = await fetch("/check-auth", {
                credentials: "include"
            })
            const data = await response.json()
            if (!response.ok || !data.isLoggedIn){
                alert("Login first !")
                window.location.href = "login.html"
                return;
            }
            const nameDisplay = document.getElementById("displayName")
            if (nameDisplay) nameDisplay.textContent = data.username
        } catch(err) {
            console.error("Auth check error:", err)
            window.location.href = "login.html"
        }
    })