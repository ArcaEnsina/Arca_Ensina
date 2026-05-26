from django.contrib import admin

from .models import ResearchDataPoint


@admin.register(ResearchDataPoint)
class ResearchDataPointAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "get_user",
        "condicao_tratada_cid",
        "seguiu_protocolo_integralmente",
        "ajustou_dose_sugerida",
        "created_at",
    )
    list_filter = (
        "ajustou_dose_sugerida",
        "seguiu_protocolo_integralmente",
        "created_at",
    )
    search_fields = (
        "condicao_tratada_cid",
        "indicacao_clinica",
        "audit_log__user__username",
    )
    readonly_fields = ("id", "created_at", "audit_log", "execution_state")

    def get_user(self, obj):
        if obj.audit_log and obj.audit_log.user:
            return obj.audit_log.user.username
        return "N/A"

    get_user.short_description = "Profissional"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("audit_log__user")
