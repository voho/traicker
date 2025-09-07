/// <reference types="jest" />
import { getEventContext, getEventsContextBlock } from './context';

describe('getEventContext', () => {
  it('formats expense as negative with currency', () => {
    const line = getEventContext({
      dateIso: '2024-09-07T12:34:56.000Z',
      description: 'Coffee',
      amount: 4.5,
      currency: 'USD',
      type: 'expense',
    });
    expect(line).toBe('- 2024-09-07 • Coffee • -4.50 USD');
  });

  it('formats income as positive with two decimals', () => {
    const line = getEventContext({
      dateIso: '2024-09-01T00:00:00.000Z',
      description: 'Salary',
      amount: 1234,
      currency: 'EUR',
      type: 'income',
    });
    expect(line).toBe('- 2024-09-01 • Salary • 1234.00 EUR');
  });

  it('keeps sign when type is unknown', () => {
    const line = getEventContext({
      dateIso: '2024-09-02T00:00:00.000Z',
      description: 'Adjustment',
      amount: -10.123,
      currency: 'USD',
    });
    expect(line).toBe('- 2024-09-02 • Adjustment • -10.12 USD');
  });
});

describe('getEventsContextBlock', () => {
  it('builds a markdown block with header and items', () => {
    const block = getEventsContextBlock(
      [
        {
          dateIso: '2024-09-01T00:00:00.000Z',
          description: 'Salary',
          amount: 1000,
          currency: 'USD',
          type: 'income',
        },
        {
          dateIso: '2024-09-02T00:00:00.000Z',
          description: 'Coffee',
          amount: 3.25,
          currency: 'USD',
          type: 'expense',
        },
      ],
      'My Events'
    );

    const lines = block.split('\n');
    expect(lines[0]).toBe('# My Events');
    expect(lines).toContain('- 2024-09-01 • Salary • 1000.00 USD');
    expect(lines).toContain('- 2024-09-02 • Coffee • -3.25 USD');
  });
});
