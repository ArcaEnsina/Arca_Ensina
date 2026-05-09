from math import sqrt
from django.apps import AppConfig
#funções dos calculos da calculadora:
"""
1. Calcular dose total em miligramas
2. verificar se a dose calculada está dentro dos limites seguros para o paciente
3. calculo da suspensão (quanto que a criança deve tomar em ml, baseado na concentração do medicamento)
"""

#1.1- calcular dose total em miligramas
def calculate_dosage_mg(prescription, weight, height=None):
    if height:
        """
        ex: prescrição: 100mg/m²; altura: 100cm; peso: 16kg
        -> sc(m²) = sqrt((100 x 16) / 3600) = 0.6667m²
        -> dose total = 100 x 0.6667 = 66.67mg
        """
        
        if prescription <= 0 or height <= 0 or weight <= 0:
            raise ValueError("Prescrição, altura e peso devem ser maiores que zero.")
        scm = sqrt((height * weight) / 3600)
        return round(prescription * scm, 2)
    else:
        """
        ex: prescrição: 10mg/kg; peso: 15kg
        -> 10 x 15 = 150mg
        """
        
        if prescription <= 0 or weight <= 0:
            raise ValueError("Prescrição e peso devem ser maiores que zero.")
            # Dosagem em mg = (Dose por mg/kg) x (Peso do paciente kg)
        return round(prescription * weight, 2)


#1.2- calcular dose por dia
def prescription_to_frequency(prescription_time):
    """
    ex: prescrição: 10mg/kg/dia a cada 6h
    -> 24h / 6h = 4 vezes por dia
    """
    if prescription_time <= 0:
        raise ValueError("Tempo da prescrição deve ser maior que zero.")
    frequency_per_day = 24 / prescription_time
    if type(frequency_per_day) != int:
        frequency_per_day = round(frequency_per_day) #arredonda o numero para intero mais próximo, ex: 4.5 -> 5
    return frequency_per_day

def calculate_dosage_per_dose(total_dosage_mg, frequency_per_day):
    """
    ex: dose total: 250mg; frequência: 4 vezes por dia
    -> 250mg / 4 = 62.5mg por dose
    """
    if total_dosage_mg <= 0 or frequency_per_day <= 0:
        raise ValueError("Dosagem e frequência por dia devem ser maiores que zero.")
    return round(total_dosage_mg / frequency_per_day, 2)

#2- validação da dose calculada


#3- calculo de conversao para liquidos
def convert_dosage_to_ml(validated_dosage_mg, concentration_mg, concentration_ml):
    """
    ex: dose calculadda: 250mg; concentração do frasco: 125mg/5ml
    -> 250 / (125/5) = 10ml
    """
    if validated_dosage_mg <= 0 or concentration_mg <= 0 or concentration_ml <= 0:
        raise ValueError("Dosagem, concentração do frasco e volume do frasco devem ser maiores que zero.")
    concentration = concentration_mg / concentration_ml
    return round(validated_dosage_mg / concentration, 2)
