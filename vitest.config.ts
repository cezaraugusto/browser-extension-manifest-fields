import {defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['__spec__/**/*.spec.ts']
  }
})
