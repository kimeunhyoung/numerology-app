const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname)));

const SECRET = "my-secret-key";
let CURRENT_PASSWORD = "code7777"; 

// 일회용 키를 임시로 저장할 공간입니다.
let oneTimeKeys = new Set();

// 1. 일회용 초대 링크 생성 주소
app.get("/create-invite", (req, res) => {
    const inviteKey = Math.random().toString(36).substring(2, 10); // 랜덤 키 생성
    oneTimeKeys.add(inviteKey); // 서버 메모리에 저장
    
    // 10분 뒤에 이 키는 자동으로 무효화됩니다.
    setTimeout(() => oneTimeKeys.delete(inviteKey), 10 * 60 * 1000);
    
    // 친구에게 보여줄 QR용 주소입니다.
    const inviteLink = `http://localhost:3000?key=${inviteKey}`;
    
    res.json({ success: true, inviteLink: inviteLink });
});

// 2. 메인 페이지 접속 시 일회용 키 검사 로직
app.get("/", (req, res) => {
    const userKey = req.query.key;
    
    if (oneTimeKeys.has(userKey)) {
        oneTimeKeys.delete(userKey); // 접속 즉시 키 삭제 (재사용 방지)
        res.sendFile(path.join(__dirname, "index.html"));
    } else {
        res.status(403).send("<h1>❌ 만료되었거나 권한이 없는 링크입니다.</h1>");
    }
});

// 기존 로그인 로직 유지
app.post("/login", (req, res) => {
    const { password } = req.body;
    if (password === CURRENT_PASSWORD) {
        const token = jwt.sign({ auth: true }, SECRET, { expiresIn: "1d" });
        return res.json({ token });
    }
    res.status(401).send("Unauthorized");
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 활성화되었습니다!`);
    console.log(`링크 생성은 http://localhost:${PORT}/create-invite 로 접속하세요.`);
});