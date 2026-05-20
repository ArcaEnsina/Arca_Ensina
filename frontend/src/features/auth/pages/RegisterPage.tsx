import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { useAuth } from '../AuthContext'
import { registerSchema, type RegisterInput } from '../schemas'
import type { ApiErrorResponse, Profile } from '../types'

const PROFILES: ReadonlyArray<{ value: Profile; label: string }> = [
  { value: 'medico', label: 'Médico' },
  { value: 'admin', label: 'Admin' },
  { value: 'pesquisador', label: 'Pesquisador' },
]

export default function RegisterPage() {
  const [serverError, setServerError] = useState('')
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { profile: 'medico' },
  })

  const onSubmit = async (data: RegisterInput) => {
    setServerError('')
    try {
      await registerUser(data.username, data.email, data.password, data.profile)
      navigate('/dashboard')
    } catch (err) {
      const fallback = 'Erro ao registrar. Tente novamente.'
      if (err instanceof AxiosError && err.response?.data && typeof err.response.data === 'object') {
        const body = err.response.data as ApiErrorResponse
        const details = body.error?.details
        if (details && typeof details === 'object') {
          const messages = Object.entries(details)
            .map(([field, msgs]) => {
              const list = Array.isArray(msgs) ? msgs : [msgs]
              return `${field}: ${list.join(', ')}`
            })
            .join('; ')
          setServerError(messages || fallback)
        } else {
          setServerError(body.error?.message ?? fallback)
        }
      } else {
        setServerError(fallback)
      }
    }
  }

  return (
    <div className="auth-container">
      <h1>Cadastro</h1>
      {serverError && <div className="error-message">{serverError}</div>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="username">Usuário</label>
          <input
            id="username"
            type="text"
            {...register('username')}
            autoComplete="username"
          />
          {errors.username && (
            <span className="field-error">{errors.username.message}</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            autoComplete="email"
          />
          {errors.email && (
            <span className="field-error">{errors.email.message}</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            autoComplete="new-password"
          />
          {errors.password && (
            <span className="field-error">{errors.password.message}</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="profile">Perfil profissional</label>
          <select id="profile" {...register('profile')}>
            {PROFILES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {errors.profile && (
            <span className="field-error">{errors.profile.message}</span>
          )}
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </form>
      <p className="link-text">
        Já tem conta? <Link to="/login">Entrar</Link>
      </p>
    </div>
  )
}
