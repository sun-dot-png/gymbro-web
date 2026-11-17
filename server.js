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
app.post("/register", (req, res) => {
    const {username, password, confirmPassword} = req.body;
    if(!username || !password || !confirmPassword){
        return res.status(400).json({
            success: false,
            message: "Fill in all fields"
        })
    }
    if (password !== confirmPassword) {
        return res.status(400).json({
            success:false,
            message: "Password not match"
        })
    }
    const query = "INSERT INTO users (username, password) VALUES (?, ?)"
    pool.query(query, [username, password], (err, results) => {
        if(err){
            if (err.code === "ER_DUP_ENTRY"){
                return res.status(409).json({
                success: false,
                message: "username already exists"
            });
        }
        console.error("Database error:", err)
            return res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        }
        res.status(201).json({
            success: true,
            message: "Resgister Successful"
        });
    })
})

//#Login
app.post("/login", (req, res) => {
    const {username, password} = req.body;
    if (!username || !password){
        return res.status(400).json({
            success: false,
            message: "Provide both username and password"
        });
    }

    const query = "SELECT * FROM users WHERE username = ? AND password = ?";
    pool.query(query, [username, password], (err, results) => {
        if(err){
            return res.status(500).json({
                success: false, 
                message: "Internal Server Error"
            })
        }
        if (results.length > 0){
            req.session.user = {
                id: results[0].id,
                username: results[0].username
            };
            res.json({
                success: true,
                message: "Login Successful"
            });
        } else {
            res.json({
                success: false,
                message: "Login Failed - Incorrect Username or Password"
            });
        }
    });
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
app.post("/api/bmi", requireAuth, async(req, res) => {
    try {
        const w = parseFloat(req.body.weight), h = parseFloat(req.body.height);
    if (!(w > 0) || !(h > 0) || h > 3){
        return res.status(401).json({
            success: false,
            message: "Enter Number Only"
        })
    }
    const bmi = (w / (h * h)).toFixed(1);
    await db.query("INSERT INTO bmi_history (user_id, bmi) VALUES (?, ?)", [req.session.user.id, bmi])
    res.status(201).json({
        success: true,
        bmi
    })
    } catch(err){
        console.error(err)
        res.status(500).json({success: false, message: err.message})
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port:http://localhost:${PORT}`);
});
