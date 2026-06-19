from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Medication
from .serializers import MedicationDetailSerializer, MedicationSerializer


class MedicationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, version=None):
        try:
            medications = Medication.objects.all().order_by("name")
            serializer = MedicationSerializer(medications, many=True)
            return Response(serializer.data, status=200)
        except Exception:
            return Response(
                {"error": "Erro ao listar medicamentos"},
                status=status.HTTP_404_NOT_FOUND,
            )


class MedicationBulkDetailView(APIView):
    """Todos os medicamentos já com o schema rico, em uma única requisição.

    Usado pelo auto-download offline: o app baixa tudo enquanto online para que
    a calculadora funcione offline sem depender de abrir cada medicamento antes.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, version=None):
        medications = Medication.objects.all().order_by("name")
        serializer = MedicationDetailSerializer(medications, many=True)
        return Response(serializer.data, status=200)


class MedicationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, version=None, pk=None):
        try:
            medication = Medication.objects.get(pk=pk)
        except Medication.DoesNotExist:
            return Response(
                {"error": "Medicamento não encontrado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = MedicationDetailSerializer(medication)
        return Response(serializer.data, status=200)
