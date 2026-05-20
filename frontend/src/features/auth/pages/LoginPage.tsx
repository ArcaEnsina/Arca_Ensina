import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AxiosError } from 'axios'
import { useAuth } from '../AuthContext'
import { loginSchema, type LoginInput } from '../schemas'
import type { ApiErrorResponse } from '../types'

export default function LoginPage() {
  const [serverError, setServerError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setServerError('')
    try {
      await login(data.username, data.password)
      navigate('/dashboard')
    } catch (err) {
      let detail = 'Credenciais inválidas. Tente novamente.'
      if (err instanceof AxiosError) {
        const body = err.response?.data as ApiErrorResponse | undefined
        detail = body?.error?.message ?? detail
      }
      setServerError(detail)
    }
  }

  return (
    <div className="auth-container">
      <h1>Entrar</h1>
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
          <label htmlFor="password">Senha</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            autoComplete="current-password"
          />
          {errors.password && (
            <span className="field-error">{errors.password.message}</span>
          )}
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="link-text">
        Não tem conta? <Link to="/register">Cadastre-se</Link>
      </p>
    </div>
  )
}
