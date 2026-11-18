const openModal = (id) => bootstrap.Modal.getOrCreateInstance(document.getElementById(id)).show()
let currentGoal = ""

async function loadGoal(params) {
    try{
        const res = await fetch("/api/profile/goal", {
            credentials: "include"
        })
        if(!res.ok){
            return;
        }
        const {goal} = await res.json()
        currentGoal = goal || ""
        document.getElementById("goalLabel").textContent = goal || "Not set"
    } catch(err){
        console.error(err)
    }
}
document.getElementById("editGoal").addEventListener("click", () => {
    document.getElementById("newGoal").value = currentGoal
    openModal("goalModal")
})
document.getElementById("goalForm").addEventListener("submit", (e) => {
    e.preventDefault()
    sendUpdate("/api/profile/goal", {
        goal: document.getElementById("newGoal").value}, "goalModal", loadGoal)   
})

async function loadProfile(params) {
    const res = await fetch("/api/profile", {
        credentials: "include"
    })
    if (!res.ok){
        return;
    }
    const {user} = await res.json()
    document.getElementById("profileUsername").textContent = user.username
    document.getElementById("profileEmail").textContent = user.email || "-"
    const nameDisplay = document.getElementById("displayName")
    if(nameDisplay){
        nameDisplay.textContent = user.username
    }
}

async function loadFitness(params) {
    try{
        const res = await fetch("/api/bmi/latest", {
            credentials: "include"
        })
        if(!res.ok){
            return;
        }
        const {latest} = await res.json()
        if(!latest){
            return;
        }
        document.getElementById("fitBmi").textContent = latest.bmi.toFixed(1);
        document.getElementById("fitHeight").textContent = (Number(latest.height) * 100).toFixed(1)
        document.getElementById("fitWeight").textContent = (Number(latest.weight))
        const status = document.getElementById("fitBmiStatus")
        status.textContent = latest.status
        status.className = "bmi-status bmi-" + latest.level        
    } catch(err){
        console.error(err)
    }
}

async function sendUpdate(url, body, modalId, onSuccess = loadProfile) {
    try{
        const res = await fetch(url, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(body)
        })
        const data = await res.json()
        alert(data.message || (res.ok ? "Save" : "Failed"))
        if(res.ok && data.success){
            bootstrap.Modal.getOrCreateInstance(document.getElementById(modalId)).hide()
            document.getElementById(modalId).querySelector("form").reset()
            onSuccess()
        }
    } catch(err){
        console.error(err)
        alert("Something went wrong")
    }   
}

document.getElementById("editUsername").addEventListener("click", () => openModal("usernameModal"))
document.getElementById("editPassword").addEventListener("click", () => openModal("passwordModal"))
document.getElementById("editEmail").addEventListener("click", () => openModal("emailModal"))

document.getElementById("usernameForm").addEventListener("submit", (e) => {
    e.preventDefault();
    sendUpdate("/api/profile/username",
    {username: document.getElementById("newUsername").value}, "usernameModal");
})

document.getElementById("passwordForm").addEventListener("submit", (e) => {
    e.preventDefault();
    sendUpdate("/api/profile/password", {
        currentPassword: document.getElementById("currentPassword").value,
        newPassword: document.getElementById("newPassword").value,
        confirmPassword: document.getElementById("confirmNewPassword").value  
    }, "passwordModal");
})

document.getElementById("emailForm").addEventListener("submit", (e) => {
    e.preventDefault();
    sendUpdate("/api/profile/email", {
        email: document.getElementById("newEmail").value,
        currentPassword: document.getElementById("emailPassword").value
    }, "emailModal");
})

loadProfile();
loadFitness();
loadGoal();
