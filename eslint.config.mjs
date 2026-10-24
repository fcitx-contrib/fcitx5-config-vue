import antfu from '@antfu/eslint-config'

export default antfu({
}, {
  files: ['pnpm-workspace.yaml'],
  rules: {
    // pnpm adds spaces when it updates release-age exclusions.
    'yaml/flow-sequence-bracket-spacing': ['error', 'always'],
  },
})
