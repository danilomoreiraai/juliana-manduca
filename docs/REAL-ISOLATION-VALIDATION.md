# Validação real de isolamento (#31)

Este roteiro usa somente o projeto Supabase isolado `rxxriflonxesgvxokptk` e a API dev. O script recusa outro projeto, cria uma cliente B e dois PDFs sintéticos, testa as rotas e executa a limpeza após sucesso ou falha. Ele nunca imprime credenciais, tokens, URLs assinadas, e-mails ou IDs de usuários.

## Pré-requisitos

- `.env.validation.local` e `.env.test-access.local` locais, ignorados pelo Git, com os valores descritos em `.env.example` e os dois acessos de validação da #15.
- API dev implantada e conectada ao mesmo projeto Supabase.
- Não executar com dados ou credenciais de produção.

Na raiz do repositório:

```bash
RUN_REAL_ISOLATION=true node \
  --env-file=.env.validation.local \
  --env-file=.env.test-access.local \
  node_modules/.bin/tsx apps/api/src/scripts/verify-real-isolation.ts
```

O script verifica autorização anônima, cliente e admin AAL1; bucket privado; listagem e download cruzado entre clientes A/B; download assinado do próprio PDF; e rejeição de cliente desativada. Após cada execução, confirme que não restaram fixtures `issue31-` em `storage.objects` ou documentos e perfis sintéticos no banco isolado.

## Evidência de 17/10/2026

| Cenário                                                                                 | Resultado                                                              |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| API `/health/ready`; anônimo 401; cliente sem acesso admin; admin AAL1 sem acesso admin | Passou                                                                 |
| Bucket `consultation-files` privado e acesso anônimo ao objeto negado                   | Passou                                                                 |
| Cliente A/B listam seus próprios PDFs e recebem 404 ao baixar o PDF da outra            | Passou                                                                 |
| Download do PDF próprio pela API, URL assinada e conteúdo sintético                     | Passou; resposta declarou validade de 300 segundos                     |
| Cliente B desativada acessa `/me` ou `/documents`                                       | Negado com HTTP 403 em ambas as rotas                                  |
| Limpeza das fixtures após sucesso ou falha                                              | Passou; contagens finais: 2 perfis, 0 documentos, 0 objetos `issue31-` |

Na primeira execução, o download próprio retornou HTTP 502. A chave `SUPABASE_SECRET_KEY` da API dev tinha um valor incompleto. Após a correção da variável no EasyPanel e novo deploy, a matriz acima passou. O admin AAL2 e a expiração efetiva da URL ainda não têm evidência real concluída. O script verifica o tempo declarado de 300 segundos, mas não aguarda a expiração.
