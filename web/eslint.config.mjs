import nextConfig from 'eslint-config-next'
import prettierPlugin from 'eslint-plugin-prettier/recommended'
import reactCompiler from 'eslint-plugin-react-compiler'

const config = [
  ...nextConfig,
  prettierPlugin,
  {
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
      'react-hooks/exhaustive-deps': 0,
      '@next/next/no-img-element': 0,
    },
  },
]

export default config
