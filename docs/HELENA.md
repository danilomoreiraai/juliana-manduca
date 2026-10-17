# HELENA — ferramenta administrativa de astrologia

Issue: [#49](https://github.com/danilomoreiraai/juliana-manduca/issues/49).

HELENA é o nome do produto. O Pegasus Photon SE é somente uma referência de investigação
e comparação do legado. O admin calcula e prepara conteúdos dentro do portal Juliana Manduca;
o cliente recebe materiais revisados e liberados pelo fluxo de documentos privados.

## Primeira entrega funcional

- Rota `/admin/helena`, protegida pelos guards existentes e por MFA administrativo.
- Formulário natal com data gregoriana de 1600 a 2399, hora com segundos opcionais,
  deslocamento UTC explícito em minutos, latitude e longitude.
- Sol a Plutão, retrogradação, Ascendente, Meio do Céu, 12 casas e cinco aspectos maiores.
- Casas Placidus, Koch, Iguais e Whole Sign; zodíaco tropical, Lahiri e Fagan/Bradley.
- Mandala SVG, tabelas acessíveis, recálculo e exportação administrativa JSON.
- Cálculos reais pela Swiss Ephemeris via `pysweph==2.10.3.6`, serviço interno Python 3.12.
  A primeira versão solicita explicitamente a efeméride Moshier incorporada à biblioteca e
  identifica esse método na saída. Não depende dos arquivos da instalação original e não
  tenta converter falhas em posições zero ou mudar de efeméride silenciosamente.

O motor é chamado apenas pela API Fastify. A rota `/admin/helena/natal` usa `requireAdmin`;
o segredo do serviço interno não chega ao navegador. Pedidos inválidos são rejeitados nas
duas fronteiras. O processo de cálculo trata uma solicitação por vez e reaplica suas opções.
O cliente nunca chama o motor diretamente.

Esta unidade não persiste nomes, mapas ou rascunhos nem publica documentos automaticamente.
O nome do sujeito fica no estado da tela e não é enviado ao motor. Persistência, revisão de
PDF e entrega idempotente serão a próxima unidade funcional. As técnicas avançadas e a
equivalência numérica com o legado continuam pendentes; uma saída natal real não comprova
a reconstrução completa da aplicação original.

## Fronteiras e comportamento

Contratos Zod ficam em `packages/contracts`; rotas Fastify são finas e delegam a funções.
A web usa `src/services/helena.ts`, TanStack Query e componentes próprios da ferramenta.
O serviço Python fica em `services/astrology`, fora dos workspaces npm. Um HTTP interno
autenticado atende ao cálculo curto; fila persistente será introduzida quando técnicas longas
forem implementadas. Essa escolha evita criar jobs ou acesso adicional ao banco nesta etapa.

O resultado registra versão do motor, efeméride, dia Juliano UT, entradas normalizadas, corpos,
cúspides, ângulos e aspectos. Resultados antigos são descartados quando os dados são alterados
ou outro cálculo é iniciado. Erros de casas em latitudes extremas são informados, sem trocar
o sistema de casas escolhido. Tempo limite, indisponibilidade e resposta inválida do serviço
têm erro estável no contrato `{ message, statusCode }` e não revelam respostas brutas.

## Validação e operação

Usar fixtures sintéticas e referências numéricas identificadas. Cobrir fuso atravessando dia/ano,
anos bissextos, limites angulares, entradas não finitas, casas em latitudes extremas, alternância
de zodíaco e autorização AAL1/AAL2. A interface deve funcionar em 375 px e 1440 px, com foco,
teclado, estados de carregamento/erro e leitor de tela.

O motor é opcional na implantação existente e requer URL interna e segredo explícitos na API.
Sem configuração, a API retorna indisponibilidade compreensível para a HELENA e os demais
fluxos do site continuam operando. Não colocar segredo em variáveis `VITE_*`.

Antes de ativar o serviço para usuários, resolver o modelo de distribuição da Swiss Ephemeris
e seus bindings conforme as licenças correspondentes. Nenhum arquivo proprietário do legado
é distribuído. Esta entrega não inclui merge ou deploy de produção.

O rollback desativa a configuração da HELENA e retorna as imagens anteriores. Não há migration
de banco ou remoção de materiais nessa primeira unidade.

### Executar localmente

Requer Python 3.12. Dentro de `services/astrology`, crie um ambiente virtual e instale
`python -m pip install --only-binary=:all: -r requirements.txt`. Defina `HELENA_ENGINE_TOKEN`
com um segredo aleatório de pelo menos 32 caracteres, `HELENA_HOST=127.0.0.1` e execute
`python server.py`. A porta padrão é 8000. Na API configure o mesmo segredo e
`HELENA_ENGINE_URL=http://127.0.0.1:8000`. Inicie o portal pelo fluxo normal e acesse
`/admin/helena` com uma sessão administrativa AAL2. O modo demo do portal não simula cálculos.

No Compose, configure o segredo no `.env` e a URL `http://helena-engine:8000`.
Após resolver o licenciamento, use `docker compose --profile helena up -d --build`.
O motor não publica porta no host; somente a API deve expor o cálculo ao navegador.
Use uma instância do processo por contêiner, sem workers em threads: a biblioteca mantém
opções globais de zodíaco. O cálculo de casa ocupada usa o intervalo das cúspides na eclíptica;
não implementa posições mundanas com latitude planetária. A fase dos aspectos usa a velocidade
instantânea, e o fuso histórico deve ser informado pelo admin nesta etapa.

### Verificações reproduzíveis

- `python -m unittest discover -s tests -v` dentro de `services/astrology`.
- `npm run test` e `npm run build` na raiz.
- `npm run test:e2e -- apps/web/e2e/helena.spec.ts` com a configuração Playwright do projeto.
- Para a ponte real API → Python: defina `HELENA_TEST_PYTHON` com o executável do ambiente
  virtual e rode `npx vitest run --config apps/api/vitest.config.ts apps/api/test/helena.live.test.ts`.

A fixture J2000 é sintética e registra uma execução do motor, com verificações numéricas do
Sol e da Lua. Ela oferece regressão estável, sem representar homologação externa ou comparação
com o programa legado. A CI executa os testes Python e a ponte HTTP real em job próprio.
