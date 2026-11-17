const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", async function(){
    try{
        const response = await fetch("http://localhost:3000/logout", {
            method: "POST",
            headers: {"Content-Type": "application/json"}
        });
        const result = await response.json();
        if (response.ok && result.success){
            alert(result.message)
            window.location.href = "login.html";
        } else {
            alert(result.message)
        }
    } catch(error){
        console.error("Logout Error:", error);
        alert("Something went wrong")
    }
})