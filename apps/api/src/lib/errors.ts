export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (message = 'Recurso não encontrado') => new AppError(message, 404);
export const forbidden = (message = 'Você não tem permissão para esta ação') =>
  new AppError(message, 403);
export const unauthorized = (message = 'Sessão inválida ou expirada') => new AppError(message, 401);
