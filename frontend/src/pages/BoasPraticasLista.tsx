import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { api, formatarData, mensagemDeErro, STATUS_ROTULO, type BoaPratica, type Categoria, type Pagina, type Status } from '../api'
import StatusBadge from '../components/StatusBadge'

interface Props {
  minhas?: boolean
  status?: Status
}

const TITULOS = { publicadas: 'Boas práticas publicadas', minhas: 'Minhas práticas', revisao: 'Aguardando revisão' }

export default function BoasPraticasLista({ minhas = false, status }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [busca, setBusca] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('')
  const [pagina, setPagina] = useState(1)
  const [dados, setDados] = useState<Pagina<BoaPratica> | null>(null)
  const [erro, setErro] = useState('')

  // A tela "Publicadas" mostra só publicadas; "Minhas" permite filtrar por qualquer status.
  const statusEfetivo = status ?? (minhas ? filtroStatus : 'PUBLICADA')
  const titulo = status ? TITULOS.revisao : minhas ? TITULOS.minhas : TITULOS.publicadas

  // Qualquer mudança de filtro volta para a primeira página.
  const filtrar = (definir: (valor: string) => void) => (e: { target: { value: string } }) => {
    definir(e.target.value)
    setPagina(1)
  }

  useEffect(() => {
    api<Categoria[]>('/categorias?ativas=true').then(setCategorias).catch(() => setCategorias([]))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams({ pagina: String(pagina), porPagina: '20' })
    if (busca.trim()) params.set('busca', busca.trim())
    if (categoriaId) params.set('categoriaId', categoriaId)
    if (statusEfetivo) params.set('status', statusEfetivo)
    if (minhas) params.set('minhas', 'true')

    const temporizador = setTimeout(() => {
      api<Pagina<BoaPratica>>(`/boas-praticas?${params}`)
        .then((d) => {
          setDados(d)
          setErro('')
        })
        .catch((e) => setErro(mensagemDeErro(e)))
    }, 250)
    return () => clearTimeout(temporizador)
  }, [minhas, statusEfetivo, busca, categoriaId, pagina])

  const totalPaginas = dados ? Math.max(1, Math.ceil(dados.total / dados.porPagina)) : 1

  return (
    <>
      <header className="cabecalho">
        <h1>{titulo}</h1>
        <Link className="botao primario" to="/boas-praticas/nova">Nova prática</Link>
      </header>

      <div className="filtros">
        <input placeholder="Buscar por título ou resumo…" value={busca} onChange={filtrar(setBusca)} />
        <select value={categoriaId} onChange={filtrar(setCategoriaId)}>
          <option value="">Todas as categorias</option>
          {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        {minhas && (
          <select value={filtroStatus} onChange={filtrar(setFiltroStatus)}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_ROTULO).map(([valor, rotulo]) => <option key={valor} value={valor}>{rotulo}</option>)}
          </select>
        )}
      </div>

      {erro && <p className="erro">{erro}</p>}
      {dados && dados.itens.length === 0 && <p className="vazio">Nenhuma boa prática encontrada.</p>}

      <ul className="lista">
        {dados?.itens.map((bp) => (
          <li key={bp.id} className="cartao item">
            <div className="item-topo">
              <Link to={`/boas-praticas/${bp.id}`} className="item-titulo">{bp.titulo}</Link>
              <StatusBadge status={bp.status} />
            </div>
            <p>{bp.resumo}</p>
            <small className="suave">
              {bp.categoria.nome} · por {bp.autor.nome} · atualizada em {formatarData(bp.atualizadoEm)}
            </small>
          </li>
        ))}
      </ul>

      {dados && totalPaginas > 1 && (
        <div className="paginacao">
          <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span>Página {pagina} de {totalPaginas}</span>
          <button disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>Próxima</button>
        </div>
      )}
    </>
  )
}
