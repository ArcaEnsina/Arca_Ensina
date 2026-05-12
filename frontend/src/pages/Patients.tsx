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
}
