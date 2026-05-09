from django.db import models
#modelo de medicamentos foi para outro app

#criar calculadora

#criar historico da calculadora
"""
CalculadoraHistorico
├── paciente          (ForeignKey → model de paciente, se existir)
├── medicamento       (CharField por enquanto, ForeignKey depois)
├── peso              (FloatField)
├── altura            (FloatField, nullable)
├── idade_dias        (IntegerField, nullable)
├── prescricao        (FloatField)
├── frequencia_horas  (IntegerField)
├── dose_total_mg     (FloatField)
├── dose_por_dose_mg  (FloatField)
├── volume_ml         (FloatField, nullable)
├── warnings          (JSONField)
└── criado_em         (DateTimeField auto_now_add)
"""