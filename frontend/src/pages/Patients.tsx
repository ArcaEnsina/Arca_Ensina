"use client";
import * as React from "react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Search, Plus, Loader2 } from "lucide-react";
import api from "@/services/api";
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

interface FormData {
  nome: string;
  data_nascimento: string;
  genero: "M" | "F" | "O" | "";
  nome_responsavel: string;
  cidade: string;
  telefone: string;
  peso: string;
  altura: string;
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const labelClass =
    "text-[10px] font-bold text-arca-blue-700 uppercase tracking-wider";

  const [form, setForm] = useState<FormData>({
    nome: "",
    data_nascimento: "",
    genero: "M",
    nome_responsavel: "",
    cidade: "",
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

    const payload = {
      ...form,
      telefone: form.telefone.replace(/\D/g, ""),
      peso: form.peso ? parseFloat(form.peso) : null,
      altura: form.altura ? parseInt(form.altura) : null,
      alergias: alergias,
      sintomas: sintomas,
    };

    try {
      await api.post("pacientes/", payload);
      toast.success("Paciente cadastrado com sucesso!", { id: toastId });
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error("Erro na requisição:", err);
      let message = "Erro ao salvar. Verifique a conexão.";

      if (err instanceof AxiosError) {
        const axiosError = err as AxiosError<ApiErrorResponse>;
        const data = axiosError.response?.data;
        if (data && typeof data === "object") {
          message = Object.values(data).flat().join(" | ");
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
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-semibold text-arca-blue-800">
                  Identificação do Paciente
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label htmlFor="nome" className={labelClass}>
                    Nome Completo *
                  </label>
                  <Input
                    id="nome"
                    required
                    value={form.nome}
                    onChange={(e) => setField("nome", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="data_nasc" className={labelClass}>
                    Data de Nasc. *
                  </label>
                  <Input
                    id="data_nasc"
                    type="date"
                    required
                    value={form.data_nascimento}
                    onChange={(e) =>
                      setField("data_nascimento", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="genero" className={labelClass}>
                    Gênero
                  </label>
                  <Select
                    value={form.genero}
                    onValueChange={(v) => setField("genero", v as any)}
                  >
                    <SelectTrigger id="genero">
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
                  <label htmlFor="telefone" className={labelClass}>
                    Telefone (Apenas números) *
                  </label>
                  <Input
                    id="telefone"
                    required
                    type="tel"
                    placeholder="Ex: 5581999999999"
                    value={form.telefone}
                    onChange={(e) => setField("telefone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="cidade" className={labelClass}>
                    Cidade
                  </label>
                  <Input
                    id="cidade"
                    value={form.cidade}
                    onChange={(e) => setField("cidade", e.target.value)}
                  />
                </div>

                <div className="md:col-span-3 space-y-2">
                  <label htmlFor="responsavel" className={labelClass}>
                    Nome do Responsável (Opcional)
                  </label>
                  <Input
                    id="responsavel"
                    value={form.nome_responsavel || ""}
                    onChange={(e) =>
                      setField("nome_responsavel", e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg font-semibold text-arca-blue-800">
                  Avaliação Inicial
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="peso" className={labelClass}>
                      Peso (kg)
                    </label>
                    <Input
                      id="peso"
                      type="number"
                      step="0.1"
                      value={form.peso}
                      onChange={(e) => setField("peso", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="altura" className={labelClass}>
                      Altura (cm)
                    </label>
                    <Input
                      id="altura"
                      type="number"
                      value={form.altura}
                      onChange={(e) => setField("altura", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label htmlFor="sintoma-search" className={labelClass}>
                    Sintomas Atuais
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                    <Input
                      id="sintoma-search"
                      className="pl-10"
                      placeholder="Pesquisar ou digitar novo sintoma..."
                      value={sintomaSearch}
                      onChange={(e) => setSintomaSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {sintomasFiltrados.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSintoma(s)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                          sintomas.includes(s)
                            ? "bg-arca-blue-600 text-white border-arca-blue-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-arca-blue-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}

                    {sintomaCustomizado && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="rounded-full bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        onClick={() => {
                          toggleSintoma(sintomaSearch.trim());
                          setSintomaSearch("");
                        }}
                      >
                        <Plus className="mr-1 size-3" />
                        Adicionar "{sintomaSearch}"
                      </Button>
                    )}
                  </div>

                  {sintomas.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">
                        Selecionados:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sintomas.map((s) => (
                          <Badge
                            key={s}
                            variant="outline"
                            className="bg-slate-50"
                          >
                            {s}
                            <span
                              className="ml-1 cursor-pointer hover:text-red-500"
                              onClick={() => toggleSintoma(s)}
                            >
                              ×
                            </span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label htmlFor="alergia-input" className={labelClass}>
                    Alergias Conhecidas
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="alergia-input"
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
                          setAlergias((p) => p.filter((i) => i !== a))
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
                "Concluir Cadastro"
              )}
            </Button>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
}
