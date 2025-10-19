import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    ignores: [
      'dist/',
      'coverage/',
      'node_modules/',
      '__spec__/'
    ]
  }
]

