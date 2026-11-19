import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { MARCA } from './src/marca.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // o <title> vem de src/marca.ts, para o nome existir num lugar só
    { name: 'marca', transformIndexHtml: (html) => html.replace('{{nome}}', MARCA.nome) },
  ],
  test: {
    // Dois grupos de testes:
    // - unit: rápidos, sem banco; rodam com `npm test`
    // - db: precisam de um Postgres com as migrações; rodam com `npm run test:db`
    projects: [
      {
        extends: true,
        test: { name: 'unit', include: ['src/**/*.test.{ts,tsx}'] },
      },
      {
        extends: true,
        test: {
          name: 'db',
          include: ['supabase/tests/**/*.test.ts'],
          environment: 'node',
          // um arquivo por vez: os testes do banco não devem disputar a conexão
          fileParallelism: false,
        },
      },
    ],
  },
})
