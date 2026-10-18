import { useState } from 'react';
import { View } from 'react-native';
import {
  createPostSchema,
  PetSize,
  reportLostSchema,
  Sex,
  SEX_LABEL,
  SIZE_LABEL,
  Species,
  SPECIES_LABEL,
  updatePostSchema,
  type PostResponse,
  type PostType,
} from '@huellitas/shared';
import { Button, Chips, FormError, Text, TextField } from '@/components/ui';
import { errorMessage, fieldErrors } from '@/features/auth/errors';
import { PhotoPicker } from '@/features/pets/photo-picker';
import { usePhotoUploads } from '@/features/pets/use-photo-uploads';
import {
  daysAgoFrom,
  DayPicker,
  eventDateFor,
  NeighborhoodPicker,
  ShowPhoneSwitch,
} from './form-fields';

const options = <T extends string>(labels: Record<T, string>, values: Record<string, T>) =>
  Object.values(values).map((value) => ({ value, label: labels[value] }));

type YesNo = 'SI' | 'NO';
const yesNoOptions: { value: YesNo; label: string }[] = [
  { value: 'SI', label: 'Sí' },
  { value: 'NO', label: 'No' },
];
const toYesNo = (v: boolean | null | undefined): YesNo | null =>
  v == null ? null : v ? 'SI' : 'NO';
const fromYesNo = (v: YesNo | null) => (v === null ? null : v === 'SI');

const DATE_LABEL: Record<PostType, string> = {
  PERDIDA: '¿Cuándo se perdió?',
  ENCONTRADA: '¿Cuándo la encontraste?',
  ADOPCION: '',
};

const DESCRIPTION_HINT: Record<PostType, string> = {
  PERDIDA: 'Cómo se perdió, cómo reacciona con extraños, si tiene collar…',
  ENCONTRADA: 'Dónde la viste, cómo está, si tiene collar. Si la tenés en tu casa, contalo.',
  ADOPCION: 'Cómo es, cómo se lleva con chicos y otros animales, por qué la das en adopción.',
};

type Props = {
  type: PostType;
  /** Edición: precarga y manda solo lo editable */
  initial?: PostResponse;
  submitLabel: string;
  submitting: boolean;
  error: unknown;
  onSubmit: (body: Record<string, unknown>) => void;
};

const toInt = (v: string) => (v.trim() ? Number.parseInt(v, 10) : 0);

export function PostForm({ type, initial, submitLabel, submitting, error, onSubmit }: Props) {
  const isLost = type === 'PERDIDA';
  const isAdoption = type === 'ADOPCION';
  const adoption = initial?.adoption;

  const uploads = usePhotoUploads(initial?.photos);
  const [species, setSpecies] = useState<Species | null>(initial?.species ?? null);
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? Sex.DESCONOCIDO);
  const [size, setSize] = useState<PetSize | null>(initial?.size ?? null);
  const [color, setColor] = useState(initial?.color ?? '');
  const [daysAgo, setDaysAgo] = useState(initial ? daysAgoFrom(initial.eventDate) : 0);
  const [neighborhoodId, setNeighborhoodId] = useState<string | null>(
    initial?.neighborhood?.id ?? null,
  );
  const [zoneText, setZoneText] = useState(initial?.zoneText ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [showPhone, setShowPhone] = useState(initial?.showPhone ?? true);
  const [years, setYears] = useState(
    adoption?.approxAgeMonths != null ? String(Math.floor(adoption.approxAgeMonths / 12)) : '',
  );
  const [months, setMonths] = useState(
    adoption?.approxAgeMonths != null ? String(adoption.approxAgeMonths % 12) : '',
  );
  const [neutered, setNeutered] = useState(toYesNo(adoption?.neutered));
  const [vaccinated, setVaccinated] = useState(toYesNo(adoption?.vaccinated));
  const [dewormed, setDewormed] = useState(toYesNo(adoption?.dewormed));
  const [requirements, setRequirements] = useState(adoption?.requirements ?? '');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // La fecha solo se manda si cambió: al editar, una fecha de más de 7 días no se pisa
  const dateChanged = !initial || daysAgo !== daysAgoFrom(initial.eventDate);

  function buildBody(): Record<string, unknown> {
    const place = { neighborhoodId, zoneText, description, showPhone };
    const date = !isAdoption && dateChanged ? { eventDate: eventDateFor(daysAgo) } : {};
    if (isLost) return { ...place, ...date };

    const animal = { species: species ?? undefined, sex: sex ?? Sex.DESCONOCIDO, size, color };
    const hasAge = years.trim() !== '' || months.trim() !== '';
    const adoptionBody = isAdoption
      ? {
          adoption: {
            approxAgeMonths: hasAge ? toInt(years) * 12 + toInt(months) : null,
            neutered: fromYesNo(neutered),
            vaccinated: fromYesNo(vaccinated),
            dewormed: fromYesNo(dewormed),
            requirements,
          },
        }
      : {};
    return { ...animal, ...place, ...date, ...adoptionBody, mediaIds: uploads.mediaIds };
  }

  function submit() {
    const body = buildBody();
    const schema = initial ? updatePostSchema : isLost ? reportLostSchema : createPostSchema;
    const parsed = schema.safeParse(initial || isLost ? body : { type, ...body });
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
    onSubmit(initial || isLost ? body : { type, ...body });
  }

  const errors = { ...fieldErrors(error), ...localErrors };
  const generalError =
    error && !Object.keys(fieldErrors(error)).length ? errorMessage(error) : null;
  const busy = uploads.uploading;

  return (
    <View className="gap-5">
      {!isLost ? (
        <View className="gap-1">
          <PhotoPicker
            uploads={uploads}
            hint={
              isAdoption
                ? 'Fotos lindas y con buena luz ayudan a que la adopten.'
                : 'Sacale fotos de frente y de costado: así la familia la reconoce.'
            }
          />
          {errors['mediaIds'] ? (
            <Text className="text-sm text-lost">{errors['mediaIds']}</Text>
          ) : null}
        </View>
      ) : null}

      {!isLost ? (
        <>
          <Chips
            label="Especie"
            options={options(SPECIES_LABEL, Species)}
            value={species}
            onChange={setSpecies}
            error={errors['species']}
          />
          <Chips label="Sexo" options={options(SEX_LABEL, Sex)} value={sex} onChange={setSex} />
          <Chips
            label="Tamaño"
            options={options(SIZE_LABEL, PetSize)}
            value={size}
            onChange={setSize}
            optional
          />
          <TextField
            label="Color"
            value={color}
            onChangeText={setColor}
            placeholder="Negro con manchas blancas"
            error={errors['color']}
          />
        </>
      ) : null}

      {isAdoption ? (
        <>
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
          </View>
          <Chips
            label="¿Castrada?"
            options={yesNoOptions}
            value={neutered}
            onChange={setNeutered}
            optional
          />
          <Chips
            label="¿Vacunada?"
            options={yesNoOptions}
            value={vaccinated}
            onChange={setVaccinated}
            optional
          />
          <Chips
            label="¿Desparasitada?"
            options={yesNoOptions}
            value={dewormed}
            onChange={setDewormed}
            optional
          />
        </>
      ) : null}

      {!isAdoption ? (
        <DayPicker label={DATE_LABEL[type]} value={daysAgo} onChange={setDaysAgo} />
      ) : null}
      {errors['eventDate'] ? (
        <Text className="text-sm text-lost">{errors['eventDate']}</Text>
      ) : null}

      <NeighborhoodPicker value={neighborhoodId} onChange={setNeighborhoodId} />
      <TextField
        label={isAdoption ? 'Zona (opcional)' : 'Zona o referencia'}
        value={zoneText}
        onChangeText={setZoneText}
        placeholder="Cerca de la plaza, frente a la escuela…"
        error={errors['zoneText']}
      />
      <TextField
        label="Descripción"
        value={description}
        onChangeText={setDescription}
        placeholder={DESCRIPTION_HINT[type]}
        multiline
        textAlignVertical="top"
        style={{ height: 120, paddingTop: 12 }}
        error={errors['description']}
      />
      {isAdoption ? (
        <TextField
          label="Requisitos para adoptar"
          value={requirements}
          onChangeText={setRequirements}
          placeholder="Patio cerrado, castración, seguimiento…"
          multiline
          textAlignVertical="top"
          style={{ height: 96, paddingTop: 12 }}
          error={errors['adoption']}
        />
      ) : null}
      {isAdoption ? (
        <Text className="-mt-3 text-xs text-ink-muted">
          En Huellita Leones las adopciones son siempre gratuitas: no se cobra por los animales.
        </Text>
      ) : null}

      <ShowPhoneSwitch value={showPhone} onChange={setShowPhone} />
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
