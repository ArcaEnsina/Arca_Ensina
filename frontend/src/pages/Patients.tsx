"use client";
import * as React from "react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Search, Plus, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../components/ui/select";
import { TooltipProvider } from "../components/ui/tooltip";

import type { ApiErrorResponse } from "../types/auth";

const SINTOMAS_PADRAO = [
  "Febre",
  "Tosse",
  "Dor de cabeça",
  "Náusea",
  "Vômito",
  "Diarreia",
  "Falta de ar",
  "Calafrios",
  "Fadiga",
  "Perda de apetite",
];

const labelClass =
  "text-[10px] font-bold text-arca-blue-700 uppercase tracking-wider";

interface FormData {
  nome: string;
  data_nascimento: string;
  horario: string;
  prontuario: string;
  data_atendimento: string;
  cpf: string;
  cidade: string;
  genero: "M" | "F" | "O" | "";
  nome_responsavel: string;
  telefone: string;
  peso: string;
  altura: string;
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];
  const nowTime = new Date().toTimeString().slice(0, 5);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormData>({
    prontuario: "",
    data_atendimento: today,
    horario: nowTime,
    nome: "",
    data_nascimento: "",
    cpf: "",
    cidade: "",
    genero: "",
    nome_responsavel: "",
    telefone: "",
    peso: "",
    altura: "",
  });

  const [alergias, setAlergias] = useState<string[]>([]);
  const [alergiaInput, setAlergiaInput] = useState("");
  const [sintomas, setSintomas] = useState<string[]>([]);
  const [sintomaSearch, setSintomaSearch] = useState("");

  const sintomasFiltrados = SINTOMAS_PADRAO.filter((s) =>
    s.toLowerCase().includes(sintomaSearch.toLowerCase()),
  );

  const sintomaCustomizado =
    sintomaSearch.trim() !== "" &&
    !SINTOMAS_PADRAO.some(
      (s) => s.toLowerCase() === sintomaSearch.toLowerCase(),
    ) &&
    !sintomas.includes(sintomaSearch.trim());

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const addAlergia = () => {
    const val = alergiaInput.trim();
    if (val && !alergias.includes(val)) {
      setAlergias((prev) => [...prev, val]);
    }
    setAlergiaInput("");
  };

  const toggleSintoma = (s: string) => {
    setSintomas((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const toastId = toast.loading("Salvando registro...");

    try {
      toast.success("Paciente e consulta registrados!", { id: toastId });
      navigate("/dashboard");
    } catch (err) {
      let message = "Erro ao salvar. Verifique a conexão.";
      if (err instanceof AxiosError) {
        const data = err.response?.data as ApiErrorResponse | undefined;

        if (data?.error?.details) {
          message = Object.entries(data.error.details)
            .map(
              ([field, msgs]) =>
                `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`,
            )
            .join("; ");
        } else {
          message = data?.error?.message ?? message;
        }
      }
      setError(message);
      toast.error("Falha ao salvar", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold text-arca-blue-900">
              Novo Registro de Paciente
            </h1>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm">
                {error}
              </div>
            )}
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            <Card>
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-semibold text-arca-blue-800">
                  Identificação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className={labelClass}>Nº Prontuário</label>
                  <Input
                    value={form.prontuario}
                    onChange={(e) => setField("prontuario", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Data do Registro</label>
                  <Input
                    type="date"
                    value={form.data_atendimento}
                    onChange={(e) =>
                      setField("data_atendimento", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Hora</label>
                  <Input
                    type="time"
                    value={form.horario}
                    onChange={(e) => setField("horario", e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className={labelClass}>Nome Completo *</label>
                  <Input
                    required
                    value={form.nome}
                    onChange={(e) => setField("nome", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Data de Nasc. *</label>
                  <Input
                    type="date"
                    required
                    value={form.data_nascimento}
                    onChange={(e) =>
                      setField("data_nascimento", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Gênero</label>
                  <Select
                    value={form.genero}
                    onValueChange={(v) => setField("genero", v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculino</SelectItem>
                      <SelectItem value="F">Feminino</SelectItem>
                      <SelectItem value="O">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Contato *</label>
                  <Input
                    required
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => setField("telefone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Cidade</label>
                  <Input
                    value={form.cidade}
                    onChange={(e) => setField("cidade", e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-arca-blue-800">
                  Avaliação Inicial
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={labelClass}>Peso (kg)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.peso}
                      onChange={(e) => setField("peso", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Altura (cm)</label>
                    <Input
                      type="number"
                      value={form.altura}
                      onChange={(e) => setField("altura", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className={labelClass}>Sintomas</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      className="pl-10"
                      placeholder="Pesquisar..."
                      value={sintomaSearch}
                      onChange={(e) => setSintomaSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sintomasFiltrados.map((s) => (
                      <Button
                        key={s}
                        type="button"
                        variant={sintomas.includes(s) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSintoma(s)}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className={labelClass}>Alergias</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Adicionar alergia..."
                      value={alergiaInput}
                      onChange={(e) => setAlergiaInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addAlergia())
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addAlergia}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {alergias.map((a) => (
                      <Badge
                        key={a}
                        variant="destructive"
                        onClick={() =>
                          setAlergias((prev) => prev.filter((i) => i !== a))
                        }
                        className="cursor-pointer"
                      >
                        {a} ×
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-arca-blue-700 hover:bg-arca-blue-800 text-white font-bold h-14"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 animate-spin" /> Salvando...
                </>
              ) : (
                "Concluir Atendimento"
              )}
            </Button>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}
