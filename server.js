require("dotenv").config();
const express = require("express");
const app = express();
const mysql2 = require("mysql2");
const session = require("express-session");
const cors = require("cors")
const path = require("path")
const bcrypt = require("bcrypt")
const requireAuth = (req, res, next) =>
    req.session?.user ? next() : res.status(401).json({
        success: false,
        message: "Not logged in"
    })

app.use(express.json())
app.use(cors())
app.use(express.static(path.join(__dirname, "view")));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 2
    }
  })
);
app.set('trust proxy', 1)

const pool = mysql2.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3307,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "LoginDB",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4"
});

const db = pool.promise()

pool.on('connection', (conn) => conn.query("SET time_zone = '+7:00'"))
async function trackVisior(ip) {
    const now = new Date().toLocaleString('sv-SE', {timeZone: 'Asia/Bangkok'})
    const today = now.slice(0,10)   

    await db.query(
        `INSERT INTO visitors (ip_address, visit_date, first_visit, last_visit)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE last_visit = VALUES(last_visit)`,
     [ip, today, now, now]
    )   
}

async function getTodayCount(){
    const today = new Date().toLocaleDateString('sv-SE', {timeZone: 'Asia/Bangkok'})
    const [rows] = await db.query(
        'SELECT COUNT(*) AS c FROM visitors WHERE visit_date = ?', [today]
    )
    return rows[0].c
}

async function  getTotalCount() {
    const [rows] = await db.query('SELECT COUNT(*) AS c FROM visitors')
    return rows[0].c
}

app.get('/', async (req, res) => {
    try{
        await trackVisior(req.ip)
        const [today, total] = await Promise.all([getTodayCount(), getTotalCount()])
        res.send(`
            <h1>Home</h1>
            <p>Today Visit: ${today}</p>
            <p>Total visit: ${total}</p>`)
    } catch (err){
        console.error(err);
        res.status(500).send('Internal Server Error')
    }
})

pool.getConnection((err, connection) => {
    if(err){
        console.log("Something went worng:", err)
    }else{
        console.log("Connected to DataBase")
        connection.release()
    }
});

//#Register
app.post("/register", async (req, res) => {
    const {username, password, confirmPassword} = req.body;
    const email = (req.body.email || "").trim().toLowerCase()
    if(!username || !email ||!password || !confirmPassword){
        return res.status(400).json({
            success: false,
            message: "Fill in all fields"
        })
    }
    if(!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(401).json("Email's structure wrong")
    }
    if (password !== confirmPassword) {
        return res.status(400).json({
            success:false,
            message: "Password not match"
        })
    }
    if(password.length < 8){
        return res.status(401).json("Password must be at least 8 characters")
    }
    try {
        const hash = await bcrypt.hash(password, 10)
        await db.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [username, email, hash])
        res.status(201).json({success: true, message: "Register Successful"})
    } catch(err){
        if(err.code === "ER_DUP_ENTRY"){
            const field = err.sqlMessage.includes("email") ? "Email" : "Username"
            return res.status(409).json({success: false, message: `${field} already exists`})
        }
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
})

//#Login
app.post("/login", async (req, res) => {
    const {username, password} = req.body;
    if (!username || !password){
        return res.status(400).json({
            success: false,
            message: "Provide both username and password"
        });
    }
    try{
        const [rows] = await db.query("SELECT id, username, password FROM users WHERE username = ?", [username])
        const user = rows[0]
        if (!user || !(await bcrypt.compare(password, user.password))){
            return res.status(401).json({success: false, message: "Login Failed - Incorrect Username or Password"})
        }
        req.session.user = {id: user.id, username: user.username};
        res.json({success: true, message: "Login Successful"})
    } catch(err){
        console.error(err)
        res.status(500).json({success: true, message: "Internal Server Error"})
    }
});

//#Logout
app.post("/logout", (req, res) => {
    req.session.destroy((err) => {
        if(err){
            return res.status(500).json({
                success: false,
                message: "Could not logout"
            })
        }
        res.clearCookie("connect.sid");
        res.json({
            success: true,
            message: "See you soon bro !"
        });
    })
})

//Check login
app.get("/check-auth", (req, res) => {
    if (req.session && req.session.user) {
        return res.json({
            isLoggedIn: true,
            username: req.session.user.username
        })
    } else {
        return res.status(401).json({isLoggedIn: false})
    }
})

//BMI_History
function getBmiStatus(bmi){
        if(bmi < 18.5) return {level: "underweight", status: "Too slim (Malnutrition)"}
        if(bmi < 23.0) return {level: "normal", status: "You cool bro 😎 (Healthy)"}
        if(bmi < 25.0) return {level: "overweight", status: "Overweight"}
        if(bmi < 30.0) return {level: "obese1", status: "Obesity Class 1"}
        return {level: "obese2", status: "Obesity Class 2"}
    }

app.post("/api/bmi", requireAuth, async(req, res) => {
    try {
        const w = parseFloat(req.body.weight), h = parseFloat(req.body.height);
    if (!(w > 0) || !(h > 0) || h > 3){
        return res.status(400).json({
            success: false,
            message: "Enter Number Only"
        })
    }
    const bmi = (w / (h * h)).toFixed(1);
    await db.query("INSERT INTO bmi_history (user_id, bmi, weight, height) VALUES (?, ?, ?, ?)", [req.session.user.id, bmi, w, h])
    res.status(201).json({
        success: true,
        bmi
    })
    } catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
})

app.get("/api/bmi", requireAuth, async (req, res) => {
    try {
        const [rows] = await db.query(
        "SELECT bmi, create_at FROM bmi_history WHERE user_id = ? ORDER BY create_at DESC",
        [req.session.user.id]
    );
    res.json(rows)
    } catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
})

app.get("/api/bmi/latest", requireAuth, async (req, res) => {
    try{
        const [rows] = await db.query(
            "SELECT bmi, weight, height, create_at FROM bmi_history WHERE user_id = ? ORDER BY create_at DESC, id DESC LIMIT 1",
        [req.session.user.id]
    );
    if(rows.length === 0){
        return res.json({success: true, latest: null})
    }
    const bmi = Number(rows[0].bmi)
    const {level, status} = getBmiStatus(bmi)
    res.json({
        success: true,
        latest: {...rows[0], bmi, status, level}
    })
    } catch(err){
        console.error(err)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
})

app.delete("/api/bmi", requireAuth, async(req, res) => {
    try {
        await db.query("DELETE FROM bmi_history WHERE user_id = ?", [req.session.user.id])
    res.json({
        success: true
    })
    } catch(err){
        console.error(err)
        res.status(500).json({success: false, message: "Internal Server Error"})
    }
})

//Profile
app.get("/api/profile", requireAuth, async (req, res) => {
    try{
        const [rows] = await db.query(
            "SELECT id, username, email FROM users WHERE id = ?",
            [req.session.user.id]
        )
        if(rows.length === 0){
            return res.status(404).json({
                success: false,
                message: "User not fo"
            })
        }
        res.status(201).json({
            success: true,
            user: rows[0]
        })
    } catch(err){
        console.error(err)
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
})

//Change Username
app.put("/api/profile/username", requireAuth, async (req, res) => {
    const username = (req.body.username ||  "").trim()
    if (username.length < 3 || username.length > 30){
        return res.status(400).json({
            success: false,
            message: "Username must be 3-30 characters"
        })
    } 
    try{
        await db.query("UPDATE users SET username = ? WHERE id = ?", [username, req.session.user.id])
        req.session.user.username = username
        res.json({
            success: true,
            message: "Username Updated:", username
        })
    }catch(err){
        if(err.code === "ER_DUP_ENTRY"){
            return res.status(409).json({
                success: false,
                message: "Username already exists"
            })
        }
        console.error(err)
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
})

//Change Password
app.put("/api/profile/password", requireAuth, async (req,res) => {
    const {currentPassword, newPassword, confirmPassword} = req.body
    if(!currentPassword || !newPassword || !confirmPassword){
        return res.status(400).json({
            success: false,
            message: "Fill in all fields"
        })
    }
    if(newPassword !== confirmPassword){
        return res.status(400).json({ 
            success: false, 
            message: "Password must be at least 8 characters"
        })
    }
    try{
        const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [req.session.user.id])
        if(rows.length === 0){
            return res.status(404).json({
                success: false, 
                message: "User not found"
            })
        }
        const ok = await bcrypt.compare(currentPassword, rows[0].password)
        if(!ok){
            return res.status(401).json({
                success: false,
                message: "Current password is incorrect"
            })
        }
        const hash = await bcrypt.hash(newPassword, 10)
        await db.query("UPDATE users SET password = ? WHERE id = ?", [hash, req.session.user.id])
        res.json({
            success: true,
            message: "Password Updated"
        })
    } catch(err){
        console.error(err)
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
})

//Change Email
app.put("/api/profile/email", requireAuth, async(req, res) => {
    const email = (req.body.email || "").trim().toLowerCase();
    const {currentPassword} = req.body
    if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
    }
    if(!currentPassword){
        return res.status(400).json({
            success: false,
            message: "Password is required"
        })
    }
    try{
        const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [req.session.user.id])
        const ok = rows.length > 0 && await bcrypt.compare(currentPassword, rows[0].password)
        if (!ok){
            return res.status(401).json({
                success: false,
                message:  "Current password is incorrect"
            })
        }
        await db.query("UPDATE users SET email = ? WHERE id = ?", [email, req.session.user.id])
        res.json({
            success: true,
            message: "Email Updated", emaul
        })
    } catch(err){
        if (err.code === "ER_DUP_ENTRY"){
            return res.status(409).json({
                success: false,
                message: "Email already exists"
            })
        }
        console.error(err)
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
})

//Chande / Edit Goals
app.get("/api/profile/goal", requireAuth, async (req, res) => {
    try{
        const [rows] = await db.query("SELECT goal FROM profiles WHERE user_id = ?", [req.session.user.id])
        res.json({
            success: true,
            goal: rows.length ? rows[0].goal : null
        })
    } catch(err){
        console.error(err)
        res.status(500).json({ success: false, 
            message: "Internal Server Error"
        })
    }
})

app.put("/api/profile/goal", requireAuth, async (req, res) => {
    const goal = String(req.body.goal ?? "").trim()
    if (goal.length < 1 || goal.length > 50){
        return res.status(400).json({
            success: false,
            message: "Must be 1-50 characters"
        })
    }
    try{
        await db.query("INSERT INTO profiles (user_id, goal) VALUES (?, ?) ON DUPLICATE KEY UPDATE goal = VALUES(goal)",
            [req.session.user.id, goal]
        )
        res.json({
            success: true,
            message: "Goal updated", goal
        })
    } catch(err){
        console.error(err)
        res.status(500).json({ success: false, 
            message: "Internal Server Error"})
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port:http://localhost:${PORT}`);
});
