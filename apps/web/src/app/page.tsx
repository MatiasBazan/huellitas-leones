import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Placeholder: el feed público llega en la Etapa 4
const sections = [
  { title: 'Perdidas', description: 'Ayudá a que vuelvan a casa.', color: 'bg-lost' },
  {
    title: 'Encontradas',
    description: '¿Es tuya? Contactá a quien la encontró.',
    color: 'bg-found',
  },
  { title: 'En adopción', description: 'Dale un hogar a una mascota.', color: 'bg-adoption' },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-4 py-16">
      <header className="flex flex-col gap-5">
        <h1>
          <Logo />
        </h1>
        <p className="text-lg text-muted-foreground">
          La red solidaria de mascotas de Leones, Córdoba.
        </p>
      </header>
      <div className="grid gap-4 sm:grid-cols-3">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader>
              <span className={`mb-1 h-1.5 w-10 rounded-full ${s.color}`} aria-hidden="true" />
              <CardTitle className="text-lg font-bold">{s.title}</CardTitle>
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
