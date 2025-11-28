// jest.config.js

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // 테스트 환경으로 node를 사용합니다.
  testEnvironment: 'node',
  // TypeScript 파일을 Jest가 이해하도록 변환합니다.
  preset: 'ts-jest',
  // 테스트할 파일의 패턴을 정의합니다. (.test.ts 파일)
  testMatch: ['**/test/**/*.test.ts'],
  // Jest가 무시할 폴더를 정의합니다. (빌드 결과 폴더 등)
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  // 테스트 실행 전 전역 설정을 위한 파일을 지정합니다. (필요시 사용)
  // setupFilesAfterEnv: ['<rootDir>/setupTests.ts'], 
};