import { MARCA } from './marca.ts'

export default function App() {
  return (
    <main className="grid min-h-dvh place-content-center gap-2 p-4 text-center">
      <h1 className="text-3xl font-bold tracking-tight">{MARCA.nome}</h1>
      <p className="text-muted">{MARCA.slogan}</p>
    </main>
  )
}
