export const ERROR_CODES = {
  validation_error: 'Verifique os dados informados.',
  panel_calculation_error: 'Erro ao calcular a conversão. Tente novamente.',
  invalid_dose: 'Dose informada é inválida.',
  dose_above_max: 'Dose acima do máximo recomendado.',
  not_found: 'Recurso não encontrado.',
  permission_denied: 'Você não tem permissão para esta ação.',
  authentication_failed: 'Sessão expirada. Faça login novamente.',
  rate_limited: 'Muitas requisições. Aguarde um momento.',
  idempotency_conflict: 'Esta prescrição já foi registrada.',
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export function getErrorMessage(code: string | undefined): string {
  return ERROR_CODES[code as ErrorCode] ?? 'Ocorreu um erro inesperado.';
}
