import { useEffect, useState, type FormEvent } from 'react'
import { api, mensagemDeErro, type Perfil, type Usuario } from '../api'
import { useAuth } from '../auth'

const PERFIS: Perfil[] = ['COLABORADOR', 'GESTOR', 'ADMIN']

export default function Usuarios() {
  const { usuario: eu } = useAuth()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'COLABORADOR' as Perfil })
  const [erro, setErro] = useState('')

  const carregar = () => api<Usuario[]>('/usuarios').then(setUsuarios).catch((e) => setErro(mensagemDeErro(e)))

  useEffect(() => {
    carregar()
  }, [])

  async function criar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    try {
      await api('/usuarios', { metodo: 'POST', corpo: form })
      setForm({ nome: '', email: '', senha: '', perfil: 'COLABORADOR' })
      carregar()
    } catch (err) {
      setErro(mensagemDeErro(err))
    }
  }

  async function atualizar(u: Usuario, dados: Partial<Usuario>) {
    setErro('')
    try {
      await api(`/usuarios/${u.id}`, { metodo: 'PUT', corpo: dados })
      carregar()
    } catch (err) {
      setErro(mensagemDeErro(err))
    }
  }

  return (
    <>
      <header className="cabecalho"><h1>Usuários</h1></header>
      <form className="cartao linha" onSubmit={criar}>
        <input placeholder="Nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} minLength={3} required />
        <input placeholder="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Senha inicial" type="password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} minLength={8} required />
        <select value={form.perfil} onChange={(e) => setForm({ ...form, perfil: e.target.value as Perfil })}>
          {PERFIS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button className="primario">Adicionar</button>
      </form>
      {erro && <p className="erro">{erro}</p>}
      <table className="tabela">
        <thead>
          <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th /></tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nome}</td>
              <td>{u.email}</td>
              <td>
                <select value={u.perfil} disabled={u.id === eu?.id} onChange={(e) => atualizar(u, { perfil: e.target.value as Perfil })}>
                  {PERFIS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </td>
              <td>{u.ativo ? 'Ativo' : 'Inativo'}</td>
              <td>
                {u.id !== eu?.id && (
                  <button className="link" onClick={() => atualizar(u, { ativo: !u.ativo })}>{u.ativo ? 'Desativar' : 'Ativar'}</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
