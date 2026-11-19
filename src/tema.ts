// Preferência de tema guardada no navegador. 'system' segue o aparelho.
// shortcut: não sincroniza com profiles.theme ainda; ligar quando houver tela de preferências.
export type PreferenciaTema = 'system' | 'dark' | 'light'

const CHAVE = 'kosmos.tema'

export function lerTema(): PreferenciaTema {
  try {
    const v = localStorage.getItem(CHAVE)
    if (v === 'dark' || v === 'light') return v
  } catch {
    // navegador sem localStorage (aba privada): segue o sistema
  }
  return 'system'
}

export function aplicarTema(pref: PreferenciaTema): void {
  const claro =
    pref === 'light' || (pref === 'system' && matchMedia('(prefers-color-scheme: light)').matches)
  document.documentElement.dataset.theme = claro ? 'light' : 'dark'
  try {
    if (pref === 'system') localStorage.removeItem(CHAVE)
    else localStorage.setItem(CHAVE, pref)
  } catch {
    // sem localStorage: o tema vale só nesta visita
  }
}
