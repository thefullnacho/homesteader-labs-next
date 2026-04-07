import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Set env vars before the module loads (audienceId is read at module init time)
process.env.RESEND_API_KEY = 'test-key';
process.env.RESEND_AUDIENCE_ID = 'test-audience-id';

// Mock Resend before importing the route
const mockContactsCreate = vi.fn();
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { contacts: { create: mockContactsCreate } };
  }),
}));

const { POST } = await import('./route');

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/subscribe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for missing email', async () => {
    const res = await POST(makeRequest({ type: 'newsletter' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for email without @', async () => {
    const res = await POST(makeRequest({ email: 'notanemail', type: 'newsletter' }));
    expect(res.status).toBe(400);
  });

  it('calls resend.contacts.create and returns 200 on valid input', async () => {
    mockContactsCreate.mockResolvedValueOnce({ id: 'contact-123' });
    const res = await POST(makeRequest({ email: 'valid@example.com', type: 'newsletter' }));
    expect(res.status).toBe(200);
    expect(mockContactsCreate).toHaveBeenCalledWith({
      email: 'valid@example.com',
      audienceId: 'test-audience-id',
      unsubscribed: false,
    });
  });

  it('returns 500 when Resend throws', async () => {
    mockContactsCreate.mockRejectedValueOnce(new Error('Resend API error'));
    const res = await POST(makeRequest({ email: 'valid@example.com', type: 'newsletter' }));
    expect(res.status).toBe(500);
  });

  it('accepts all subscription types', async () => {
    mockContactsCreate.mockResolvedValue({ id: 'contact-123' });
    const types = ['newsletter', 'waitlist', 'planting-reminders', 'roi-unlock', 'companions-unlock', 'weekly', 'emergency'];
    for (const type of types) {
      const res = await POST(makeRequest({ email: 'test@example.com', type }));
      expect(res.status).toBe(200);
    }
  });
});
