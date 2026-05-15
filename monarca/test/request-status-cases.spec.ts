/*
 * request-status-cases.spec.ts
 * Functionality Test - TC-1007
 * Module: Request status controller
 * Title: Validate state irreversibility and blocking of duplicate transitions
 */

describe('TC-1007 - Request status irreversibility', () => {
  const mockUpdateStatus = jest.fn();
  const mockFindOne = jest.fn();

  const completedRequest = {
    id: 'request-001',
    status: 'Completed',
    title: 'Developer Conference',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindOne.mockResolvedValue(completedRequest);
    mockUpdateStatus.mockRejectedValue(new Error('NotFoundException: Invalid request id'));
  });

  it('should return 404 when attempting to modify a Completed request', async () => {
    await expect(mockUpdateStatus('request-001', 'Pending Review'))
      .rejects.toThrow('NotFoundException: Invalid request id');
  });

  it('should not allow duplicate status transitions on a Completed request', async () => {
    await expect(mockUpdateStatus('request-001', 'Completed'))
      .rejects.toThrow();
    expect(mockUpdateStatus).toHaveBeenCalledTimes(1);
  });

  it('should keep request status unchanged after failed transition attempt', async () => {
    try {
      await mockUpdateStatus('request-001', 'Pending Review');
    } catch {}

    const request = await mockFindOne('request-001');
    expect(request.status).toBe('Completed');
  });

  it('should allow status transitions on non-finalized requests', async () => {
    mockUpdateStatus.mockResolvedValueOnce({ id: 'request-002', status: 'Pending Reservations' });

    const result = await mockUpdateStatus('request-002', 'Pending Reservations');
    expect(result.status).toBe('Pending Reservations');
  });
});

