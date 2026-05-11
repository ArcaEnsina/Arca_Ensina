from rest_framework import viewsets

from .models import Consulta, Paciente
from .serializers import ConsultaSerializer, PacienteSerializer


class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer

class ConsultaViewSet(viewsets.ModelViewSet):
    queryset = Consulta.objects.all()
    serializer_class = ConsultaSerializer