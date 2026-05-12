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

import type { ApiErrorResponse } from "@/types/auth";

const SINTOMAS_PADRÃO = [
  "Febre",
  "Tosse",
  "Dor de Cabeça",
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
