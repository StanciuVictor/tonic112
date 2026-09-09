import type { Config } from 'jest';

const config: Config = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  // class-transformer's @Type() decorator needs Reflect.getMetadata, which
  // only exists once this polyfill is loaded. The running app gets it as a
  // side effect of importing @nestjs/common; a spec that only imports
  // class-transformer/class-validator directly (e.g. a DTO validation test)
  // never does, so it must be loaded explicitly here.
  setupFiles: ['reflect-metadata'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
};

export default config;
