# FitLog MVP

PT샵·피트니스센터용 회원관리 및 운동일지 서비스의 초기 골격입니다.

## 시작하기

```bash
npm install
Copy-Item .env.example .env
npx prisma migrate dev --name init
npm run dev
```

PostgreSQL이 필요합니다. `DATABASE_URL`을 운영 환경에 맞게 설정하세요.

## Phase 2 데이터 모델

`prisma/schema.prisma`에 사용자/트레이너, 회원/이용권, 운동/별칭, 운동일지/운동/세트 모델을 정의했습니다.

- 운동 세트의 중량·반복·시간·거리는 모두 선택값입니다. 원문에 없는 숫자를 채우지 않기 위한 설계입니다.
- `ExerciseRecord.exerciseName`은 원문/수동 입력 보존용이며, 매칭된 표준 운동은 선택적 `exerciseId`로 연결합니다.
- 운동일지와 세트는 소유 레코드 삭제 시 함께 삭제됩니다.
