# Matriz funcional da integração Pegasus

Data: 17/10/2026. Referência: [arquitetura de integração](../PEGASUS-INTEGRATION.md).

As 57 linhas F preservam os grupos funcionais do levantamento inicial. Todas são ferramentas do admin. O cliente acessará apenas materiais revisados e publicados para si. As linhas W descrevem a adequação ao portal existente. Nenhuma linha F está implementada ou homologada na web nesta entrega.

Evidência estática significa componente/handler presente no executável, sem comprovação de comportamento ou disponibilidade em execução. As páginas são físicas do manual instalado v8; o executável examinado informa versão 9.0G. O descompasso exige verificação. Os identificadores DFM abaixo referem-se a evidências locais da investigação e não a código deste repositório.

| ID | Grupo | Função administrativa/reuso | Evidência do levantamento | Pendência de equivalência/integração |
| --- | --- | --- | --- | --- |
| F01 | Cadastros | Clientes, contato, histórico e comentários | Manual PDF 26-27; `aqMPP.TBMapas` (estático) | Preservar memos .MB e vínculos na migração |
| F02 | Cadastros | Arquivos/grupos de mapas, pesquisa e últimos mapas | Manual PDF 11,26-27; `fEntDados.PopupIdentHistorico` (estático) | Confirmar ordenação e pesquisa da versão instalada |
| F03 | Cadastros | Atlas de cidades, estados e países | Manual PDF 12,26; `aqATP.TBAtlasM` (estático) | Verificar dados, códigos e histórico de fusos |
| F04 | Tempo | Entrada de data, hora, coordenadas, fuso e horário especial | Manual PDF 12-13; `fArquivos.PCArquivos.TSMapas.PNMPP.PNDadosNasc` (estático) | Determinar sinal de fuso e tratamento do horário especial |
| F05 | Tempo | Calendários Juliano/Gregoriano e datas antes de Cristo | Manual PDF 12,19; `fEntDados.PNDadosNasc.CHBGregoriano` (estático) | Testar mudança de calendário, sem ano civil zero |
| F06 | Natal | Mapa natal e quadro cósmico sem casas | Manual PDF 28-29; `FormP.PNRadical` (estático) | Validar resultados e tratamento da hora desconhecida |
| F07 | Natal | Longitudes, latitudes, declinação, ascensão reta e velocidade | Manual PDF 28; `FormP.PNResultados.PCResultMapaG.TSCoordenadas` (estático) | Comparar unidade, referência e arredondamento |
| F08 | Natal | Aspectos e paralelos; aplicativos e separativos | Manual PDF 20,28; `FormP.PNResultados.PCResultMapaG.TSAspectos` (estático) | Confirmar convenção de movimento e aplicação |
| F09 | Natal | Casas, regências, ocupação, ponderação e hora sideral | Manual PDF 19-20,28; `FormP.PNResultados.PCResultMapaG.TSCasas` (estático) | Validar órbitas de cúspides e pesos |
| F10 | Natal | Elementos, modalidades/triplicidades e dignidades | Manual PDF 19,28; `fConfig.PNConfiguracao.PCConfig.TSTecnica.PNPonderacao` (estático) | Preservar valores configuráveis |
| F11 | Casas | 16 sistemas de casas na seleção principal | Manual PDF 17; `FormP.PNResultados.PCResultMapaG.TSCasas.PNSisCasasRadical.CBXSisCasasRadical` (estático) | Manual lista 9; há seletores secundários com 9: testar cada contexto |
| F12 | Zodíaco | Trópico e 12 opções de ayanamsa sidérea | Manual PDF 17; `FormP.PNResultados.PCResultMapaG.TSCoordenadas.PNZodiacoOcidental.CBXZodiacoOcidental` (estático) | Mapear opções para constantes da biblioteca |
| F13 | Coordenadas | Posições topocêntricas | `FormP.PNResultados.PCResultMapaG.TSCoordenadas.PNPosTerrestre.CHBPosTopocentrica` (estático) | Verificar altitude e flags efetivamente aplicadas |
| F14 | Coordenadas | Alternância geocêntrica/heliocêntrica | `FormP.PNRadical.PNCentrico` (estático) | Recurso estático; verificar disponibilidade em cada técnica |
| F15 | Complementos | Harmônicas e MC flutuante | Manual PDF 17,29; `FormP.PNResultados.PNContainer.BTRHarmonicas` (estático) | Confirmar faixa e casas iguais nas harmônicas |
| F16 | Complementos | Pontos médios pela menor distância | Manual PDF 17,29; `FormP.PNResultados.PCResultMapaG.TSPtMedios` (estático) | Testar cruzamento de 0 graus e oposição exata |
| F17 | Complementos | Pontos arábicos e fórmulas | Manual PDF 29; `aqPTA.TBPtArab` (estático) | Determinar inversão diurna/noturna e permissão de catálogo |
| F18 | Complementos | Estrelas fixas, magnitude e aspectos | Manual PDF 29; `FormP.PNResultados.PCResultMapaG.TSEstrelas` (estático) | Comparar catálogo, época e referência tropical |
| F19 | Complementos | Dials 30/90/120/360 e enquadramento | Manual PDF 29; `FormP.PNRadical.PNBotoesDial` (estático) | Confirmar regras de projeção e seleção |
| F20 | Relacionamentos | Parceiro, sinastria, interaspectos e sobreposição de casas | Manual PDF 28,41; `FormP.PNResultados.PCResultMapaG.TSAspectos` (estático) | Validar ambos os sentidos da comparação |
| F21 | Relacionamentos | Mapas composto/relacionamento | `fConfig.PNConfiguracao.PCConfig.TSTecnica.LBXAspectos` (estático) | Consta na configuração; confirmar variantes, fórmulas e acesso |
| F22 | Revoluções | Revolução e comparação com o natal | Manual PDF 28-29; `FormP.BarraLateralEsquerda.BTRevolucao` (estático) | Verificar corpos oferecidos, retornos e local de cálculo |
| F23 | Revoluções | Revolução sidérea | `fEntDados.PNZodiaco.CHBRevSiderea` (estático) | Confirmar critério exato do retorno sidéreo |
| F24 | Revoluções | Progressão do Ascendente da Revolução Solar | Manual PDF 29; `FormP.PNResultados.PCResultMapaG.TSProgRev` (estático) | Recuperar convenção de progressão e casas |
| F25 | Mundial | Mapas das quatro fases da Lua | Manual PDF 18,28; `FormP.PopupMundial.imFasesLua` (estático) | Resolver instante exato de cada fase |
| F26 | Mundial | Ingressos de Sol e Lua | Manual PDF 28; `FormP.PopupMundial.imIngresso` (estático) | Confirmar seleção de signos e busca anterior/próxima |
| F27 | Mundial | Mapa de conjunções planetárias | Manual PDF 28,30; `FormP.PopupMundial.imConjuncoes.imConjuncoesMapa` (estático) | Identificar pares, movimentos e busca de raízes |
| F28 | Mundial | Desenvolvimento das conjunções e intervalos | Manual PDF 30; `FormP.PopupConj` (estático) | Diário, 3 dias, semanal e mensal; conferir grades |
| F29 | Local Space | Mandala, azimute, altitude e aspectos | Manual PDF 31; `FormP.PNLocalSpace` (estático) | Confirmar origem e sentido do azimute e refração |
| F30 | Direções | Direções primárias mundanas/zodiacais e speculum | Manual PDF 17,32; `FormP.PNPrimarias.RGTecnicaPrimarias` (estático) | Zodiacais aparecem no executável; recuperar chave e semi-arcos |
| F31 | Direções | Direções secundárias diretas e pré-natais | Manual PDF 17,33; `FormP.PNSecundarias` (estático) | Confirmar duração do ano e método do Asc/MC |
| F32 | Direções | Lua progredida mensal e datas de aspectos | Manual PDF 33; `FormP.PNSecundarias` (estático) | Validar início/meio de período e tabelas |
| F33 | Direções | Simbólicas: grau/ano, passo do Sol, arco solar, Naibod | Manual PDF 18,37; `FormP.PopupTipoMapa2.imNaibod` (estático) | Confirmar ano usado, movimentos direto/converso |
| F34 | Direções | Progressão sinódica | Manual PDF 17,37; `FormP.PNDataPrevCj` (estático) | Fórmula parcialmente descrita no manual; validar tempo e ângulo |
| F35 | Direções | Trânsito diurnal | Manual PDF 18,37; `FormP.PNDataPrevCj` (estático) | Confirmar hora, fuso e local preservados |
| F36 | Trânsitos | Trânsito diário e dupla mandala | Manual PDF 34; `FormP.PNTransitos.PNBotoesTransito.BTTrDiario` (estático) | Validar posições e interaspectos |
| F37 | Trânsitos | Trânsitos rápidos e lentos, faixas e movimentos | Manual PDF 35; `FormP.PNTransitos` (estático) | Testar múltiplas passagens e estações |
| F38 | Trânsitos | Tabela anual de lunações, luas cheias e eclipses | Manual PDF 36; `FormP.PNLunacoes` (estático) | Validar instante, longitude, casa e tipo de eclipse |
| F39 | Pontos sensíveis | Pró-Luna, 7 anos por casa | Manual PDF 18,38; `FormP.PNDataPrevCj` (estático) | Confirmar duração do ano e interpolação por cúspides |
| F40 | Pontos sensíveis | Age Point, Balance Point e Low Point | Manual PDF 18,38; `FormP.PNDataPrevCj` (estático) | Validar 6 anos/casa e deslocamentos de 836/1354 dias |
| F41 | Pontos sensíveis | Fatum e mapa correspondente | Manual PDF 18,37-38; `FormP.PNDataPrevCj` (estático) | Recuperar fórmula logarítmica e parâmetros não publicados no manual |
| F42 | Pontos sensíveis | Life-Time | Manual PDF 18,38; `FormP.PNDataPrevCj` (estático) | Recuperar fórmula dos períodos gestação/infância/adulto |
| F43 | Retificação | Fatos datados, seleção e pesos de aspectos | Manual PDF 39-40; `FormP.PNRetificacao` (estático) | Confirmar função de pontuação e grade de horários |
| F44 | Retificação | Gráfico em graus/minutos, persistência e reabertura | Manual PDF 39-40; `FormP.PopupGrafRetif` (estático) | Comparar curva e máximos com casos do original |
| F45 | Eletiva | Seleção de planetas, ajuste de mapa e desfazer/refazer | Manual PDF 7; `FormP.PNResultados.PCResultMapaG.TSEletiva` (estático) | Recuperar regras e limites de busca; manual pouco detalhado |
| F46 | Tabelas | Depilação e cabelo: beleza, força e crescimento | Manual PDF 42; `fTabelas` (estático) | Recuperar significadores, aspectos, órbitas e seleção de horários |
| F47 | Navegação | Tracking temporal, avanço/retorno e pausas | Manual PDF 32-37; `FormP.PNDataPrevCj.PNBotoesDataPrevCj` (estático) | Validar passos e efeitos sobre cada cálculo |
| F48 | Navegação | Mapa duplo interno/externo e promover resultado a natal | Manual PDF 29,37; `FormP.PopupTipoMapa2` (estático) | Preservar parâmetros e origem do cálculo ao promover |
| F49 | Configuração | Órbitas, aspectos e porcentagens por técnica | Manual PDF 20-22; `fConfig.PNConfiguracao.PCConfig.TSTecnica` (estático) | 25 contextos estáticos; confirmar persistência por usuário |
| F50 | Configuração | Editor de mandalas, cores, símbolos e perfis | Manual PDF 7,23-24; `fConfig.PNConfiguracao.PCConfig.TSMandala` (estático) | Recriar com SVG e ativos próprios |
| F51 | Saídas | Impressão, página, cor/preto e escala | Manual PDF 15-16; `FormB.PopupImpressao` (estático) | Comparar conteúdo em PDF e impressão no navegador |
| F52 | Saídas | Exportação TXT e JSON | `FormB.PopupImpressao.imArquivoJSON` (estático) | Menu presente; esquema JSON e abrangência ainda desconhecidos |
| F53 | Migração | Importação de arquivos Pegasus/Vega/Canopus | Manual PDF 27; `FormB.PopupArquivo.imImportarMapas` (estático) | Confirmar formatos/versões com amostras e testar por formato |
| F54 | Migração | Backup e restauração | `FormB.PopupArquivo.imBackupMPP` (estático) | Verificar formato de backup e abrangência de memos/índices |
| F55 | Idiomas | PT-BR, PT-PT, inglês, espanhol, francês, italiano e alemão | `FormB.PopupIdiomas` (estático) | Recriar traduções e preservar terminologia por idioma |
| F56 | A confirmar | Painel Hindu e relações planetárias | `FormP.PNHindu` (estático) | Painel salvo com Visible=False e grade desabilitada; atividade em runtime desconhecida |
| F57 | A confirmar | Teste gestacional e Programa Rei | `FormP.BarraTitulo.BTTesteGestacional` (estático) | Há handlers nos recursos; função e disponibilidade desconhecidas |
| W01 | Portal existente | Reutilizar Supabase Auth por convite e admin com MFA AAL2 | Correção do usuário e código atual do portal | Preservar guards e requireAdmin; não criar outro login |
| W02 | Produção administrativa | Separar cálculos/rascunhos internos do material liberado ao destinatário | Correção do usuário e código atual do portal | Cliente acessa somente seu material publicado; validar consulta e destinatário |
| W03 | Entrega interna | Calcular, preparar, revisar e publicar PDF nos materiais privados | Correção do usuário e código atual do portal | Reutilizar documents e Storage; revisão explícita, versão e idempotência |

## Proveniência e limites

- Investigação local com a CLI oficial REA 6.5.0; repositório `morluto/rea` no commit `0c7b6d834af2d044b23196e0e522cc2468327a1e`.
- P90.exe: 411 recursos PE, 20 formulários Delphi decodificados e 1.595 componentes. Esses números não medem cobertura da lógica nativa.
- Treze bancos .DB Paradox, arquivos de memo/índice e chamadas Swiss Ephemeris foram identificados. Dados pessoais e arquivos originais não foram incluídos neste repositório.
- Não houve descompilação nativa, execução dos módulos do legado ou comparação numérica concluída. Ghidra/IDA não estavam configurados na investigação.
- Fórmulas específicas de Fatum, Life-Time, retificação e tabelas especiais precisam de recuperação. Itens ocultos ou desabilitados nos recursos continuam pendentes de verificação de disponibilidade.
- Os modelos de licença do motor e permissões de redistribuição de catálogos/fontes/textos precisam ser resolvidos antes da ativação do serviço.
