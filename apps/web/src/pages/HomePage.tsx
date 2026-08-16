import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Compass,
  MapPinned,
  MoonStar,
} from 'lucide-react';
import { m, useReducedMotion } from 'motion/react';
import { Reveal } from '../components/MotionPrimitives';
import { SiteFooter } from '../components/SiteFooter';
import { SiteHeader } from '../components/SiteHeader';
import { whatsappUrl } from '../services/auth';

const services = [
  {
    title: 'Mapa natal',
    text: 'Uma leitura profunda dos potenciais, movimentos e escolhas que formam sua história.',
    accent: 'service-lavender',
    icon: Compass,
  },
  {
    title: 'Direcionamento de ciclos',
    text: 'Clareza para compreender o momento presente e caminhar pelos próximos ciclos.',
    accent: 'service-gold',
    icon: MoonStar,
  },
  {
    title: 'Astrocartografia',
    text: 'Uma perspectiva sobre sua relação com lugares, mudanças e experiências pelo mundo.',
    accent: 'service-rose',
    icon: MapPinned,
  },
];

const steps = [
  ['01', 'Primeiro contato', 'Você compartilha o que busca e escolhemos o atendimento adequado.'],
  ['02', 'Encontro online', 'A sessão acontece ao vivo, com espaço para perguntas e reflexão.'],
  [
    '03',
    'Continuidade',
    'Após o encontro, materiais combinados ficam disponíveis na sua área privada.',
  ],
];

export const HomePage = () => {
  const whatsapp = whatsappUrl();
  const reduceMotion = useReducedMotion();

  return (
    <div className="atlas-surface min-h-screen overflow-hidden">
      <SiteHeader />
      <main>
        <section className="hero-atlas" aria-labelledby="hero-title">
          <aside className="cycle-rail" aria-hidden="true">
            <span>Hoje</span>
            <i />
            <strong>162°</strong>
            <small>Sol</small>
            <b />
            <strong>27°</strong>
            <small>Lua</small>
            <ArrowDown size={14} />
          </aside>

          <div className="hero-grid">
            <m.div
              className="hero-copy"
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="eyebrow">Astrologia consciente</p>
              <h1 id="hero-title" className="hero-title">
                Entender
                <br />
                seus ciclos.
                <br />
                Escolher seu
                <br />
                caminho.
              </h1>
              <p className="hero-description">
                Um espaço de escuta e orientação para transformar símbolos em consciência — e
                consciência em movimento.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsapp || '#atendimentos'}
                  target={whatsapp ? '_blank' : undefined}
                  rel={whatsapp ? 'noreferrer' : undefined}
                  className="button-primary"
                >
                  Conhecer atendimentos <ArrowRight size={18} />
                </a>
                <a href="#sobre" className="button-outline">
                  Sobre Juliana <ArrowUpRight size={17} />
                </a>
              </div>
            </m.div>

            <m.figure
              className="celestial-figure"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <img
                src="/assets/celestial-atlas.webp"
                alt="Instrumento celeste abstrato com órbitas lunares"
                width="1254"
                height="1254"
                fetchPriority="high"
                decoding="async"
              />
              <figcaption>
                <span>Mapa astral</span>
                Um instante,
                <br />
                infinitas possibilidades.
              </figcaption>
            </m.figure>
          </div>
        </section>

        <Reveal as="section" className="services-index" id="atendimentos">
          <div className="section-index-heading">
            <span>Serviços</span>
            <p>Escolha seu ponto de partida:</p>
            <a href="#como-funciona">
              Como funciona <ArrowRight size={15} />
            </a>
          </div>
          <div className="services-grid">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <article key={service.title} className="service-row">
                  <span className="service-number">0{index + 1}</span>
                  <span className={`service-icon ${service.accent}`} aria-hidden="true">
                    <Icon size={28} strokeWidth={1.4} />
                  </span>
                  <div>
                    <h2>{service.title}</h2>
                    <p>{service.text}</p>
                    <span className="service-link">
                      Consulte valores <ArrowRight size={15} />
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </Reveal>

        <Reveal as="section" id="como-funciona" className="content-section">
          <div className="content-heading">
            <p className="eyebrow">Como funciona</p>
            <h2>Um encontro com tempo, contexto e profundidade.</h2>
          </div>
          <ol className="process-list">
            {steps.map(([number, title, text]) => (
              <li key={number}>
                <span>{number}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal as="section" id="sobre" className="about-section">
          <div>
            <p className="eyebrow">Sobre Juliana</p>
            <h2>Astrologia como bússola, não como sentença.</h2>
          </div>
          <div className="about-copy">
            <p>
              Meu trabalho parte da escuta e do respeito à singularidade. A astrologia entra como
              uma linguagem para reconhecer padrões, nomear movimentos e ampliar escolhas.
            </p>
            <p>
              Este é um texto inicial. A história, formação e abordagem completa serão refinadas
              antes da publicação definitiva.
            </p>
          </div>
        </Reveal>

        <Reveal as="section" className="cta-section">
          <CalendarDays size={26} />
          <div>
            <p className="eyebrow">Próximo movimento</p>
            <h2>Pronta para olhar seu momento com mais clareza?</h2>
          </div>
          {whatsapp && (
            <a href={whatsapp} target="_blank" rel="noreferrer" className="button-primary">
              Conversar pelo WhatsApp <ArrowRight size={18} />
            </a>
          )}
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
};
