// 빌드 산출물(단일 HTML)을 health-dashboard/index.html 로 복사
import { copyFileSync, statSync } from "node:fs";
copyFileSync("dist/index.html", "../index.html");
console.log("복사: ../index.html (" + statSync("../index.html").size.toLocaleString() + " bytes)");
