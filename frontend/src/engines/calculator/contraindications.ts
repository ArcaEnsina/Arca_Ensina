import { Decimal } from '@/lib/decimal'

export interface ContraindicationWarning {
  type: string
  severity: string
  drug: string
  rule: string
  current_dose: string
  max_allowed: string
  unit: string
  message: string
}

function _block(message: string, drug = '', rule = ''): ContraindicationWarning {
  return {
    type: 'contraindicated',
    severity: 'CRITICO',
    drug,
    rule,
    current_dose: '',
    max_allowed: '',
    unit: '',
    message,
  }
}

export interface ContraindicationRule {
  rule: string
  value?: number
  form?: string
  route?: string
  min_days?: number
  max_days?: number
}

export function evaluateContraindications({
  rules,
  ageDays,
  weight,
  route,
  form,
  drug = '',
}: {
  rules: ContraindicationRule[] | null | undefined
  ageDays?: unknown
  weight?: unknown
  route?: string | null
  form?: string | null
  drug?: string
}): ContraindicationWarning[] {
  if (!rules || rules.length === 0) return []

  const blocks: ContraindicationWarning[] = []

  for (const rule of rules) {
    const rtype = rule.rule

    if (rtype === 'min_age_days') {
      if (rule.value == null) throw new Error(`Contraindication rule ${rtype} missing value`)
      if (ageDays != null && Math.floor(Number(ageDays)) < rule.value) {
        blocks.push(
          _block(
            `Contraindicado: idade abaixo do mínimo (${rule.value} dias).`,
            drug,
            rtype,
          ),
        )
      }
    } else if (rtype === 'min_weight_kg') {
      if (rule.value == null) throw new Error(`Contraindication rule ${rtype} missing value`)
      if (weight != null && new Decimal(String(weight)).lt(new Decimal(String(rule.value)))) {
        blocks.push(
          _block(
            `Contraindicado: peso abaixo do mínimo (${rule.value} kg).`,
            drug,
            rtype,
          ),
        )
      }
    } else if (rtype === 'form_min_age_days') {
      if (rule.value == null) throw new Error(`Contraindication rule ${rtype} missing value`)
      if (
        form != null &&
        form === rule.form &&
        ageDays != null &&
        Math.floor(Number(ageDays)) < rule.value
      ) {
        blocks.push(
          _block(
            `Contraindicado: forma '${rule.form}' abaixo da idade mínima (${rule.value} dias).`,
            drug,
            rtype,
          ),
        )
      }
    } else if (rtype === 'route_min_age_days') {
      if (rule.value == null) throw new Error(`Contraindication rule ${rtype} missing value`)
      if (
        route != null &&
        route === rule.route &&
        ageDays != null &&
        Math.floor(Number(ageDays)) < rule.value
      ) {
        blocks.push(
          _block(
            `Contraindicado: via '${rule.route}' abaixo da idade mínima (${rule.value} dias).`,
            drug,
            rtype,
          ),
        )
      }
    } else if (rtype === 'route_forbidden_age_range') {
      if (rule.min_days == null) throw new Error(`Contraindication rule ${rtype} missing min_days`)
      if (rule.max_days == null) throw new Error(`Contraindication rule ${rtype} missing max_days`)
      if (
        route != null &&
        route === rule.route &&
        ageDays != null &&
        Math.floor(Number(ageDays)) >= rule.min_days &&
        Math.floor(Number(ageDays)) < rule.max_days
      ) {
        blocks.push(
          _block(
            `Contraindicado: via '${rule.route}' nesta faixa etária (${rule.min_days}-${rule.max_days} dias).`,
            drug,
            rtype,
          ),
        )
      }
    } else {
      throw new Error(`Regra de contraindicação desconhecida: ${rtype}`)
    }
  }

  return blocks
}
