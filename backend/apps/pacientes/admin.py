from django.contrib import admin
from django import forms
from .models import Paciente, Alergia, Consulta, Sintoma

class PacienteAdminForm(forms.ModelForm):
    alergias_input = forms.CharField(
        label="Digitar Alergias (separe por vírgula)",
        required=False,
        widget=forms.TextInput(attrs={'placeholder': 'Ex: Dipirona, Gato, Pólen'}),
        help_text="As alergias serão criadas automaticamente se não existirem."
    )

    class Meta:
        model = Paciente
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance.pk:
            self.fields['alergias_input'].initial = ", ".join(
                [a.nome for a in self.instance.alergias.all()]
            )

@admin.register(Paciente)
class PacienteAdmin(admin.ModelAdmin):
    form = PacienteAdminForm
    list_display = ('nome', 'cpf', 'get_alergias')
    search_fields = ('nome', 'cpf')
    exclude = ('alergias',) 

    def get_alergias(self, obj):
        return ", ".join([a.nome for a in obj.alergias.all()])
    get_alergias.short_description = 'Alergias'

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

        alergias_str = form.cleaned_data.get('alergias_input', '')
        if alergias_str:
            nomes = [n.strip().title() for n in alergias_str.split(',') if n.strip()]
            objetos = [Alergia.objects.get_or_create(nome=nome)[0] for nome in nomes]
            obj.alergias.set(objetos)
        else:
            obj.alergias.clear()

class ConsultaAdminForm(forms.ModelForm):
    sintomas_input = forms.CharField(
        label="Sintomas desta Consulta",
        required=False,
        widget=forms.TextInput(attrs={'class': 'vTextField'}),
    )

    class Meta:
        model = Consulta
        fields = '__all__'

@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    form = ConsultaAdminForm
    fields = ('paciente', 'criado_at', 'sintomas_input')
    list_display = ('paciente', 'criado_at')
    list_filter = ('criado_at', 'paciente')
    exclude = ('sintomas',)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        sintomas_str = form.cleaned_data.get('sintomas_input', '')
        if sintomas_str:
            nomes = [s.strip().title() for s in sintomas_str.split(',') if s.strip()]
            tags = [Sintoma.objects.get_or_create(nome=nome)[0] for nome in nomes]
            obj.sintomas.set(tags)

admin.site.register(Alergia)
admin.site.register(Sintoma)