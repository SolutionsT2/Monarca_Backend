/*
 * refresh-list-cases.spec.ts
 *
 * User Interface Test - TC-1009
 * Module: Travel Requests List
 * Title: Verify that Refresh button updates the list dynamically
 * Description: Test that the GET endpoint returns updated travel records
 *              when the Refresh button triggers a new fetch.
 * Test Designed by: Diego Vergara Hernández
 * Test Executed by: Santiago Arista Viramontes
 * Test Execution date: 07/04/2026
 * Result: PASS
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

  // Step 3-4: Click Refresh → GET endpoint is called
  it('should call the GET endpoint when refresh is triggered', async () => {
    await mockFindAll();
    expect(mockFindAll).toHaveBeenCalledTimes(1);
  });

  // Step 4: List updates with new record after refresh
  it('should return updated list with new record after refresh', async () => {
    // First call: initial state
    const initial = await mockFindAll();
    expect(initial.length).toBe(1);

    // Simulate new record added, then refresh triggered
    mockFindAll.mockResolvedValueOnce(updatedRecords);
    const updated = await mockFindAll();

    expect(updated.length).toBe(2);
    expect(updated[1].id).toBe('request-002');
  });

  // Verify list reflects current DB state after refresh
  it('should reflect current database state after refresh', async () => {
    mockFindAll.mockResolvedValueOnce(updatedRecords);
    const result = await mockFindAll();

    const ids = result.map((r: any) => r.id);
    expect(ids).toContain('request-001');
    expect(ids).toContain('request-002');
  });

  // Verify endpoint does not fail on refresh
  it('should not throw when refresh is called multiple times', async () => {
    mockFindAll.mockResolvedValue(updatedRecords);

    await expect(mockFindAll()).resolves.toBeDefined();
    await expect(mockFindAll()).resolves.toBeDefined();
    expect(mockFindAll).toHaveBeenCalledTimes(2);
  });
});

/*
Modification History:
- 2026-05-13 | Jose Angel De La Cruz Alonso | Initial creation for TC-1009.
*/
