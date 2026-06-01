from django.contrib import admin

from .models import SedationConversion


@admin.register(SedationConversion)
class SedationConversionAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "physician",
        "source_drug",
        "target_drug",
        "original_dose",
        "converted_dose",
        "converted_dose_unit",
        "frequency",
        "peso_kg",
        "client_uuid",
        "created_at",
    )
    list_filter = ("created_at", "source_drug", "target_drug")
    search_fields = (
        "source_drug",
        "target_drug",
        "client_uuid",
        "physician__email",
    )
    readonly_fields = (
        "physician",
        "panel_version",
        "patient",
        "source_drug",
        "target_drug",
        "original_dose",
        "converted_dose",
        "converted_dose_unit",
        "frequency",
        "peso_kg",
        "client_uuid",
        "created_at",
    )
