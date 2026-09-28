import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api, mensagemDeErro, type BoaPratica, type BoaPraticaDetalhe, type Categoria } from '../api'

export default function BoaPraticaForm() {
  const { id } = useParams()
  const navegar = useNavigate()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [form, setForm] = useState({ titulo: '', resumo: '', conteudo: '', categoriaId: '' })
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    api<Categoria[]>('/categorias?ativas=true').then(setCategorias).catch((e) => setErro(mensagemDeErro(e)))
    if (id) {
      api<BoaPraticaDetalhe>(`/boas-praticas/${id}`)
        .then((bp) => setForm({ titulo: bp.titulo, resumo: bp.resumo, conteudo: bp.conteudo, categoriaId: String(bp.categoriaId) }))
        .catch((e) => setErro(mensagemDeErro(e)))
    }
  }, [id])

  const alterar = (campo: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm({ ...form, [campo]: e.target.value })

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    try {
      const corpo = { ...form, categoriaId: Number(form.categoriaId) }
      const salva = id
        ? await api<BoaPratica>(`/boas-praticas/${id}`, { metodo: 'PUT', corpo })
        : await api<BoaPratica>('/boas-praticas', { metodo: 'POST', corpo })
      navegar(`/boas-praticas/${salva.id}`)
    } catch (err) {
      setErro(mensagemDeErro(err))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <header className="cabecalho">
        <h1>{id ? 'Editar boa prática' : 'Nova boa prática'}</h1>
      </header>
      <form className="cartao formulario" onSubmit={salvar}>
        <label>
          Título
          <input value={form.titulo} onChange={alterar('titulo')} minLength={5} maxLength={200} required />
        </label>
        <label>
          Categoria
          <select value={form.categoriaId} onChange={alterar('categoriaId')} required>
            <option value="">Selecione…</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </label>
        <label>
          Resumo
          <textarea rows={2} value={form.resumo} onChange={alterar('resumo')} minLength={10} maxLength={500} required />
        </label>
        <label>
          Descrição completa
          <textarea rows={12} value={form.conteudo} onChange={alterar('conteudo')} minLength={20} required />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <div className="botoes">
          <button className="primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar rascunho'}</button>
          <button type="button" onClick={() => navegar(-1)}>Cancelar</button>
        </div>
        {!id && <p className="suave">A prática é salva como rascunho. Depois, envie para revisão na tela de detalhes.</p>}
      </form>
    </>
  )
}
