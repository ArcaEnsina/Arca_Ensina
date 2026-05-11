from rest_framework import viewsets
from .serializers import PacienteSerializer, ConsultaSerializer
from .models import Paciente, Consulta

class PacienteViewSet(viewsets.ModelViewSet):
    queryset = Paciente.objects.all()
    serializer_class = PacienteSerializer

class ConsultaViewSet(viewsets.ModelViewSet):
    queryset = Consulta.objects.all()
    serializer_class = ConsultaSerializer