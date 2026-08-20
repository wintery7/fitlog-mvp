# MVP 구현 계획

## 완료: Phase 1

- 기존 애플리케이션 소스와 설정 파일이 없는 새 프로젝트임을 확인했다.
- Next.js App Router, TypeScript strict mode, PostgreSQL, Prisma, Zod를 기준 기술로 정했다.
- 음성 인식(STT)과 운동 데이터 파서는 별도 인터페이스로 두어 Web Speech API 및 외부 STT/LLM을 나중에 교체할 수 있게 한다.

## 완료: Phase 2

- Prisma 관계형 스키마와 PostgreSQL 연결 환경 예시를 추가했다.
- 회원, 트레이너, 이용권, 운동/별칭, 운동일지, 운동 기록, 세트 기록을 구현했다.

## 다음 단계: Phase 3

1. Prisma migration을 적용하고 기본 운동/별칭 seed를 추가한다.
2. 회원 목록, 검색, 등록·상세 화면 및 API를 만든다.
3. 역할 기반 접근 제어의 인증 어댑터를 연결한다.
