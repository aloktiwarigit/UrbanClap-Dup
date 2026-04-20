import { describe, it, expect } from 'vitest';
import { RazorpayWebhookPayloadSchema } from '../../src/schemas/webhook.js';

const validPayload = {
  entity: 'event',
  account_id: 'acc_test123',
  event: 'payment.captured',
  contains: ['payment'],
  payload: {
    payment: {
      entity: {
        id: 'pay_test123',
        order_id: 'order_test456',
        amount: 59900,
        currency: 'INR',
        status: 'captured',
      },
    },
  },
};

describe('RazorpayWebhookPayloadSchema', () => {
  it('parses a valid payment.captured payload successfully', () => {
    expect(() => RazorpayWebhookPayloadSchema.parse(validPayload)).not.toThrow();
  });

  it('returns the event string', () => {
    const result = RazorpayWebhookPayloadSchema.parse(validPayload);
    expect(result.event).toBe('payment.captured');
  });

  it('returns the paymentId from payload.payment.entity.id', () => {
    const result = RazorpayWebhookPayloadSchema.parse(validPayload);
    expect(result.payload.payment.entity.id).toBe('pay_test123');
  });

  it('returns the order_id from payload.payment.entity.order_id', () => {
    const result = RazorpayWebhookPayloadSchema.parse(validPayload);
    expect(result.payload.payment.entity.order_id).toBe('order_test456');
  });

  it('fails when payload.payment.entity.order_id is missing', () => {
    const bad = {
      ...validPayload,
      payload: {
        payment: {
          entity: {
            id: 'pay_test123',
            // order_id intentionally omitted
            amount: 59900,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    };
    expect(() => RazorpayWebhookPayloadSchema.parse(bad)).toThrow();
  });

  it('fails when payload.payment.entity.id is missing', () => {
    const bad = {
      ...validPayload,
      payload: {
        payment: {
          entity: {
            // id intentionally omitted
            order_id: 'order_test456',
            amount: 59900,
          },
        },
      },
    };
    expect(() => RazorpayWebhookPayloadSchema.parse(bad)).toThrow();
  });

  it('fails when event field is missing', () => {
    const { event: _event, ...noEvent } = validPayload;
    expect(() => RazorpayWebhookPayloadSchema.parse(noEvent)).toThrow();
  });

  it('passes through extra fields in the entity (passthrough)', () => {
    const withExtra = {
      ...validPayload,
      payload: {
        payment: {
          entity: {
            ...validPayload.payload.payment.entity,
            fee: 100,
            tax: 18,
          },
        },
      },
    };
    expect(() => RazorpayWebhookPayloadSchema.parse(withExtra)).not.toThrow();
  });
});
