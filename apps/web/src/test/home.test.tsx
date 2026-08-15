import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { HomePage } from '../pages/HomePage';

describe('home page', () => {
  it('presents the core service proposition and client entry point', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /entender seus ciclos/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /área do cliente/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getAllByText('Consulte valores')).toHaveLength(3);
    expect(screen.queryByRole('img', { name: /Juliana Manduca/i })).not.toBeInTheDocument();
  });
});
