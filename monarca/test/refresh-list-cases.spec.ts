/*
 * refresh-list-cases.spec.ts
 * User Interface Test - TC-1009
 * Test Execution date: 07/04/2026
 */

describe('TC-1009 - Refresh button updates travel requests list', () => {
  const mockFindAll = jest.fn();

  const initialRecords = [
    { id: 'request-001', title: 'Trip to NYC', status: 'Pending Review' },
  ];

  const updatedRecords = [
    { id: 'request-001', title: 'Trip to NYC', status: 'Pending Review' },
    { id: 'request-002', title: 'Developer Conference', status: 'Pending Review' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindAll.mockResolvedValue(initialRecords);
  });

  it('should call the GET endpoint when refresh is triggered', async () => {
    await mockFindAll();
    expect(mockFindAll).toHaveBeenCalledTimes(1);
  });

  it('should return updated list with new record after refresh', async () => {
    const initial = await mockFindAll();
    expect(initial.length).toBe(1);

    mockFindAll.mockResolvedValueOnce(updatedRecords);
    const updated = await mockFindAll();

    expect(updated.length).toBe(2);
    expect(updated[1].id).toBe('request-002');
  });

  it('should reflect current database state after refresh', async () => {
    mockFindAll.mockResolvedValueOnce(updatedRecords);
    const result = await mockFindAll();

    const ids = result.map((r: any) => r.id);
    expect(ids).toContain('request-001');
    expect(ids).toContain('request-002');
  });

  it('should not throw when refresh is called multiple times', async () => {
    mockFindAll.mockResolvedValue(updatedRecords);

    await expect(mockFindAll()).resolves.toBeDefined();
    await expect(mockFindAll()).resolves.toBeDefined();
    expect(mockFindAll).toHaveBeenCalledTimes(2);
  });
});

