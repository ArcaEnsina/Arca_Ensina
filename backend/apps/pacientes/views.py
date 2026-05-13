from rest_framework import viewsets

from .models import Paciente, Sintoma
from .serializers import PacienteSerializer, SintomaSerializer


class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer
    pagination_class = None


class SintomaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Sintoma.objects.all()
    serializer_class = SintomaSerializer
    pagination_class = None
