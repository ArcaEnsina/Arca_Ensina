import unicodedata
from dataclasses import dataclass
from datetime import date

from apps.pacientes.models import Paciente
from apps.protocols.models import Protocol


@dataclass(frozen=True)
class ProtocolSuggestion:
    protocol: Protocol
    score: int
    matched_symptoms: list[str]
    reasons: list[str]


class ProtocolSuggester:
    SYMPTOM_WEIGHT = 10
    AGE_MATCH_WEIGHT = 2
    GENDER_MATCH_WEIGHT = 1

    def suggest(self, patient: Paciente, limit: int = 5) -> list[ProtocolSuggestion]:
        symptoms = list(patient.sintomas.values_list("descricao", flat=True))
        normalized_symptoms = {
            self._normalize(symptom): symptom for symptom in symptoms if symptom.strip()
        }

        patient_age_months = self._age_in_months(patient.data_nascimento)

        suggestions: list[ProtocolSuggestion] = []

        protocols = Protocol.objects.filter(is_active=True)

        for protocol in protocols:
            if not self._is_age_compatible(protocol, patient_age_months):
                continue

            if not self._is_gender_compatible(protocol, patient.genero):
                continue

            score = 0
            reasons: list[str] = []

            matched_symptoms = self._match_symptoms(
                normalized_symptoms=normalized_symptoms,
                protocol=protocol,
            )

            if matched_symptoms:
                score += len(matched_symptoms) * self.SYMPTOM_WEIGHT
                reasons.append("Sintomas compatíveis com tags do protocolo.")

            if patient_age_months is not None:
                score += self.AGE_MATCH_WEIGHT
                reasons.append("Idade compatível.")

            if protocol.gender_applicable in (None, "", patient.genero):
                score += self.GENDER_MATCH_WEIGHT
                reasons.append("Gênero compatível.")

            if matched_symptoms:
                suggestions.append(
                    ProtocolSuggestion(
                        protocol=protocol,
                        score=score,
                        matched_symptoms=matched_symptoms,
                        reasons=reasons,
                    )
                )

        return sorted(
            suggestions,
            key=lambda suggestion: (-suggestion.score, suggestion.protocol.title),
        )[:limit]

    def _match_symptoms(
        self,
        normalized_symptoms: dict[str, str],
        protocol: Protocol,
    ) -> list[str]:
        normalized_tags = {
            self._normalize(str(tag))
            for tag in (protocol.tags or [])
            if str(tag).strip()
        }

        matches = []

        for normalized_symptom, original_symptom in normalized_symptoms.items():
            if normalized_symptom in normalized_tags:
                matches.append(original_symptom)

        return matches

    def _is_age_compatible(
        self,
        protocol: Protocol,
        patient_age_months: int | None,
    ) -> bool:
        if patient_age_months is None:
            return True

        if (
            protocol.age_range_min is not None
            and patient_age_months < protocol.age_range_min
        ):
            return False

        if (
            protocol.age_range_max is not None
            and patient_age_months > protocol.age_range_max
        ):
            return False

        return True

    def _is_gender_compatible(self, protocol: Protocol, patient_gender: str) -> bool:
        if not protocol.gender_applicable:
            return True

        return protocol.gender_applicable == patient_gender

    def _age_in_months(self, birth_date: date | None) -> int | None:
        if birth_date is None:
            return None

        today = date.today()
        months = (today.year - birth_date.year) * 12
        months += today.month - birth_date.month

        if today.day < birth_date.day:
            months -= 1

        return max(months, 0)

    def _normalize(self, value: str) -> str:
        value = value.strip().lower()
        value = unicodedata.normalize("NFKD", value)
        value = "".join(char for char in value if not unicodedata.combining(char))
        return value
