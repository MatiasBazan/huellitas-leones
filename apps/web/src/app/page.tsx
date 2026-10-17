import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Placeholder: el feed público llega en la Etapa 4
const sections = [
  { title: 'Perdidas', description: 'Ayudá a que vuelvan a casa.' },
  { title: 'Encontradas', description: '¿Es tuya? Contactá a quien la encontró.' },
  { title: 'En adopción', description: 'Dale un hogar a una mascota.' },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Huellita Leones</h1>
        <p className="text-lg text-muted-foreground">
          La red solidaria de mascotas de Leones, Córdoba.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <CardTitle>{s.title}</CardTitle>
              <CardDescription>{s.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div>
        <Button disabled>Muy pronto en Android</Button>
      </div>
    </main>
  );
}
