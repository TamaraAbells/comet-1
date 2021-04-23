import { defineConfig } from 'vite'
import reactRefresh from '@vitejs/plugin-react-refresh'
import { resolve } from 'path'
import stringHash from 'string-hash'
import postcss from './postcss.config.js'

export default defineConfig(({ command }) => ({
  base: process.env.ELECTRON === 'true' ? './' : '/',
  plugins: [reactRefresh()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '/src'),
      'tailwind.config.js': resolve(__dirname, 'tailwind.config.js')
    }
  },
  server: {
    port: process.env.PORT ? +process.env.PORT : 3000
  },
  optimizeDeps: {
    exclude: ['path'],
    include: ['tailwind.config.js']
  },
  css: {
    postcss,
    modules: {
      localsConvention: 'camelCaseOnly',
      generateScopedName: (name, filename, css) => {
        if (name === 'dark') return 'dark'
        const i = css.indexOf(`.${name}`)
        const lineNumber = css.substr(0, i).split(/[\r\n]/).length
        const hash = stringHash(css).toString(36).substr(0, 5)

        return `_${name}_${hash}_${lineNumber}`
      }
    }
  },
  esbuild: {
    jsxInject: `import React from 'react'`
  }
}))
