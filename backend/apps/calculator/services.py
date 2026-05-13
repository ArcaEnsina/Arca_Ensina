from decimal import Decimal, getcontext, ROUND_HALF_UP

getcontext().prec = 28

#funções dos calculos da calculadora:
"""
1. Calcular dose total em miligramas
2. verificar se a dose calculada está dentro dos limites seguros para o paciente
3. calculo da suspensão (quanto que a criança deve tomar em ml, baseado na concentração do medicamento)
"""

#1.1- calcular dose total em miligramas
def calculate_dosage_mg(prescription, weight, height=None):
    prescription = Decimal(str(prescription))
    weight = Decimal(str(weight))

    if height is not None:
        """
        ex: prescrição: 100mg/m²; altura: 100cm; peso: 16kg
        -> sc(m²) = sqrt((100 x 16) / 3600) = 0.6667m²
        -> dose total = 100 x 0.6667 = 66.67mg
        """
        height = Decimal(str(height))

        if prescription <= 0 or height <= 0 or weight <= 0:
            raise ValueError("Prescrição, altura e peso devem ser maiores que zero.")
        scm = ((height * weight) / Decimal('3600')).sqrt()
        return (prescription * scm).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    else:
        """
        ex: prescrição: 10mg/kg; peso: 15kg
        -> 10 x 15 = 150mg
        """

        if prescription <= 0 or weight <= 0:
            raise ValueError("Prescrição e peso devem ser maiores que zero.")
            # Dosagem em mg = (Dose por mg/kg) x (Peso do paciente kg)
        return (prescription * weight).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


#1.2- calcular dose por dia
def prescription_to_frequency(prescription_time):
    """
    ex: prescrição: 10mg/kg/dia a cada 6h
    -> 24h / 6h = 4 vezes por dia
    """
    prescription_time = Decimal(str(prescription_time))
    if prescription_time <= 0:
        raise ValueError("Tempo da prescrição deve ser maior que zero.")
    frequency_per_day = Decimal('24') / prescription_time

    return int(frequency_per_day.to_integral_value(rounding=ROUND_HALF_UP)) #arredonda o numero para intero mais próximo, ex: 4.5 -> 5

def calculate_dosage_per_dose(total_dosage_mg, frequency_per_day):
    """
    ex: dose total: 250mg; frequência: 4 vezes por dia
    -> 250mg / 4 = 62.5mg por dose
    """
    total_dosage_mg = Decimal(str(total_dosage_mg))
    frequency_per_day = Decimal(str(frequency_per_day))
    if total_dosage_mg <= 0 or frequency_per_day <= 0:
        raise ValueError("Dosagem e frequência por dia devem ser maiores que zero.")
    return (total_dosage_mg / frequency_per_day).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

#2- validação da dose calculada
def validate_dosage(total_dosage_mg, weight, min_dose, max_dose, max_absolute_dose):
    total_dosage_mg = Decimal(str(total_dosage_mg))
    weight = Decimal(str(weight))
    warning = []
    dosage_convert = total_dosage_mg / weight #converte a dose por dose para mg/kg/dose, para comparar com os limites que estão em mg/kg/dia
    warning, dosage_convert = _check_limits(dosage_convert, total_dosage_mg, min_dose, max_dose, max_absolute_dose)
    return warning, total_dosage_mg

def validate_dosage_per_age(total_dosage_mg, age_days, limits, weight): #limits deve receber um dicionario com as chaves: "{faixa": {"min": valor, "max": valor, "absolute_max": valor}}
    total_dosage_mg = Decimal(str(total_dosage_mg))
    weight = Decimal(str(weight))
    #classificando a idade com a faixa etaria:
    if age_days < 28:
        faixa = "neonatal"
    elif age_days >= 28 and age_days < 365:
        faixa = "lactente"
    elif age_days >= 365 and age_days < 365*12: #1 a 12 anos
        faixa = "crianca"
    elif age_days >= 365*12 and age_days < 365*18: #12 a 18 anos
        faixa = "adolescente"
    else:
        faixa = "adulto"

    if faixa not in limits:
        raise ValueError("Faixa etária não encontrada nos limites fornecidos.")
    else:
        warning = []
        dosage_convert = total_dosage_mg / weight #converte a dose por dose para mg/kg/dose, para comparar com os limites que estão em mg/kg/dia
        min_dose = limits[faixa].get("min", None)
        max_dose = limits[faixa].get("max", None)
        max_absolute_dose = limits[faixa].get("absolute_max", None)
        warning, dosage_convert = _check_limits(dosage_convert, total_dosage_mg, min_dose, max_dose, max_absolute_dose)
        return warning, total_dosage_mg

#funcao privada que checa os limites
def _check_limits(converted_dose, dosage_per_dose_mg, min_dose, max_dose, max_absolute_dose):
    warning = []
    converted_dose = Decimal(str(converted_dose))
    dosage_per_dose_mg = Decimal(str(dosage_per_dose_mg))
    if min_dose is not None:
        min_dose = Decimal(str(min_dose))
        if converted_dose < min_dose:
            warning.append("BAIXO")
    if max_dose is not None:
        max_dose = Decimal(str(max_dose))
        if converted_dose > max_dose:
            warning.append("ALTO")
    if max_absolute_dose is not None:
        max_absolute_dose = Decimal(str(max_absolute_dose))
        if dosage_per_dose_mg > max_absolute_dose:
            warning.append("CRITICO")
    return warning, dosage_per_dose_mg

#3- calculo de conversao para liquidos
def convert_dosage_to_ml(validated_dosage_mg, concentration_mg, concentration_ml):
    """
    ex: dose calculadda: 250mg; concentração do frasco: 125mg/5ml
    -> 250 / (125/5) = 10ml
    """
    validated_dosage_mg = Decimal(str(validated_dosage_mg))
    concentration_mg = Decimal(str(concentration_mg))
    concentration_ml = Decimal(str(concentration_ml))
    if validated_dosage_mg <= 0 or concentration_mg <= 0 or concentration_ml <= 0:
        raise ValueError("Dosagem, concentração do frasco e volume do frasco devem ser maiores que zero.")
    concentration = concentration_mg / concentration_ml
    return (validated_dosage_mg / concentration).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
