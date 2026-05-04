import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PROFILES = [
  { value: 'medico', label: 'Médico' },
  { value: 'admin', label: 'Admin' },
  { value: 'pesquisador', label: 'Pesquisador' },
]

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profile, setProfile] = useState('medico')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await register(username, email, password, profile)
      navigate('/dashboard')
    } catch (err) {
      const data = err.response?.data
      // DRF returns field errors as { field: [messages] }
      if (data && typeof data === 'object') {
        const messages = Object.entries(data)
          .map(([field, msgs]) => {
            const list = Array.isArray(msgs) ? msgs : [msgs]
            return `${field}: ${list.join(', ')}`
          })
          .join('; ')
        setError(messages || 'Erro ao registrar. Tente novamente.')
      } else {
        setError('Erro ao registrar. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-container">
      <h1>Cadastro</h1>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
          />
        </div>
        <div className="form-group">
          <label htmlFor="profile">Perfil profissional</label>
          <select
            id="profile"
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            required
          >
            {PROFILES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
      <p className="link-text">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  )
}
