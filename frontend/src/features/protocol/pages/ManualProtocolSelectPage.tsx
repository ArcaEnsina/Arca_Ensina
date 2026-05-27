import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, Search, X, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useProtocols, type ProtocolFilters } from '../api'
import ProtocolCatalogCard from '../components/ProtocolCatalogCard'
import ProtocolPreviewSheet from '../components/ProtocolPreviewSheet'
import type { ProtocolListItem } from '../types'

const TAG_CHIPS = ['UTIP', 'Emergência', 'Dengue', 'Sedação', 'Asma', 'Choque']

export default function ManualProtocolSelectPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') ?? '')
  const [type, setType] = useState(searchParams.get('type') ?? 'todos')
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') ?? '')
  const [gender, setGender] = useState(searchParams.get('gender') ?? '')
  const [ageMin, setAgeMin] = useState(searchParams.get('age_min') ?? '')
  const [ageMax, setAgeMax] = useState(searchParams.get('age_max') ?? '')
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const [selectedProtocol, setSelectedProtocol] =
    useState<ProtocolListItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Debounced search → URL sync
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const [debouncedSearch, setDebouncedSearch] = useState(search)

  useEffect(() => {
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(debounceRef.current)
  }, [search])

  // Build filters
  const filters: ProtocolFilters = {}
  if (debouncedSearch) filters.search = debouncedSearch
  if (type && type !== 'todos') filters.type = type as 'guiado' | 'painel'
  if (selectedTag) filters.tag = selectedTag
  if (gender === 'M' || gender === 'F') filters.gender = gender
  if (ageMin) filters.age_min = Number(ageMin)
  if (ageMax) filters.age_max = Number(ageMax)

  const { data, isLoading, isError } = useProtocols(filters)

  // Sync filters → URL
  useEffect(() => {
    const params: Record<string, string> = {}
    if (debouncedSearch) params.search = debouncedSearch
    if (type && type !== 'todos') params.type = type
    if (selectedTag) params.tag = selectedTag
    if (gender) params.gender = gender
    if (ageMin) params.age_min = ageMin
    if (ageMax) params.age_max = ageMax
    setSearchParams(params, { replace: true })
  }, [debouncedSearch, type, selectedTag, gender, ageMin, ageMax, setSearchParams])

  const clearFilters = useCallback(() => {
    setSearch('')
    setType('todos')
    setSelectedTag('')
    setGender('')
    setAgeMin('')
    setAgeMax('')
  }, [])

  const handlePreview = useCallback((protocol: ProtocolListItem) => {
    setSelectedProtocol(protocol)
    setPreviewOpen(true)
  }, [])

  const handleStart = useCallback(
    (protocol: ProtocolListItem) => {
      if (protocol.current_version_type === 'painel') {
        navigate('/sedation')
      } else {
        navigate(`/protocols/${protocol.id}/execute`)
      }
    },
    [navigate]
  )

  const toggleTag = useCallback(
    (tag: string) => {
      setSelectedTag((prev) => (prev === tag ? '' : tag))
    },
    []
  )

  return (
    <div className="flex flex-col gap-6 px-5 py-4 tablet:px-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/dashboard"
          className="flex size-10 items-center justify-center rounded-full border border-border transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
          aria-label="Voltar"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-heading-lg">Catálogo de Protocolos</h1>
      </div>

      {/* Search */}
      <div role="search" className="relative">
        <Search
          size={18}
          className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          placeholder="Buscar por nome, especialidade ou CID"
          aria-label="Buscar protocolos"
          className="pl-10 pr-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            aria-label="Limpar busca"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <ToggleGroup
          type="single"
          value={type}
          onValueChange={(value) => setType(value || 'todos')}
        >
          <ToggleGroupItem value="todos">Todos</ToggleGroupItem>
          <ToggleGroupItem value="guiado">Guiado</ToggleGroupItem>
          <ToggleGroupItem value="painel">Painel</ToggleGroupItem>
        </ToggleGroup>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setAdvancedOpen(true)}
          aria-label="Filtros avançados"
        >
          <SlidersHorizontal size={16} />
        </Button>
      </div>

      {/* Tag chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {TAG_CHIPS.map((tag) => (
          <Badge
            key={tag}
            variant={selectedTag === tag ? 'default' : 'outline'}
            className="cursor-pointer select-none"
            onClick={() => toggleTag(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      {/* Advanced filters sheet */}
      <Sheet open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Filtros avançados</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-6 py-4">
            <div>
              <label className="text-body-md mb-1 block font-medium text-foreground">
                Idade mínima
              </label>
              <Input
                type="number"
                placeholder="Ex: 0"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="text-body-md mb-1 block font-medium text-foreground">
                Idade máxima
              </label>
              <Input
                type="number"
                placeholder="Ex: 18"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                min={0}
              />
            </div>
            <div>
              <label className="text-body-md mb-1 block font-medium text-foreground">
                Gênero
              </label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="F">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter>
            <Button
              variant="default"
              size="lg"
              className="w-full rounded-full"
              onClick={() => setAdvancedOpen(false)}
            >
              Aplicar filtros
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Results */}
      <div aria-live="polite" className="sr-only">
        {data ? `${data.results.length} protocolos encontrados` : ''}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-4xl bg-neutral-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-body-lg text-muted-foreground">
            Erro ao carregar protocolos.
          </p>
          <p className="text-body-md text-muted-foreground">
            Verifique sua conexão e tente novamente.
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.results.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-body-lg text-muted-foreground">
            Nenhum protocolo encontrado
          </p>
          <p className="text-body-md text-muted-foreground">
            Tente ajustar os filtros de busca.
          </p>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      )}

      {!isLoading && !isError && data && data.results.length > 0 && (
        <div role="list" aria-label="Protocolos" className="flex flex-col gap-4">
          {data.results.map((protocol) => (
            <div key={protocol.id} role="listitem">
              <ProtocolCatalogCard
                protocol={protocol}
                onPreview={() => handlePreview(protocol)}
                onStart={() => handleStart(protocol)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Preview sheet */}
      <ProtocolPreviewSheet
        protocol={selectedProtocol}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onStart={() => selectedProtocol && handleStart(selectedProtocol)}
      />
    </div>
  )
}
