import { describe, it, expect } from 'vitest';
import { preencher } from '@/lib/exportar';

describe('preencher', () => {
  it('troca variáveis pelos valores', () => {
    expect(preencher('Olá {nome}, nº {numero}', { nome: 'Ana', numero: 7 })).toBe('Olá Ana, nº 7');
  });
  it('variável sem valor vira vazio', () => {
    expect(preencher('Evento {evento}.', {})).toBe('Evento .');
  });
});
