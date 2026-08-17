import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  deliveryFindMany: vi.fn(),
  deliveryUpdateMany: vi.fn(),
  deliveryUpdate: vi.fn(),
  deliveryFindFirst: vi.fn(),
  deviceUpdate: vi.fn(),
}));

vi.mock('./prisma', () => ({
  prisma: {
    pushDelivery: {
      findMany: mocks.deliveryFindMany,
      updateMany: mocks.deliveryUpdateMany,
      update: mocks.deliveryUpdate,
      findFirst: mocks.deliveryFindFirst,
    },
    pushDevice: { update: mocks.deviceUpdate },
  },
}));

import { dispatchPendingPushes, processExpoReceipts } from './notifications';

const delivery = {
  id: 'delivery-1',
  attempts: 1,
  device: { id: 'device-1', token: 'ExponentPushToken[abc123456]' },
  notification: {
    id: 'notification-1',
    userId: 'user-1',
    type: 'PAYMENT_FAILED' as const,
    projectId: 'project-1',
    invoiceId: 'invoice-1',
    requestId: null,
  },
};

function response(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 503, json: vi.fn().mockResolvedValue(body) } as unknown as Response;
}

describe('Expo notification delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    mocks.deliveryUpdateMany.mockResolvedValue({ count: 1 });
    mocks.deliveryUpdate.mockResolvedValue({});
    mocks.deliveryFindFirst.mockResolvedValue({ id: 'delivery-1', deviceId: 'device-1' });
  });

  it('only selects active devices and keeps ticket and receipt state separate', async () => {
    mocks.deliveryFindMany.mockResolvedValue([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([delivery]);
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(response({ data: [{ status: 'ok', id: 'ticket-1' }] }))
      .mockResolvedValueOnce(response({ data: {} }));

    await dispatchPendingPushes();

    expect(mocks.deliveryFindMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({ device: { isActive: true } }),
    }));
    expect(mocks.deliveryUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'delivery-1' },
      data: expect.objectContaining({
        status: 'SENT',
        expoTicketId: 'ticket-1',
        expoReceiptStatus: null,
      }),
    }));
  });

  it('leaves a receipt that is not ready pending for a later dispatch', async () => {
    vi.mocked(fetch).mockResolvedValue(response({ data: { 'ticket-1': { status: 'pending' } } }));

    await processExpoReceipts(['ticket-1']);

    expect(mocks.deliveryFindFirst).not.toHaveBeenCalled();
    expect(mocks.deliveryUpdate).not.toHaveBeenCalled();
  });

  it('deactivates a device when Expo reports DeviceNotRegistered in a receipt', async () => {
    vi.mocked(fetch).mockResolvedValue(response({
      data: {
        'ticket-1': {
          status: 'error',
          message: 'Device is no longer registered',
          details: { error: 'DeviceNotRegistered' },
        },
      },
    }));

    await processExpoReceipts(['ticket-1']);

    expect(mocks.deliveryUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', expoReceiptStatus: 'error' }),
    }));
    expect(mocks.deviceUpdate).toHaveBeenCalledWith({
      where: { id: 'device-1' },
      data: { isActive: false },
    });
  });

  it('deactivates a device when the Expo ticket itself reports DeviceNotRegistered', async () => {
    mocks.deliveryFindMany.mockResolvedValue([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([delivery]);
    vi.mocked(fetch).mockResolvedValue(response({
      data: [{
        status: 'error',
        message: 'Device is no longer registered',
        details: { error: 'DeviceNotRegistered' },
      }],
    }));

    await dispatchPendingPushes();

    expect(mocks.deliveryUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', expoReceiptStatus: null }),
    }));
    expect(mocks.deviceUpdate).toHaveBeenCalledWith({
      where: { id: 'device-1' },
      data: { isActive: false },
    });
  });

  it('reschedules a transient provider exception with a bounded retry', async () => {
    mocks.deliveryFindMany.mockResolvedValue([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...delivery, attempts: 1 }]);
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));

    await dispatchPendingPushes();

    expect(mocks.deliveryUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'delivery-1' },
      data: expect.objectContaining({ status: 'PENDING', lastError: 'Expo request failed' }),
    }));
  });
});
