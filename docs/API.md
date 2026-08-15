# API

Todos os erros seguem `{ "message": string, "statusCode": number }`. Rotas privadas exigem `Authorization: Bearer <Supabase access token>`; rotas `/admin` também exigem papel `admin` no banco e claim `aal2`.

| Método       | Rota                       | Acesso      | Função                     |
| ------------ | -------------------------- | ----------- | -------------------------- |
| GET          | `/health/live`             | público     | processo ativo             |
| GET          | `/health/ready`            | público     | banco acessível            |
| GET/PATCH    | `/me`                      | autenticado | perfil atual               |
| GET          | `/consultations`           | cliente     | próprias consultas         |
| GET          | `/documents`               | cliente     | próprios arquivos          |
| POST         | `/documents/:id/download`  | cliente     | URL assinada por 5 min     |
| GET          | `/admin/users`             | admin AAL2  | clientes                   |
| POST         | `/admin/users/invite`      | admin AAL2  | convite por e-mail         |
| PATCH        | `/admin/users/:id`         | admin AAL2  | status do cliente          |
| GET/POST     | `/admin/consultations`     | admin AAL2  | listar/criar consultas     |
| PATCH/DELETE | `/admin/consultations/:id` | admin AAL2  | atualizar/excluir consulta |
| GET/POST     | `/admin/documents`         | admin AAL2  | listar/enviar arquivos     |
| DELETE       | `/admin/documents/:id`     | admin AAL2  | excluir arquivo            |

O upload usa `multipart/form-data`; `userId`, `displayName` e `consultationId` opcional ficam na query string para permitir que o arquivo seja transmitido sem buffering.
