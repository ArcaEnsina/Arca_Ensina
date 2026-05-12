from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Medication
from .serializers import MedicationSerializer
from rest_framework.permissions import AllowAny

class MedicationListView(APIView):
    permission_classes = [AllowAny]
    

    def get(self, request, version=None):
        try:
            medications = Medication.objects.all().order_by('name')
            serializer = MedicationSerializer(medications, many=True)
            return Response(serializer.data, status=200)
        except Exception:
            return Response({"error": "Erro ao listar medicamentos"}, status=status.HTTP_404_NOT_FOUND)

class MedicationDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, version=None, pk=None):
        try:
            medication = Medication.objects.get(pk=pk)
        except Medication.DoesNotExist:
            return Response(
                {"error": "Medicamento não encontrado."}, status=status.HTTP_404_NOT_FOUND
                )
        serializer = MedicationSerializer(medication)
        return Response(serializer.data, status=200)