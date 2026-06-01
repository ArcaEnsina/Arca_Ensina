from django.contrib import admin

from .models import ResearchResponse


@admin.register(ResearchResponse)
class ResearchResponseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "get_user",
        "condicao_tratada_cid",
        "seguiu_protocolo_integralmente",
        "created_at",
    )
    list_filter = (
        "seguiu_protocolo_integralmente",
        "created_at",
    )
    search_fields = (
        "condicao_tratada_cid",
        "desfecho_esperado",
        "audit_log__user__email",
    )
    readonly_fields = ("id", "created_at", "audit_log", "execution", "client_uuid")

    def get_user(self, obj):
        if obj.audit_log and obj.audit_log.user:
            return obj.audit_log.user.email
        return "N/A"

    get_user.short_description = "Profissional"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("audit_log__user")

    def has_change_permission(self, request, obj=None):
        # Imutável: permite visualizar, nunca editar.
        return False
