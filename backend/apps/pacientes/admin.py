from django.contrib import admin
from django import forms
from django.utils import timezone
from .models import Paciente, Consulta, Alergia, Sintoma, CalculadoraMedicamento

class PacienteAdminForm(forms.ModelForm):
    alergias_input = forms.CharField(
        label="Alergias (separadas por vírgula)",
        required=False,
        widget=forms.TextInput(attrs={'placeholder': 'Ex: Dipirona, Pólen, Amendoim'})
    )

    class Meta:
        model = Paciente
        fields = [
            'nome', 'cpf', 'data_nascimento', 'genero', 
            'nome_responsavel', 'cidade', 'telefone','alergias_input',           
            ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields['alergias_input'].initial = ", ".join(
                [a.descricao for a in self.instance.alergias.all()]
            )

class ConsultaAdminForm(forms.ModelForm):
    sintomas_input = forms.CharField(
        label="Sintomas (separados por vírgula)",
        required=False,
        widget=forms.TextInput(attrs={'placeholder': 'Ex: Febre, Tosse, Dor de cabeça'})
    )

    class Meta:
        model = Consulta
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields['sintomas_input'].initial = ", ".join(
                [s.descricao for s in self.instance.sintomas.all()]
            )

    def clean(self):
        cleaned_data = super().clean()
        paciente = cleaned_data.get("paciente")
        data_consulta = cleaned_data.get("data_atendimento")
        agora = timezone.now()

        if data_consulta:
            if data_consulta > agora:
                raise forms.ValidationError("Data Inválida!")
            if paciente and data_consulta.date() < paciente.data_nascimento:
                raise forms.ValidationError("Data indisponível para este paciente.")
        return cleaned_data

class ConsultaInline(admin.TabularInline):
    model = Consulta
    form = ConsultaAdminForm
    extra = 1
    fields = ('data_atendimento', 'sintomas_input', 'protocolos_vazio')
    readonly_fields = ('protocolos_vazio',)

    def protocolos_vazio(self, obj):
        return "" 
    protocolos_vazio.short_description = "Protocolos Recomendados"

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    form = PacienteAdminForm
    list_display = ('nome', 'cpf', 'data_nascimento', 'genero', 'cidade', 'telefone', 'nome_responsavel')
    inlines = [ConsultaInline]

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        alergias_texto = form.cleaned_data.get('alergias_input')
        if alergias_texto:
            obj.alergias.clear()
            nomes = [n.strip() for n in alergias_texto.split(',') if n.strip()]
            for nome in nomes:
                alergia, _ = Alergia.objects.get_or_create(descricao=nome)
                obj.alergias.add(alergia)

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, Consulta):
                instance.save()               
                prefix = formset.prefix
                index = instances.index(instance)
                sintomas_texto = request.POST.get(f"{prefix}-{index}-sintomas_input")
                
                if sintomas_texto:
                    instance.sintomas.clear()
                    nomes = [n.strip() for n in sintomas_texto.split(',') if n.strip()]
                    for nome in nomes:
                        sintoma, _ = Sintoma.objects.get_or_create(descricao=nome)
                        instance.sintomas.add(sintoma)
        
        formset.save_m2m()

@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    form = ConsultaAdminForm
    list_display = ('paciente', 'data_atendimento')
    readonly_fields = ('protocolos_vazio',)
    fieldsets = (
        ("Dados da Consulta", {
            'fields': ('paciente', 'data_atendimento', 'sintomas_input')
        }),
        ("Sugestões Clínicas", {
            'fields': ('protocolos_vazio',),
        }),
    )
    def protocolos_vazio(self, obj):
        return "" 
    protocolos_vazio.short_description = "Protocolos Recomendados"
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        sintomas_texto = form.cleaned_data.get('sintomas_input')
        if sintomas_texto:
            obj.sintomas.clear()
            nomes = [n.strip() for n in sintomas_texto.split(',') if n.strip()]
            for nome in nomes:
                sintoma, _ = Sintoma.objects.get_or_create(descricao=nome)
                obj.sintomas.add(sintoma)

@admin.register(Alergia)
class AlergiaAdmin(admin.ModelAdmin):
    list_display = ('descricao',)

@admin.register(Sintoma)
class SintomaAdmin(admin.ModelAdmin):
    list_display = ('descricao',)

@admin.register(CalculadoraMedicamento)
class CalculadoraMedicamentoAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False
    def has_delete_permission(self, request, obj=None):
        return False