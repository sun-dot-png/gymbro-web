const loginForm = document.getElementById("loginForm")
if (loginForm){
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById("username").value
        const passwordInput = document.getElementById("password").value

        try {
            const response = await fetch("/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    username: usernameInput,
                    password: passwordInput
                })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                alert("Login successful!");
                window.location.href = "index.html";
            } else {
                alert(data.message || "Username or Password incorrect")
            }
        } catch (err){
            console.error("Connection error:", err)
            alert("Something went wrong")
        }
    });
}