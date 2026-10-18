import { useState } from 'react';
import { View } from 'react-native';
import {
  ageFromBirthDate,
  birthDateFromAge,
  createPetSchema,
  PetSize,
  Sex,
  SEX_LABEL,
  SIZE_LABEL,
  Species,
  SPECIES_LABEL,
  type CreatePetInput,
  type PetResponse,
} from '@huellitas/shared';
import { Button, Chips, FormError, Text, TextField } from '@/components/ui';
import { errorMessage, fieldErrors } from '@/features/auth/errors';
import { PhotoPicker } from './photo-picker';
import { usePhotoUploads } from './use-photo-uploads';

const options = <T extends string>(labels: Record<T, string>, values: Record<string, T>) =>
  Object.values(values).map((value) => ({ value, label: labels[value] }));

const speciesOptions = options(SPECIES_LABEL, Species);
const sexOptions = options(SEX_LABEL, Sex);
const sizeOptions = options(SIZE_LABEL, PetSize);

type Props = {
  initial?: PetResponse;
  submitLabel: string;
  submitting: boolean;
  error: unknown;
  onSubmit: (input: CreatePetInput) => void;
};

const toInt = (v: string) => (v.trim() ? Number.parseInt(v, 10) : 0);

export function PetForm({ initial, submitLabel, submitting, error, onSubmit }: Props) {
  const uploads = usePhotoUploads(initial?.photos);
  const initialAge = initial?.approxBirthDate ? ageFromBirthDate(initial.approxBirthDate) : null;

  const [name, setName] = useState(initial?.name ?? '');
  const [species, setSpecies] = useState<Species | null>(initial?.species ?? null);
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? Sex.DESCONOCIDO);
  const [size, setSize] = useState<PetSize | null>(initial?.size ?? null);
  const [breed, setBreed] = useState(initial?.breed ?? '');
  const [color, setColor] = useState(initial?.color ?? '');
  const [years, setYears] = useState(initialAge ? String(initialAge.years) : '');
  const [months, setMonths] = useState(initialAge ? String(initialAge.months) : '');
  const [marks, setMarks] = useState(initial?.distinctiveMarks ?? '');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const errors = { ...fieldErrors(error), ...localErrors };
  const hasAge = years.trim() !== '' || months.trim() !== '';

  function submit() {
    const input = {
      name,
      species: species ?? undefined,
      sex: sex ?? Sex.DESCONOCIDO,
      size,
      breed,
      color,
      approxBirthDate: hasAge ? birthDateFromAge(toInt(years), toInt(months)) : null,
      distinctiveMarks: marks,
      mediaIds: uploads.mediaIds,
    };
    const parsed = createPetSchema.safeParse(input);
    if (!parsed.success) {
      setLocalErrors(
        Object.fromEntries(
          parsed.error.issues.map((i) => [
            String(i.path[0]),
            i.path[0] === 'species' ? 'Elegí una opción' : i.message,
          ]),
        ),
      );
      return;
    }
    setLocalErrors({});
    onSubmit(input as CreatePetInput);
  }

  const busy = uploads.uploading;
  const generalError =
    error && !Object.keys(fieldErrors(error)).length ? errorMessage(error) : null;

  return (
    <View className="gap-5">
      <PhotoPicker uploads={uploads} />
      <TextField label="Nombre" value={name} onChangeText={setName} error={errors['name']} />
      <Chips
        label="Especie"
        options={speciesOptions}
        value={species}
        onChange={setSpecies}
        error={errors['species']}
      />
      <Chips label="Sexo" options={sexOptions} value={sex} onChange={setSex} />
      <Chips label="Tamaño" options={sizeOptions} value={size} onChange={setSize} optional />
      <TextField
        label="Raza"
        value={breed}
        onChangeText={setBreed}
        placeholder="Mestizo, caniche, siamés…"
        error={errors['breed']}
      />
      <TextField
        label="Color"
        value={color}
        onChangeText={setColor}
        placeholder="Negro con manchas blancas"
        error={errors['color']}
      />
      <View className="gap-1.5">
        <Text variant="semibold" className="text-sm text-ink">
          Edad aproximada
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Años"
              value={years}
              onChangeText={setYears}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Meses"
              value={months}
              onChangeText={setMonths}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
        </View>
        {errors['approxBirthDate'] ? (
          <Text className="text-sm text-lost">{errors['approxBirthDate']}</Text>
        ) : null}
      </View>
      <TextField
        label="Señas particulares"
        value={marks}
        onChangeText={setMarks}
        placeholder="Collar rojo, una oreja caída, renguea un poco…"
        multiline
        textAlignVertical="top"
        style={{ height: 112, paddingTop: 12 }}
        error={errors['distinctiveMarks']}
      />
      <FormError message={generalError} />
      <Button
        title={busy ? 'Subiendo fotos…' : submitLabel}
        loading={submitting}
        disabled={busy}
        onPress={submit}
      />
    </View>
  );
}
