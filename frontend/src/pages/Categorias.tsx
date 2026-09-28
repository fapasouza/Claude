import { useEffect, useState, type FormEvent } from 'react'
import { api, mensagemDeErro, type Categoria } from '../api'

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')

  const carregar = () => api<Categoria[]>('/categorias').then(setCategorias).catch((e) => setErro(mensagemDeErro(e)))

  useEffect(() => {
    carregar()
  }, [])

  async function criar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    try {
      await api('/categorias', { metodo: 'POST', corpo: { nome, descricao: descricao || null } })
      setNome('')
      setDescricao('')
      carregar()
    } catch (err) {
      setErro(mensagemDeErro(err))
    }
  }

  async function alternarAtivo(c: Categoria) {
    try {
      await api(`/categorias/${c.id}`, { metodo: 'PUT', corpo: { ativo: !c.ativo } })
      carregar()
    } catch (err) {
      setErro(mensagemDeErro(err))
    }
  }

  return (
    <>
      <header className="cabecalho"><h1>Categorias</h1></header>
      <form className="cartao linha" onSubmit={criar}>
        <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} minLength={2} maxLength={100} required />
        <input placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={500} />
        <button className="primario">Adicionar</button>
      </form>
      {erro && <p className="erro">{erro}</p>}
      <table className="tabela">
        <thead>
          <tr><th>Nome</th><th>Descrição</th><th>Publicadas</th><th>Situação</th><th /></tr>
        </thead>
        <tbody>
          {categorias.map((c) => (
            <tr key={c.id}>
              <td>{c.nome}</td>
              <td>{c.descricao}</td>
              <td>{c.totalPublicadas}</td>
              <td>{c.ativo ? 'Ativa' : 'Inativa'}</td>
              <td><button className="link" onClick={() => alternarAtivo(c)}>{c.ativo ? 'Desativar' : 'Ativar'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
