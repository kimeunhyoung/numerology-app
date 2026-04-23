const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");
const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

const SECRET = "x9k#mP2$qL8vN5@rT3wZ";  // 변경
let CURRENT_PASSWORD = "888";  // 여기서 비번 변경

// 일회용 키를 임시로 저장할 공간
let oneTimeKeys = new Set();

// 1. 일회용 초대 링크 생성
app.get("/create-invite", (req, res) => {
    const inviteKey = Math.random().toString(36).substring(2, 10);
    oneTimeKeys.add(inviteKey);
    setTimeout(() => oneTimeKeys.delete(inviteKey), 10 * 60 * 1000);
    const inviteLink = `https://numerology-app-w6rq.onrender.com?key=${inviteKey}`;
    res.json({ success: true, inviteLink: inviteLink });
});

// 2. 메인 페이지 접속 시 일회용 키 검사
app.get("/", (req, res) => {
    const userKey = req.query.key;
    if (oneTimeKeys.has(userKey)) {
        oneTimeKeys.delete(userKey);
        res.sendFile(path.join(__dirname, "index.html"));
    } else {
        res.status(403).send("<h1>❌ 만료되었거나 권한이 없는 링크입니다.</h1>");
    }
});

// 3. 로그인
app.post("/login", (req, res) => {
    const { password } = req.body;
    if (password === CURRENT_PASSWORD) {
        const token = jwt.sign({ auth: true }, SECRET, { expiresIn: "1h" });  // 1시간으로 변경
        return res.json({ token });
    }
    res.status(401).send("Unauthorized");
});

// 4. 토큰 유효성 검사 (추가)
app.get("/check-auth", (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("Unauthorized");
    try {
        jwt.verify(token, SECRET);
        res.json({ valid: true });
    } catch (e) {
        res.status(401).send("Unauthorized");
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 활성화되었습니다!`);
    console.log(`링크 생성은 http://localhost:${PORT}/create-invite 로 접속하세요.`);
});