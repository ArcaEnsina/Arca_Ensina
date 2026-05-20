import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, 'Usuário obrigatório'),
  password: z.string().min(1, 'Senha obrigatória'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  username: z.string().min(1, 'Usuário obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  profile: z.enum(['medico', 'admin', 'pesquisador'], {
    message: 'Perfil obrigatório',
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>
