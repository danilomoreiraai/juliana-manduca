import { ArrowRight, CalendarDays, Compass, MoonStar, Sparkles } from 'lucide-react';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { whatsappUrl } from '../services/auth';

const services = [
  {
    icon: Compass,
    title: 'Mapa natal',
    text: 'Uma leitura profunda dos potenciais, movimentos e escolhas que formam sua história.',
  },
  {
    icon: MoonStar,
    title: 'Direcionamento de ciclos',
    text: 'Clareza para compreender o momento presente e caminhar pelos próximos ciclos.',
  },
  {
    icon: Sparkles,
    title: 'Astrocartografia',
    text: 'Uma perspectiva sobre sua relação com lugares, mudanças e experiências pelo mundo.',
  },
];

export const HomePage = () => {
  const whatsapp = whatsappUrl();
  return (
    <div className="cosmic-bg min-h-screen overflow-hidden">
      <SiteHeader />
      <main>
        <section
          className="relative min-h-[76vh] overflow-hidden px-5 pb-20 pt-32 lg:px-8"
          aria-labelledby="hero-title"
        >
          <div className="star-field absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl">
            <div className="max-w-4xl py-10">
              <p className="eyebrow mb-6">Astrologia consciente</p>
              <h1
                id="hero-title"
                className="display text-6xl leading-[.94] text-ivory-100 sm:text-7xl lg:text-[6.6rem]"
              >
                Entender seus ciclos.
                <br />
                <span className="text-gold-300">Escolher seu caminho.</span>
              </h1>
              <p className="muted mt-8 max-w-xl text-lg leading-relaxed">
                Um espaço de escuta e orientação para transformar símbolos em consciência — e
                consciência em movimento.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                {whatsapp ? (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gold-500 px-6 font-semibold text-ink-950 hover:bg-gold-300"
                  >
                    Conhecer atendimentos <ArrowRight size={18} />
                  </a>
                ) : (
                  <a
                    href="#atendimentos"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-gold-500 px-6 font-semibold text-ink-950"
                  >
                    Conhecer atendimentos <ArrowRight size={18} />
                  </a>
                )}
                <a
                  href="#sobre"
                  className="inline-flex min-h-12 items-center rounded-full border border-white/15 px-6 text-ivory-100 hover:bg-white/5"
                >
                  Sobre Juliana
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="atendimentos" className="px-5 py-28 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="eyebrow">Atendimentos</p>
            <div className="mt-4 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <h2 className="display max-w-2xl text-5xl sm:text-6xl">
                Leituras para o momento que você vive.
              </h2>
              <p className="muted max-w-sm">
                Cada encontro é individual e desenhado a partir da sua história. Valores e formatos
                são apresentados no primeiro contato.
              </p>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {services.map(({ icon: Icon, title, text }, index) => (
                <article
                  key={title}
                  className="panel group rounded-3xl p-7 transition hover:-translate-y-1 hover:border-gold-500/30"
                >
                  <span className="text-xs text-gold-300/60">0{index + 1}</span>
                  <Icon className="mt-10 text-gold-500" />
                  <h3 className="display mt-5 text-3xl">{title}</h3>
                  <p className="muted mt-4 leading-relaxed">{text}</p>
                  <p className="mt-7 text-sm text-gold-300">Consulte valores</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="como-funciona"
          className="border-y border-white/8 bg-ink-900/55 px-5 py-28 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="eyebrow">Como funciona</p>
              <h2 className="display mt-4 text-5xl">
                Um encontro com tempo, contexto e profundidade.
              </h2>
            </div>
            <ol className="grid gap-5 sm:grid-cols-3">
              {[
                [
                  '01',
                  'Primeiro contato',
                  'Você compartilha o que busca e escolhemos o atendimento adequado.',
                ],
                [
                  '02',
                  'Encontro online',
                  'A sessão acontece ao vivo, com espaço para perguntas e reflexão.',
                ],
                [
                  '03',
                  'Continuidade',
                  'Após o encontro, materiais combinados ficam disponíveis na sua área privada.',
                ],
              ].map(([number, title, text]) => (
                <li key={number} className="border-l border-gold-500/30 pl-5">
                  <span className="text-sm text-gold-300">{number}</span>
                  <h3 className="mt-5 font-semibold">{title}</h3>
                  <p className="muted mt-3 text-sm leading-relaxed">{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="sobre" className="px-5 py-28 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow">Sobre Juliana</p>
              <h2 className="display mt-4 text-5xl sm:text-6xl">
                Astrologia como bússola, não como sentença.
              </h2>
            </div>
            <div>
              <p className="text-xl leading-relaxed text-ivory-200">
                Meu trabalho parte da escuta e do respeito à singularidade. A astrologia entra como
                uma linguagem para reconhecer padrões, nomear movimentos e ampliar escolhas.
              </p>
              <p className="muted mt-6 leading-relaxed">
                Este é um texto inicial. A história, formação e abordagem completa serão refinadas
                antes da publicação definitiva.
              </p>
            </div>
          </div>
        </section>

        <section className="px-5 pb-28 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-gold-500/20 bg-plum-700/35 p-8 text-center sm:p-14">
            <CalendarDays className="mx-auto text-gold-500" />
            <h2 className="display mt-5 text-4xl sm:text-5xl">
              Pronta para olhar seu momento com mais clareza?
            </h2>
            <p className="muted mx-auto mt-4 max-w-xl">
              Entre em contato para conhecer os formatos de atendimento e encontrar o mais adequado
              para você.
            </p>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-gold-500 px-7 font-semibold text-ink-950 hover:bg-gold-300"
              >
                Conversar pelo WhatsApp <ArrowRight size={18} />
              </a>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};
