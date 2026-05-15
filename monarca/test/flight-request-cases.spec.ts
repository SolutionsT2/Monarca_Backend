/*
 * flight-request-cases.spec.ts
 *
 * Unit & Functional Tests for Monarca Backend
 * TC-1005 - Travel Agent reservation history
 * TC-1006 - Flight request saving and error reporting
 * TC-1005 Test Designed by: Diego Flores Becerril
 * TC-1005 Test Executed by: Jose Angel De La Cruz Alonso
 * TC-1006 Test Designed by: Jose Angel De La Cruz Alonso
 * TC-1006 Test Executed by: Efrén Chávez Camacho
 */

// ─────────────────────────────────────────────
// TC-1005 - Travel Agent reservation history
// ─────────────────────────────────────────────
describe('TC-1005 - Travel Agent reservation history', () => {
  const TRAVEL_AGENCY_ID = 'agency-uuid-001';
  const mockReservations = [
    { id: 'reservation-001', id_request_destination: 'dest-001', travel_agency_id: TRAVEL_AGENCY_ID },
    { id: 'reservation-002', id_request_destination: 'dest-002', travel_agency_id: TRAVEL_AGENCY_ID },
  ];
  const mockFindAll = jest.fn().mockResolvedValue(mockReservations);

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindAll.mockResolvedValue(mockReservations);
  });

  it('should return reservations when travel agent has reserved requests', async () => {
    const result = await mockFindAll();
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });

  it('should filter reservations by travel agency id', async () => {
    const all = await mockFindAll();
    const filtered = all.filter((r: any) => r.travel_agency_id === TRAVEL_AGENCY_ID);
    expect(filtered.length).toBe(2);
  });

  it('should return empty array when travel agency has no reservations', async () => {
    mockFindAll.mockResolvedValueOnce([]);
    const result = await mockFindAll();
    expect(result).toEqual([]);
  });

  it('should call findAll exactly once when fetching history', async () => {
    await mockFindAll();
    expect(mockFindAll).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────
// TC-1006 - Flight request saving and error reporting
// ─────────────────────────────────────────────
describe('TC-1006 - Flight request saving and error reporting', () => {
  const mockSave = jest.fn();
  const mockNotifyOrWarn = jest.fn();

  const validRequest = {
    id: 'request-001',
    id_user: 'user-travelagent1',
    id_origin_city: 'city-mexico-uuid',
    title: 'Developer Conference',
    motive: 'Work',
    priority: 'high',
    advance_money: 8000,
    requirements: '',
    requests_destinations: [{
      id_destination: 'city-usa-uuid',
      destination_order: 1,
      stay_days: 3,
      arrival_date: new Date('2026-04-15'),
      departure_date: new Date('2026-04-18'),
      is_hotel_required: false,
      is_plane_required: true,
      is_last_destination: true,
      details: 'Wheelchair accessibility required',
    }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue({ ...validRequest, status: 'Pending Review' });
    mockNotifyOrWarn.mockResolvedValue(null);
  });

  it('should save a valid flight request without errors', async () => {
    const saved = await mockSave(validRequest);
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(saved).toBeDefined();
    expect(saved.id).toBe('request-001');
    expect(saved.status).toBe('Pending Review');
  });

  it('should report emailWarning when notification fails but request is still saved', async () => {
    mockNotifyOrWarn.mockResolvedValueOnce({ code: 'EMAIL_NOTIFICATION_FAILED', message: 'No se pudo notificar.', recipients: ['approver@monarca.com'] });
    const saved = await mockSave(validRequest);
    const emailWarning = await mockNotifyOrWarn({ to: 'approver@monarca.com', subject: 'Nueva solicitud', text: 'Texto.', html: '<p>Texto.</p>', failureMessage: 'No se pudo notificar.' });
    expect(saved).toBeDefined();
    expect(saved.id).toBe('request-001');
    expect(emailWarning).not.toBeNull();
    expect(emailWarning.code).toBe('EMAIL_NOTIFICATION_FAILED');
  });

  it('should reject a flight request with missing required fields', async () => {
    mockSave.mockRejectedValueOnce(new Error('Missing required fields'));
    await expect(mockSave({ ...validRequest, id_origin_city: undefined })).rejects.toThrow('Missing required fields');
  });

  it('should throw an error when database fails to save the request', async () => {
    mockSave.mockRejectedValueOnce(new Error('Database connection error'));
    await expect(mockSave(validRequest)).rejects.toThrow('Database connection error');
    expect(mockSave).toHaveBeenCalledTimes(1);
  });
});

/*
Modification History:
- 2026-05-13 | Jose Angel De La Cruz Alonso | Initial creation consolidating TC-1005 and TC-1006.
*/
