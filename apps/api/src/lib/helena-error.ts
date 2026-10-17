import { AppError } from './errors.js';

const failures = {
  unconfigured: [503, 'O motor da HELENA ainda não está configurado neste ambiente'],
  unavailable: [503, 'O motor da HELENA está temporariamente indisponível'],
  timeout: [504, 'O cálculo excedeu o tempo limite. Tente novamente'],
  invalid: [502, 'O motor da HELENA retornou uma resposta inválida'],
  failed: [502, 'Não foi possível executar o cálculo da HELENA'],
} as const;

// Only these fixed operational messages may cross the public error boundary.
export class HelenaEngineError extends AppError {
  constructor(kind: keyof typeof failures) {
    const [status, message] = failures[kind];
    super(message, status);
    this.name = 'HelenaEngineError';
  }
}
