import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { mensagemDeErro } from '../api'
import { useAuth } from '../auth'

export default function Login() {
  const { usuario, entrar } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to="/" replace />

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await entrar(email, senha)
    } catch (err) {
      setErro(mensagemDeErro(err))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <form className="cartao" onSubmit={enviar}>
        <h1>Boas Práticas</h1>
        <p className="suave">Entre com seu e-mail corporativo.</p>
        <label>
          E-mail
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Senha
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </label>
        {erro && <p className="erro">{erro}</p>}
        <button className="primario" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </div>
  )
}
