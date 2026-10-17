import type { HelenaNatalResult } from '@juliana/contracts';
import { Button } from '../Button';
import { bodies, position } from './format';
import { HelenaChart } from './HelenaChart';

const aspectNames = {
  conjunction: 'Conjunção',
  sextile: 'Sextil',
  square: 'Quadratura',
  trine: 'Trígono',
  opposition: 'Oposição',
};
const phases = { applying: 'Aplicativo', separating: 'Separativo', exact: 'Exato' };

export const HelenaResults = ({ chart, name }: { chart: HelenaNatalResult; name: string }) => {
  const exportJson = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ tool: 'HELENA', name, chart }, null, 2)], {
        type: 'application/json',
      }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `helena-${chart.input.date}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <div className="min-w-0 space-y-6">
      <section className="panel p-5 md:p-7" aria-labelledby="chart-title">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">02 · Mapa natal</p>
            <h2 id="chart-title" className="display mt-2 break-words text-3xl">
              {name || 'Mapa natal'}
            </h2>
          </div>
          <Button variant="secondary" onClick={exportJson}>
            Exportar JSON
          </Button>
        </div>
        <p className="muted mt-3 text-sm">
          {chart.input.date} · {chart.input.time} · UTC{' '}
          {chart.input.utcOffsetMinutes >= 0 ? '+' : ''}
          {chart.input.utcOffsetMinutes} min ·{' '}
          {chart.input.zodiac === 'tropical'
            ? 'Tropical'
            : chart.input.zodiac === 'lahiri'
              ? 'Sidéreo Lahiri'
              : 'Sidéreo Fagan–Bradley'}
        </p>
        <HelenaChart chart={chart} />
        <dl className="grid gap-4 border-t border-ivory-100/15 pt-4 sm:grid-cols-2">
          <div>
            <dt className="muted text-xs">Ascendente</dt>
            <dd>{position(chart.ascendant)}</dd>
          </div>
          <div>
            <dt className="muted text-xs">Meio do Céu</dt>
            <dd>{position(chart.midheaven)}</dd>
          </div>
        </dl>
        <p className="muted mt-4 text-xs">
          Swiss Ephemeris {chart.engine.version} · efeméride Moshier · JD UT{' '}
          {chart.julianDayUt.toFixed(6)}
          {chart.input.zodiac !== 'tropical' && ` · Ayanamsa ${chart.ayanamsa.toFixed(6)}°`}
        </p>
      </section>
      <section className="panel min-w-0 p-5 md:p-7">
        <h2 className="display text-2xl">Posições planetárias</h2>
        <div
          className="mt-4 overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Tabela de posições planetárias"
        >
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Posições e movimento dos dez planetas</caption>
            <thead>
              <tr>
                {['Corpo', 'Posição', 'Casa', 'Movimento'].map((label) => (
                  <th className="p-2" scope="col" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.bodies.map((body) => (
                <tr key={body.id} className="border-t border-ivory-100/15">
                  <th scope="row" className="whitespace-nowrap p-2 font-medium">
                    {bodies[body.id][1]} {bodies[body.id][0]}
                  </th>
                  <td className="whitespace-nowrap p-2">{position(body.longitude)}</td>
                  <td className="p-2">{body.house}</td>
                  <td className="p-2">{body.retrograde ? 'Retrógrado' : 'Direto'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="panel p-5 md:p-7">
        <h2 className="display text-2xl">Casas</h2>
        <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {chart.houses.map((cusp, i) => (
            <div
              className="flex justify-between gap-4 border-b border-ivory-100/15 pb-2 text-sm"
              key={i}
            >
              <dt>Casa {i + 1}</dt>
              <dd>{position(cusp)}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="panel min-w-0 p-5 md:p-7">
        <h2 className="display text-2xl">Aspectos</h2>
        <p className="muted mt-2 text-xs">
          Orbes: conjunção e oposição 8°; quadratura e trígono 6°; sextil 4°. Fase estimada pelo
          movimento instantâneo.
        </p>
        <div
          className="mt-4 overflow-x-auto"
          tabIndex={0}
          role="region"
          aria-label="Tabela de aspectos"
        >
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Aspectos maiores entre planetas</caption>
            <thead>
              <tr>
                {['Planetas', 'Aspecto', 'Orbe', 'Fase'].map((label) => (
                  <th scope="col" className="p-2" key={label}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.aspects.map((aspect) => (
                <tr
                  className="border-t border-ivory-100/15"
                  key={`${aspect.bodyA}-${aspect.bodyB}`}
                >
                  <th scope="row" className="whitespace-nowrap p-2 font-medium">
                    {bodies[aspect.bodyA][0]} · {bodies[aspect.bodyB][0]}
                  </th>
                  <td className="p-2">{aspectNames[aspect.type]}</td>
                  <td className="p-2">{aspect.orb.toFixed(2)}°</td>
                  <td className="p-2">{phases[aspect.phase]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!chart.aspects.length && (
          <p className="muted mt-4 text-sm">Nenhum aspecto dentro dos orbes definidos.</p>
        )}
      </section>
    </div>
  );
};
