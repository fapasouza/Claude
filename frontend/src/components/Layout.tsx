import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { ehModerador, useAuth } from '../auth'

const PERFIL_ROTULO = { ADMIN: 'Administrador', GESTOR: 'Gestor', COLABORADOR: 'Colaborador' }

export default function Layout({ children }: { children: ReactNode }) {
  const { usuario, sair } = useAuth()
  if (!usuario) return null

  return (
    <div className="app">
      <aside className="menu">
        <div className="marca">Boas Práticas</div>
        <nav>
          <NavLink to="/" end>Publicadas</NavLink>
          <NavLink to="/minhas">Minhas práticas</NavLink>
          <NavLink to="/boas-praticas/nova">Nova prática</NavLink>
          {ehModerador(usuario) && (
            <>
              <span className="menu-secao">Gestão</span>
              <NavLink to="/revisao">Aguardando revisão</NavLink>
              <NavLink to="/categorias">Categorias</NavLink>
            </>
          )}
          {usuario.perfil === 'ADMIN' && <NavLink to="/usuarios">Usuários</NavLink>}
        </nav>
        <div className="menu-usuario">
          <strong>{usuario.nome}</strong>
          <small>{PERFIL_ROTULO[usuario.perfil]}</small>
          <button className="link" onClick={sair}>Sair</button>
        </div>
      </aside>
      <main className="conteudo">{children}</main>
    </div>
  )
}
