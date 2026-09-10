# 국정감사 DB 독립 사이트 이전 가이드

목표: 공유 링크에서 `soonryu74`를 없애기 — `soonryu74.github.io/gukgam.html`
→ `<조직명>.github.io/gukgam.html`

**부동산 사이트는 건드리지 않습니다.** 리포 전체를 옮기면 부동산 주소까지 바뀌므로,
국정감사 부분만 새 조직 리포로 분리합니다.

## 1단계 — GitHub 조직 만들기 (무료, 2분)

1. https://github.com/account/organizations/new 접속
2. **Free** 요금제 선택
3. 조직 이름(Organization name) 입력 — 이게 곧 주소가 됩니다
   - 예: `gukgam-db` → `gukgam-db.github.io`
   - 예: `gukgam-lab`, `audit-db`, `nabo-gukgam`
   - 소문자·숫자·하이픈만, 이미 쓰는 이름이면 거부됩니다
4. 연락 이메일 입력 후 생성 (팀원 초대는 건너뛰어도 됨)

## 2단계 — 빈 저장소 만들기 (1분)

1. 만든 조직 페이지에서 **New repository**
2. Repository name: **조직명과 똑같이 + `.github.io`**
   - 조직이 `gukgam-db`라면 저장소 이름은 정확히 `gukgam-db.github.io`
3. **Public** 선택 (Private은 무료 플랜에서 Pages 사용 불가)
4. README·라이선스 등 **아무것도 체크하지 말고** Create repository

## 3단계 — 내용 채우기

저장소를 만든 뒤 **조직명을 알려주시면** 파일 업로드·워크플로 설정을 대신 처리합니다.
직접 하실 경우:

```bash
bash scripts/gukgam/export_standalone.sh ../gukgam-standalone
cd ../gukgam-standalone
git init && git add -A && git commit -m "국정감사 자료 DB"
git branch -M main
git remote add origin https://github.com/<조직명>/<조직명>.github.io.git
git push -u origin main
```

## 4단계 — GitHub Pages 켜기

새 저장소 → Settings → Pages → Source: **Deploy from a branch**,
Branch: **main / (root)** → Save. 1~2분 뒤 `https://<조직명>.github.io` 접속 가능.

## 5단계 — 자동 갱신용 인증키 등록

새 저장소 → Settings → Secrets and variables → Actions → New repository secret
- Name: `ASSEMBLY_API_KEY`
- Secret: 열린국회정보 인증키

이후 매주(국감 시즌 9~12월은 매일) 자동으로 데이터가 갱신됩니다.

## 6단계 — 기존 주소 정리 (선택)

기존 `soonryu74.github.io/gukgam*.html` 은 그대로 둬도 되고,
새 주소로 자동 이동시키려면 각 파일을 리다이렉트 페이지로 교체하면 됩니다(요청 시 처리).

## 참고

- 조직 생성·저장소 모두 **무료**이며, 나중에 커스텀 도메인(예: `gukgam.kr`)을
  붙이고 싶어지면 이 저장소에 CNAME만 추가하면 됩니다.
- 조직 이름은 나중에 바꿀 수 있지만 주소가 함께 바뀌므로 처음에 신중히 정하세요.

---

## 새 세션에서 조직 저장소로 옮기기 (실행 절차)

조직 `gukgam-db`, 저장소 `gukgam-db.github.io` 가 이미 만들어져 있다는 전제.

### 1) 새 Claude Code 세션 시작
claude.ai/code → 새 세션 → 저장소로 **`gukgam-db/gukgam-db.github.io`** 선택.
목록에 안 보이면 GitHub 연결 화면에서 조직 `gukgam-db` 접근을 허용한 뒤 다시 선택.

### 2) 새 세션에 아래 지시문을 그대로 붙여넣기

```
이 저장소는 국정감사 자료 DB를 서비스할 GitHub Pages 사이트다. 아래를 수행해라.

1. 공개 저장소 https://github.com/soonryu74/soonryu74.github.io 를 /tmp/src 로 clone.
2. bash /tmp/src/scripts/gukgam/export_standalone.sh /tmp/bundle 실행.
3. /tmp/bundle 의 내용 전부를 이 저장소 루트에 복사하고 main 브랜치로 커밋·푸시.
   (.nojekyll, index.html, gukgam*.html, data/gukgam/, scripts/gukgam/,
    .github/workflows/gukgam.yml, README.md 포함)
4. 푸시 후 Settings → Pages 에서 "Deploy from a branch / main / (root)" 로
   설정해야 한다는 안내와, Settings → Secrets and variables → Actions 에
   ASSEMBLY_API_KEY 를 등록해야 자동 갱신이 돈다는 안내를 알려줘라.
```

### 3) 푸시 후 저장소 설정 (사람이 직접)
- **Settings → Pages** → Source: `Deploy from a branch`, Branch: `main` / `/(root)` → Save
- **Settings → Secrets and variables → Actions → New repository secret**
  - Name: `ASSEMBLY_API_KEY`
  - Secret: 열린국회정보 인증키
- 몇 분 뒤 **https://gukgam-db.github.io/** 접속 확인

### 4) 기존 사이트
`soonryu74.github.io` 의 부동산 사이트와 국감 페이지는 그대로 둔다.
양쪽이 각자 워크플로로 갱신되며, 원본 저장소가 계속 기준(master copy)이다.
