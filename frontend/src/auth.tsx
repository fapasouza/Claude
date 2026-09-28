import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, tokenStorage, type Usuario } from './api'

interface AuthContexto {
  usuario: Usuario | null
  carregando: boolean
  entrar: (email: string, senha: string) => Promise<void>
  sair: () => void
}

const Contexto = createContext<AuthContexto | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(Boolean(tokenStorage.obter()))

  useEffect(() => {
    if (!tokenStorage.obter()) return
    api<Usuario>('/auth/me')
      .then(setUsuario)
      .catch(() => tokenStorage.limpar())
      .finally(() => setCarregando(false))
  }, [])

  async function entrar(email: string, senha: string) {
    const resposta = await api<{ token: string; usuario: Usuario }>('/auth/login', {
      metodo: 'POST',
      corpo: { email, senha },
    })
    tokenStorage.salvar(resposta.token)
    setUsuario(resposta.usuario)
  }

  function sair() {
    tokenStorage.limpar()
    setUsuario(null)
  }

  return <Contexto.Provider value={{ usuario, carregando, entrar, sair }}>{children}</Contexto.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const contexto = useContext(Contexto)
  if (!contexto) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return contexto
}

// eslint-disable-next-line react-refresh/only-export-components
export const ehModerador = (u: Usuario | null) => u?.perfil === 'ADMIN' || u?.perfil === 'GESTOR'
