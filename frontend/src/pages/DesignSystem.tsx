import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Bold, Italic, Underline } from "lucide-react";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-heading-lg font-heading border-b border-border pb-2 mb-4">
      {children}
    </h2>
  );
}

export default function DesignSystem() {
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <h1 className="text-display-lg font-heading">ARCA Design System</h1>

          {/* ── Buttons ── */}
          <section>
            <SectionHeading>Button</SectionHeading>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="default">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Extra Small</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Disabled</Button>
                <Button variant="outline" disabled>
                  Disabled Outline
                </Button>
              </div>
            </div>
          </section>

          {/* ── Inputs ── */}
          <section>
            <SectionHeading>Input</SectionHeading>
            <div className="space-y-4 max-w-sm">
              <Input placeholder="Default input" />
              <Input placeholder="Disabled input" disabled />
              <Input placeholder="Error input" aria-invalid="true" />
              <Input type="password" placeholder="Password" />
            </div>
          </section>

          {/* ── Cards ── */}
          <section>
            <SectionHeading>Card</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>Card description goes here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This is the card content area. It can hold any content.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Small Card</CardTitle>
                  <CardDescription>A smaller variant.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Compact card content.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ── Badges ── */}
          <section>
            <SectionHeading>Badge</SectionHeading>
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="ghost">Ghost</Badge>
              <Badge variant="link">Link</Badge>
            </div>
          </section>

          {/* ── Skeleton ── */}
          <section>
            <SectionHeading>Skeleton</SectionHeading>
            <div className="space-y-3 max-w-sm">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </section>

          {/* ── Toast ── */}
          <section>
            <SectionHeading>Toast (Sonner)</SectionHeading>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => toast("This is a default toast.")}
              >
                Default Toast
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.success("Success! Operation completed.")}
              >
                Success Toast
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.error("Error! Something went wrong.")}
              >
                Error Toast
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  toast.info("Info: Please note this information.")
                }
              >
                Info Toast
              </Button>
            </div>
          </section>

          {/* ── Dialog ── */}
          <section>
            <SectionHeading>Dialog</SectionHeading>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog Title</DialogTitle>
                  <DialogDescription>
                    This is a dialog description. It provides context about the
                    dialog.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p>Dialog body content goes here.</p>
                </div>
                <DialogFooter showCloseButton />
              </DialogContent>
            </Dialog>
          </section>

          {/* ── Sheet ── */}
          <section>
            <SectionHeading>Sheet</SectionHeading>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet Title</SheetTitle>
                  <SheetDescription>
                    Sheet description goes here.
                  </SheetDescription>
                </SheetHeader>
                <div className="p-6">
                  <p>Sheet body content.</p>
                </div>
                <SheetFooter>
                  <Button size="sm">Save</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </section>

          {/* ── Tooltip ── */}
          <section>
            <SectionHeading>Tooltip</SectionHeading>
            <div className="flex gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary">Another tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>More information here</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </section>

          {/* ── Tabs ── */}
          <section>
            <SectionHeading>Tabs</SectionHeading>
            <Tabs defaultValue="account">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent
                value="account"
                className="p-4 border border-border rounded-xl mt-2"
              >
                <p>Account settings content.</p>
              </TabsContent>
              <TabsContent
                value="password"
                className="p-4 border border-border rounded-xl mt-2"
              >
                <p>Password settings content.</p>
              </TabsContent>
              <TabsContent
                value="settings"
                className="p-4 border border-border rounded-xl mt-2"
              >
                <p>General settings content.</p>
              </TabsContent>
            </Tabs>
          </section>

          {/* ── Select ── */}
          <section>
            <SectionHeading>Select</SectionHeading>
            <Select>
              <SelectTrigger className="w-50">
                <SelectValue placeholder="Select a fruit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="cherry">Cherry</SelectItem>
                <SelectItem value="grape">Grape</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {/* ── Command (Combobox) ── */}
          <section>
            <SectionHeading>Command (Combobox)</SectionHeading>
            <div className="max-w-sm border border-border rounded-xl overflow-hidden">
              <Command>
                <CommandInput placeholder="Search..." />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Frameworks">
                    <CommandItem>React</CommandItem>
                    <CommandItem>Vue</CommandItem>
                    <CommandItem>Angular</CommandItem>
                    <CommandItem>Svelte</CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
          </section>

          {/* ── Toggle ── */}
          <section>
            <SectionHeading>Toggle</SectionHeading>
            <div className="flex flex-wrap items-center gap-3">
              <Toggle>Toggle</Toggle>
              <Toggle variant="outline">Outline</Toggle>
              <Toggle disabled>Disabled</Toggle>
            </div>
          </section>

          {/* ── ToggleGroup ── */}
          <section>
            <SectionHeading>ToggleGroup</SectionHeading>
            <ToggleGroup type="multiple">
              <ToggleGroupItem value="bold" aria-label="Toggle bold">
                <Bold className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Toggle italic">
                <Italic className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Toggle underline">
                <Underline className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </section>

          {/* ── Popover ── */}
          <section>
            <SectionHeading>Popover</SectionHeading>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Open Popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <div className="space-y-2">
                  <h4 className="font-medium">Popover Title</h4>
                  <p className="text-sm text-muted-foreground">
                    This is popover content. It can contain any information.
                  </p>
                </div>
              </PopoverContent>
            </Popover>
          </section>

          {/* ── NavigationMenu ── */}
          <section>
            <SectionHeading>NavigationMenu</SectionHeading>
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="p-4 w-75">
                      <NavigationMenuLink>
                        <div className="font-medium">Calculator</div>
                        <p className="text-muted-foreground text-sm">
                          Dose calculation tool
                        </p>
                      </NavigationMenuLink>
                      <NavigationMenuLink>
                        <div className="font-medium">Protocols</div>
                        <p className="text-muted-foreground text-sm">
                          Clinical protocols
                        </p>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="p-4 w-75">
                      <NavigationMenuLink>
                        <div className="font-medium">Documentation</div>
                        <p className="text-muted-foreground text-sm">
                          Guides and references
                        </p>
                      </NavigationMenuLink>
                      <NavigationMenuLink>
                        <div className="font-medium">Bulario</div>
                        <p className="text-muted-foreground text-sm">
                          Drug database
                        </p>
                      </NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </section>

          {/* ── Color Palette ── */}
          <section>
            <SectionHeading>ARCA Color Palette</SectionHeading>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Arca Blue</h3>
                <div className="flex gap-1">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                    (shade) => (
                      <div key={shade} className="text-center">
                        <div
                          className="w-12 h-12 rounded-lg"
                          style={{
                            backgroundColor: `var(--arca-blue-${shade})`,
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {shade}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Arca Red</h3>
                <div className="flex gap-1">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                    (shade) => (
                      <div key={shade} className="text-center">
                        <div
                          className="w-12 h-12 rounded-lg"
                          style={{
                            backgroundColor: `var(--arca-red-${shade})`,
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {shade}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Neutral</h3>
                <div className="flex gap-1">
                  {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map(
                    (shade) => (
                      <div key={shade} className="text-center">
                        <div
                          className="w-12 h-12 rounded-lg"
                          style={{ backgroundColor: `var(--neutral-${shade})` }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {shade}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Semantic</h3>
                <div className="flex gap-3">
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg"
                      style={{ backgroundColor: "var(--success)" }}
                    />
                    <span className="text-xs text-muted-foreground">
                      success
                    </span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg"
                      style={{ backgroundColor: "var(--warning)" }}
                    />
                    <span className="text-xs text-muted-foreground">
                      warning
                    </span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg"
                      style={{ backgroundColor: "var(--danger)" }}
                    />
                    <span className="text-xs text-muted-foreground">
                      danger
                    </span>
                  </div>
                  <div className="text-center">
                    <div
                      className="w-16 h-16 rounded-lg"
                      style={{ backgroundColor: "var(--info)" }}
                    />
                    <span className="text-xs text-muted-foreground">info</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Shadows ── */}
          <section>
            <SectionHeading>Shadows</SectionHeading>
            <div className="flex flex-wrap gap-4">
              <div
                className="w-24 h-24 rounded-xl bg-card flex items-center justify-center text-xs text-muted-foreground"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                sm
              </div>
              <div
                className="w-24 h-24 rounded-xl bg-card flex items-center justify-center text-xs text-muted-foreground"
                style={{ boxShadow: "var(--shadow-md)" }}
              >
                md
              </div>
              <div
                className="w-24 h-24 rounded-xl bg-card flex items-center justify-center text-xs text-muted-foreground"
                style={{ boxShadow: "var(--shadow-lg)" }}
              >
                lg
              </div>
              <div
                className="w-24 h-24 rounded-xl bg-card flex items-center justify-center text-xs text-muted-foreground"
                style={{ boxShadow: "var(--shadow-xl)" }}
              >
                xl
              </div>
              <div
                className="w-24 h-24 rounded-xl bg-card flex items-center justify-center text-xs text-muted-foreground"
                style={{ boxShadow: "var(--shadow-emergency)" }}
              >
                emergency
              </div>
            </div>
          </section>

          {/* ── Typography ── */}
          <section>
            <SectionHeading>Typography</SectionHeading>
            <div className="space-y-2">
              <p className="text-display-lg font-heading">
                Display LG · 40 / 1.1 / 800
              </p>
              <p className="text-display-md font-heading">
                Display MD · 32 / 1.15 / 700
              </p>
              <p className="text-display-sm font-heading">
                Display SM · 24 / 1.2 / 700
              </p>
              <p className="text-heading-lg font-heading">
                Heading LG · 20 / 1.3 / 600
              </p>
              <p className="text-heading-md font-heading">
                Heading MD · 18 / 1.4 / 600
              </p>
              <p className="text-body-lg">Body LG · 16 / 1.5 / 400</p>
              <p className="text-body-md">Body MD · 14 / 1.5 / 400</p>
              <p className="text-caption text-muted-foreground">
                Caption · 12 / 1.4 / 500
              </p>
              <p className="text-numeric-hero font-numeric tabular-nums">
                123.456
              </p>
              <p className="text-numeric-md font-numeric tabular-nums">
                123.456
              </p>
            </div>
          </section>
        </div>
      </div>
    </TooltipProvider>
  );
}
