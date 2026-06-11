import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/offline/executionState', () => ({
  listActiveExecutions: vi.fn(),
}));
vi.mock('@/lib/offline/protocolCache', () => ({
  getProtocol: vi.fn(),
}));

import {
  notify,
  requestNotificationPermission,
  startReminderScheduler,
  stopReminderScheduler,
} from '../index';
import { listActiveExecutions } from '@/lib/offline/executionState';
import { getProtocol } from '@/lib/offline/protocolCache';

const notificationCtor = vi.fn();

class MockNotification {
  static permission: NotificationPermission = 'granted';
  static requestPermission = vi.fn().mockResolvedValue('granted' as NotificationPermission);
  constructor(title: string, opts?: NotificationOptions) {
    notificationCtor(title, opts);
  }
}

function execWithLoop(answeredAt: string) {
  return {
    clientUuid: 'uuid-1',
    status: 'em_andamento' as const,
    protocolId: '1',
    history: [
      {
        stepKey: 'loop',
        stepType: 'titration_loop',
        title: 'Bolus',
        values: {},
        answeredAt,
      },
    ],
  };
}

const cachedProtocol = {
  current_version: {
    steps_data: {
      steps: [{ id: 'loop', type: 'titration_loop', title: 'Bolus', duration_minutes: 20 }],
    },
  },
};

beforeEach(() => {
  notificationCtor.mockClear();
  MockNotification.permission = 'granted';
  vi.stubGlobal('Notification', MockNotification);
});

afterEach(() => {
  stopReminderScheduler();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('notify', () => {
  it('creates a Notification when permission is granted', () => {
    notify({ title: 'Olá', body: 'corpo' });
    expect(notificationCtor).toHaveBeenCalledWith('Olá', expect.objectContaining({ body: 'corpo' }));
  });

  it('is a no-op without granted permission', () => {
    MockNotification.permission = 'denied';
    notify({ title: 'Olá' });
    expect(notificationCtor).not.toHaveBeenCalled();
  });
});

describe('requestNotificationPermission', () => {
  it('asks the browser when permission is default', async () => {
    MockNotification.permission = 'default';
    const result = await requestNotificationPermission();
    expect(MockNotification.requestPermission).toHaveBeenCalled();
    expect(result).toBe('granted');
  });
});

describe('startReminderScheduler', () => {
  it('fires a notification for an already-overdue reminder', async () => {
    vi.mocked(listActiveExecutions).mockResolvedValue([
      execWithLoop('2000-01-01T00:00:00Z'), // long overdue
    ] as never);
    vi.mocked(getProtocol).mockResolvedValue(cachedProtocol as never);

    startReminderScheduler();

    await vi.waitFor(() => expect(notificationCtor).toHaveBeenCalledTimes(1));
    expect(notificationCtor.mock.calls[0]![0]).toBe('Reavaliação devida');
  });

  it('does not fire for a reminder still in the future', async () => {
    const future = new Date(Date.now() + 60 * 60_000).toISOString();
    vi.mocked(listActiveExecutions).mockResolvedValue([execWithLoop(future)] as never);
    vi.mocked(getProtocol).mockResolvedValue(cachedProtocol as never);

    startReminderScheduler();

    await Promise.resolve();
    await Promise.resolve();
    expect(notificationCtor).not.toHaveBeenCalled();
  });
});
