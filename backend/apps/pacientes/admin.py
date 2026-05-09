from django.contrib import admin
from .models import Paciente, Alergia, Consulta, Sintoma 
from django import forms
from django.utils import timezone

class PacienteAdminForm(forms.ModelForm):
    alergias_input = forms.CharField(label="Alergias (separadas por vírgula)", required=False)
    class Meta:
        model = Paciente
        fields = '__all__'
        widgets = {
            'data_nascimento': forms.DateInput(attrs={'type': 'date'}, format='%Y-%m-%d'),
        }

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    form = PacienteAdminForm
    list_display = ('nome', 'cpf', 'data_nascimento', 'genero')
    fields = ('nome', 'cpf', 'data_nascimento', 'genero', 'alergias_input')
    exclude = ('alergias',)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj and obj.pk:
            alergias_nomes = ", ".join([a.nome for a in obj.alergias.all()])
            form.base_fields['alergias_input'].initial = alergias_nomes
        return form

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        alergias_str = form.cleaned_data.get('alergias_input', '')
        if alergias_str:
            nomes = [n.strip().title() for n in alergias_str.split(',') if n.strip()]
            objs = [Alergia.objects.get_or_create(nome=n)[0] for n in nomes]
            obj.alergias.set(objs)

class ConsultaAdminForm(forms.ModelForm):
    sintomas_input = forms.CharField(label="Sintomas (separados por vírgula)", required=False)
    class Meta:
        model = Consulta
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        paciente = cleaned_data.get("paciente")
        data_consulta = cleaned_data.get("criado_at")
        agora = timezone.now()

        if data_consulta:
            if data_consulta > agora:
                raise forms.ValidationError(
                    "Data Inválida!"
                )
            
            if paciente and data_consulta.date() < paciente.data_nascimento:
                raise forms.ValidationError(
                    "Data Inválida!"
                )
        return cleaned_data

@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    form = ConsultaAdminForm
    fields = ('paciente', 'criado_at', 'sintomas_input') 
    exclude = ('sintomas',)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if obj and obj.pk:
            sintomas_nomes = ", ".join([s.nome for s in obj.sintomas.all()])
            form.base_fields['sintomas_input'].initial = sintomas_nomes
        return form

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        sintomas_str = form.cleaned_data.get('sintomas_input', '')
        if sintomas_str:
            nomes = [n.strip().title() for n in sintomas_str.split(',') if n.strip()]
            objs = [Sintoma.objects.get_or_create(nome=n)[0] for n in nomes]
            obj.sintomas.set(objs)

admin.site.register(Alergia)
admin.site.register(Sintoma)