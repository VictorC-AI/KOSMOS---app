import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App.tsx'

// Teste de fumaça: garante que o app monta sem erro e que a infraestrutura de
// testes funciona. Testes de lógica (datas, dinheiro, RLS) vêm nas próximas
// etapas, junto com cada funcionalidade.
describe('App', () => {
  it('mostra o nome do produto', () => {
    const html = renderToStaticMarkup(<App />)
    expect(html).toContain('KOSMOS')
  })
})
