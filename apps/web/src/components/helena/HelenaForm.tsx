import { zodResolver } from '@hookform/resolvers/zod';
import { type HelenaNatalInput, helenaNatalInputSchema } from '@juliana/contracts';
import { useForm } from 'react-hook-form';
import { Button } from '../Button';

type Props = {
  pending: boolean;
  onEdit: () => void;
  onCalculate: (input: HelenaNatalInput, name: string) => void;
};

export const HelenaForm = ({ pending, onEdit, onCalculate }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HelenaNatalInput>({
    resolver: zodResolver(helenaNatalInputSchema),
    defaultValues: {
      date: '',
      time: '',
      utcOffsetMinutes: -180,
      houseSystem: 'P',
      zodiac: 'tropical',
    },
  });
  const field = (key: keyof HelenaNatalInput) => ({
    id: key,
    'aria-invalid': Boolean(errors[key]),
    'aria-describedby': errors[key] ? `${key}-error` : undefined,
  });
  const error = (key: keyof HelenaNatalInput) =>
    errors[key] && (
      <p id={`${key}-error`} className="field-error" role="alert">
        Confira este campo. {errors[key]?.message}
      </p>
    );
  return (
    <form
      className="panel space-y-5 p-5 md:p-7"
      onChange={onEdit}
      onSubmit={(event) => {
        const name = String(new FormData(event.currentTarget).get('subjectName') ?? '').trim();
        void handleSubmit((input) => onCalculate(input, name))(event);
      }}
    >
      <div>
        <p className="eyebrow">01 · Dados do mapa</p>
        <h2 className="display mt-2 text-2xl">Um céu, um instante.</h2>
      </div>
      <div>
        <label className="label" htmlFor="subjectName">
          Nome do mapa
        </label>
        <input
          id="subjectName"
          name="subjectName"
          className="input"
          required
          maxLength={120}
          placeholder="Identificação para sua revisão"
        />
        <p className="muted mt-1 text-xs">O nome permanece nesta tela e na exportação local.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="date">
            Data de nascimento
          </label>
          <input
            className="input"
            type="date"
            min="1600-01-01"
            max="2399-12-31"
            required
            {...field('date')}
            {...register('date')}
          />
          {error('date')}
        </div>
        <div>
          <label className="label" htmlFor="time">
            Hora local de nascimento
          </label>
          <input
            className="input"
            type="time"
            step="1"
            required
            {...field('time')}
            {...register('time')}
          />
          {error('time')}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="utcOffsetMinutes">
          Deslocamento UTC (minutos)
        </label>
        <input
          className="input"
          type="number"
          min="-840"
          max="840"
          step="1"
          required
          {...field('utcOffsetMinutes')}
          {...register('utcOffsetMinutes', { valueAsNumber: true })}
        />
        {error('utcOffsetMinutes')}
        <p className="muted mt-1 text-xs">
          UTC−3 = −180; UTC+5:30 = 330. Informe o fuso histórico, incluindo horário de verão quando
          aplicável.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="latitude">
            Latitude
          </label>
          <input
            className="input"
            type="number"
            min="-89.999999"
            max="89.999999"
            step="any"
            required
            placeholder="Ex.: −23.5505"
            {...field('latitude')}
            {...register('latitude', { valueAsNumber: true })}
          />
          {error('latitude')}
        </div>
        <div>
          <label className="label" htmlFor="longitude">
            Longitude
          </label>
          <input
            className="input"
            type="number"
            min="-180"
            max="180"
            step="any"
            required
            placeholder="Ex.: −46.6333"
            {...field('longitude')}
            {...register('longitude', { valueAsNumber: true })}
          />
          {error('longitude')}
        </div>
      </div>
      <p className="muted text-xs">
        Graus decimais: sul e oeste negativos. Confira as coordenadas do local de nascimento.
      </p>
      <div>
        <label className="label" htmlFor="houseSystem">
          Sistema de casas
        </label>
        <select className="input" {...field('houseSystem')} {...register('houseSystem')}>
          <option value="P">Placidus</option>
          <option value="K">Koch</option>
          <option value="E">Casas iguais</option>
          <option value="W">Signos inteiros</option>
        </select>
        {error('houseSystem')}
      </div>
      <div>
        <label className="label" htmlFor="zodiac">
          Zodíaco
        </label>
        <select className="input" {...field('zodiac')} {...register('zodiac')}>
          <option value="tropical">Tropical</option>
          <option value="lahiri">Sidéreo · Lahiri</option>
          <option value="fagan_bradley">Sidéreo · Fagan–Bradley</option>
        </select>
        {error('zodiac')}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Calculando…' : 'Calcular mapa natal'}
      </Button>
    </form>
  );
};
