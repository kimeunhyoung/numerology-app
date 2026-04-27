require("dotenv").config();
const { resolveAppBaseUrl } = require("./resolve-base-url");
const app = require("./app");

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
    let logBase = resolveAppBaseUrl();
    if (!process.env.APP_BASE_URL && /localhost:3000/.test(logBase) && PORT !== 3000) {
        logBase = `http://localhost:${PORT}`;
    }
    console.log(`서버 실행 중 - 포트 ${PORT}`);
    if (!process.env.JWT_SECRET) {
        console.warn("경고: JWT_SECRET이 설정되지 않아 개발용 기본값을 사용 중입니다.");
    }
    console.log(`QR 생성: ${logBase}/create-invite`);
});
