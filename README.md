![Logo arca](docs/imgs/arca-branding.png)
---

<div align="center">

![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=green)
![Python](https://img.shields.io/badge/Python-14354C?style=for-the-badge&logo=python&logoColor=white)
![DjangoREST](https://img.shields.io/badge/django%20rest-ff1709?style=for-the-badge&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)


Aplicação web multiplataforma para centralizar protocolos médicos e oferecer ferramentas de apoio à prática clínica. Reúne conteúdos da equipe **ARCA Ensina** com funcionalidades que auxiliam na tomada de decisão e organização do fluxo de trabalho médico.

Público-alvo: pediatras intensivistas recém-formados.

🔗[arcaapp.lat](https://arcaapp.lat/)

</div>

## Stack

- **Backend:** Django 6 + Django REST Framework + SimpleJWT (SQLite em dev, PostgreSQL em Docker/prod)
- **Frontend:** React 18 + TypeScript + Vite
- **CI/CD:** GitHub Actions + Docker Compose

---

## Quero executar localmente:

Veja o [**CONTRIBUTING.md**](./.github/CONTRIBUTING.md) para o guia completo.

### Docker (recomendado)

```bash
cp .env.example .env
docker compose up
```

Migrations rodam automaticamente na primeira inicialização.

### Manual (dois terminais)

```bash
# Terminal 1 — backend
cp .env.example .env              # obrigatório (SECRET_KEY, etc.)
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver        # :8000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev                       # :5173
```

Abra **http://localhost:5173** no navegador.

#### Credenciais de teste:
- Login: teste@arcaapp.com
- Senha: punTaw5%

---

## Estrutura

```
backend/
  project/       ← configurações Django (settings, urls)
  apps/
    accounts/    ← autenticação (User, login, register, logout)
    audit/       ← auditoria (AuditLog, AuditableMixin)
frontend/        ← SPA React + Vite
docs/            ← planejamento (stories, infra, roadmap)
```

> **Convenção:** cada domínio do produto vira um **app Django próprio** dentro de `backend/apps/`. Veja a seção _Adicionando um domínio novo_ no [CONTRIBUTING.md](./.github/CONTRIBUTING.md).

---

## Funcionalidades

- Consulta de protocolos médicos
- Calculadoras de medicamentos
- Interface responsiva
- Modo Offline
- Bulário digital
- Suporte à exportação de dados para pesquisa

---

<details>
<summary><strong>Status Report 1</strong></summary>

### Pesquisa e Análise
- Levantamento de aplicações similares
- Análise comparativa

### Persona
- Definição do perfil do usuário

### Jornada do Usuário
- Mapeamento de interações

### Coleta de Dados
- Aplicação de formulário
- Análise dos resultados

### Ideação
- Divisão em 3 equipes
- Uso de diferentes abordagens

### Priorização (MoSCoW)
- **Must have** – essenciais
- **Should have** – importantes
- **Could have** – desejáveis
- **Won't have** – fora do escopo

### Planejamento Ágil
- Histórias de usuário
- Organização em 3 épicos

### Gestão
- Uso do Jira
- Apresentação de Status Report

</details>

---

## 📖 Histórias Épicas

### Épico 1 - Fundamentos clínicos + design foundation

**Período:** 06/05 – 13/05 (Sprint 1, 1 semana)
**Prioridade:** Must Have
**Objetivo:** Entregar fundações de dados (modelo dual guiado+painel, engine de dose, modelo de paciente) **e** fundação visual (design tokens, shadcn base, AppShell, disclaimer-ready) que destravam todo o trabalho FE de Sprint 2 sem retrabalho.

**Stories:** CORE-001 , CORE-002a, CORE-003, CORE-007, CORE-013 , CORE-014  - 51 pts

---

### Épico 2 - Fluxo end-to-end + offline + coleta + painel BE + auth UX polida

**Período:** 13/05 – 27/05 (Sprint 2, 2 semanas)
**Prioridade:** Must Have
**Objetivo:** Fluxo clínico utilizável de ponta a ponta + experiência de auth com identidade ARCA + disclaimer educacional pronto para safety-critical.

**Stories:** CORE-002b, CORE-004, CORE-005, CORE-009, EXP-001a, EXP-003, EXP-004, PAINEL-001, CORE-011, CORE-012 - 67 pts

---

### Épico 3 - Inteligência + dados + painel FE + offline pleno

**Período:** 27/05 – 10/06 (Sprint 3, 2 semanas)
**Prioridade:** Should Have / Could Have
**Objetivo:** Sugestão automática, modo emergência, painel sedação FE, engine offline guiada, sync, calculadora offline, painel pesquisa, exportação, notificações.

**Stories:** CORE-008, CORE-010, PAINEL-002, EXP-001b, EXP-001c, EXP-002, ADV-001, ADV-002, ADV-004 — 70 pts

---

### Épico 4 - Polimento, agenda + buffer

**Período:** 10/06 – 17/06 (1 semana)
**Prioridade:** Should/Could
**Objetivo:** Estabilizar, polir, dashboard pessoal, agenda de doses, E2E e documentação de handoff.

**Stories:** EXP-006, ADV-006, ADV-007, PAINEL-003 — 23 pts + buffer

---


## 👨‍💻 Equipe

### Desenvolvedores

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ariel-cs"><img height="460" src="https://github.com/user-attachments/assets/13d60fdf-6d99-4373-ac76-e441b8ffa840" width="100px;" alt="Ariel"/><br /><sub><b>Ariel</b></sub></a><br /><a href="https://github.com/ArcaEnsina/Arca_Ensina/commits?author=ariel-cs" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Torzinus"><img height="1002" src="https://github.com/user-attachments/assets/d889e425-ea83-4e75-acc2-00cbedef934e" width="100px;" alt="Heitor de Carvalho"/><br /><sub><b>Heitor de Carvalho</b></sub></a><br /><a href="https://github.com/ArcaEnsina/Arca_Ensina/commits?author=Torzinus" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/venici-o"><img height="460" src="https://github.com/user-attachments/assets/cd50eb23-3cc6-4d3d-a24b-20508b26b553" width="100px;" alt="Vinicius"/><br /><sub><b>Vinicius</b></sub></a><br /><a href="https://github.com/ArcaEnsina/Arca_Ensina/commits?author=venici-o" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://larissagiovanna.github.io/LarissaGiovanna/"><img height="850" src="https://github.com/user-attachments/assets/e2e2cf66-2b4a-4145-b129-8f0914e1f318" width="100px;" alt="Larissa Giovanna"/><br /><sub><b>Larissa Giovanna</b></sub></a><br /><a href="https://github.com/ArcaEnsina/Arca_Ensina/commits?author=LarissaGiovanna" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/RiosGabri"><img height="247" src="https://github.com/user-attachments/assets/db01344d-956e-4299-ad36-405d3d55cbc6" width="100px;" alt="Gabriel Parméra"/><br /><sub><b>Gabriel Parméra</b></sub></a><br /><a href="https://github.com/ArcaEnsina/Arca_Ensina/commits?author=RiosGabri" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/DoctahW"><img height="460" src="https://github.com/user-attachments/assets/3e3fc5df-922b-4fa1-b917-9692f34f8bc8" width="100px;" alt="João Euclides"/><br /><sub><b>João Euclides</b></sub></a><br /><a href="https://github.com/ArcaEnsina/Arca_Ensina/commits?author=DoctahW" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/joaorafaelsga"><img height="460" src="https://github.com/user-attachments/assets/1a12ecd5-2bdd-4847-9e59-befd29925384" width="100px;" alt="João Rafael"/><br /><sub><b>João Rafael</b></sub></a><br /><a href="https://github.com/ArcaEnsina/Arca_Ensina/commits?author=joaorafaelsga" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

### Designers

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><img height="460" src="https://github.com/user-attachments/assets/b54fc7cf-2594-4dbd-9039-c9cda11328ba" width="100px;" alt="Leticia Catunda"/><br /><sub><b>Leticia Catunda</b></sub><br />🎨</td>
      <td align="center" valign="top" width="14.28%"><img height="460" src="https://github.com/user-attachments/assets/ceb0ef58-5c2b-492c-8ffa-eaae9f4f54f9" width="100px;" alt="Maria Fernanda"/><br /><sub><b>Maria Fernanda</b></sub><br />🎨</td>
      <td align="center" valign="top" width="14.28%"><img height="460" src="https://github.com/user-attachments/assets/c28cb8f1-2ac9-4786-9869-e78bf1d22b3c" width="100px;" alt="Helena Nascimento"/><br /><sub><b>Helena Nascimento</b></sub><br />🎨</td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
