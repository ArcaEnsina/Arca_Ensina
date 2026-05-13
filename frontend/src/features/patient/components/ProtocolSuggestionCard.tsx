import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ProtocolSuggestionCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Sugestões de Protocolo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Sugestões de protocolo aparecerão aqui após o cadastro do paciente.
        </p>
      </CardContent>
    </Card>
  );
}
