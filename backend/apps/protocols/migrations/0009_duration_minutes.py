from django.db import migrations


def _convert_steps(steps_data, src_key, dst_key, factor):
    """Rename a duration key on every step, scaling its value. Returns True if changed."""
    if not isinstance(steps_data, dict):
        return False
    steps = steps_data.get("steps")
    if not isinstance(steps, list):
        return False

    changed = False
    for step in steps:
        if isinstance(step, dict) and src_key in step:
            value = step.pop(src_key)
            if isinstance(value, (int, float)):
                step[dst_key] = int(value * factor)
            changed = True
    return changed


def hours_to_minutes(apps, schema_editor):
    ProtocolVersion = apps.get_model("protocols", "ProtocolVersion")
    for version in ProtocolVersion.objects.all():
        if _convert_steps(version.steps_data, "duration_hours", "duration_minutes", 60):
            version.save(update_fields=["steps_data"])


def minutes_to_hours(apps, schema_editor):
    ProtocolVersion = apps.get_model("protocols", "ProtocolVersion")
    for version in ProtocolVersion.objects.all():
        if _convert_steps(version.steps_data, "duration_minutes", "duration_hours", 1 / 60):
            version.save(update_fields=["steps_data"])


class Migration(migrations.Migration):
    dependencies = [
        ("protocols", "0008_protocolexecution_patient"),
    ]

    operations = [
        migrations.RunPython(hours_to_minutes, minutes_to_hours),
    ]
