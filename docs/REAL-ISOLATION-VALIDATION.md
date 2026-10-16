# Validação real de isolamento (#31)

Este roteiro usa somente o projeto Supabase isolado `rxxriflonxesgvxokptk` e a API dev. O script recusa outro projeto, cria uma cliente B e dois PDFs sintéticos, testa as rotas e remove as fixtures em `finally`. Ele nunca imprime credenciais, tokens, URLs assinadas, e-mails ou IDs de usuários.

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

| Cenário                                                                                 | Resultado                                                                  |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| API `/health/ready`; anônimo 401; cliente sem acesso admin; admin AAL1 sem acesso admin | Passou                                                                     |
| Bucket `consultation-files` privado                                                     | Passou                                                                     |
| Cliente A/B listam seus próprios PDFs e recebem 404 ao baixar o PDF da outra            | Passou                                                                     |
| Supabase gera URL assinada diretamente com a chave local de validação                   | Passou                                                                     |
| API dev gera URL assinada para a própria cliente                                        | Falhou com HTTP 502                                                        |
| Limpeza das fixtures após a falha                                                       | Passou; contagens voltaram a 2 perfis, 0 documentos e 0 objetos `issue31-` |

O valor de `SUPABASE_SECRET_KEY` configurado na API dev tem formato curto e difere da chave local funcional. A configuração do EasyPanel deve ser corrigida e o teste repetido antes de atribuir o 502 a outro componente. Os cenários de cliente desativada, admin AAL2 e expiração efetiva da URL ainda não têm evidência real concluída. O script só verifica o tempo declarado de 300 segundos, não aguarda a expiração.
