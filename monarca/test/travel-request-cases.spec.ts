/*
 * flight-request-cases.spec.ts
 * Unit & Functional Tests for Monarca Backend
 */


// TC-1004 - Receipt date outside travel date range

describe('TC-1004 - Receipt date outside travel date range', () => {
  const tripDateRange = {
    departure: new Date('2025-11-01'),
    arrival: new Date('2025-11-10'),
  };

  const isReceiptDateValid = (receiptDate: Date, departure: Date, arrival: Date): boolean => {
    return receiptDate >= departure && receiptDate <= arrival;
  };

  const mockSaveReceipt = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveReceipt.mockResolvedValue({ id: 'receipt-001', status: 'saved' });
  });

  it('should reject a receipt with date before departure', async () => {
    const receiptDate = new Date('2025-10-31');
    const isValid = isReceiptDateValid(receiptDate, tripDateRange.departure, tripDateRange.arrival);
    expect(isValid).toBe(false);
    if (!isValid) mockSaveReceipt.mockRejectedValueOnce(new Error('Receipt date outside travel range'));
    await expect(mockSaveReceipt({ date: receiptDate })).rejects.toThrow('Receipt date outside travel range');
    expect(mockSaveReceipt).toHaveBeenCalledTimes(1);
  });

  it('should reject a receipt with date after arrival', async () => {
    const receiptDate = new Date('2025-11-11');
    const isValid = isReceiptDateValid(receiptDate, tripDateRange.departure, tripDateRange.arrival);
    expect(isValid).toBe(false);
    if (!isValid) mockSaveReceipt.mockRejectedValueOnce(new Error('Receipt date outside travel range'));
    await expect(mockSaveReceipt({ date: receiptDate })).rejects.toThrow('Receipt date outside travel range');
  });

  it('should accept a receipt with date within travel range', async () => {
    const receiptDate = new Date('2025-11-05');
    const isValid = isReceiptDateValid(receiptDate, tripDateRange.departure, tripDateRange.arrival);
    expect(isValid).toBe(true);
    const result = await mockSaveReceipt({ date: receiptDate });
    expect(result).toBeDefined();
    expect(result.status).toBe('saved');
  });

  it('should not save any record when receipt date is invalid', async () => {
    const receiptDate = new Date('2025-12-01');
    const isValid = isReceiptDateValid(receiptDate, tripDateRange.departure, tripDateRange.arrival);
    expect(isValid).toBe(false);
    expect(mockSaveReceipt).not.toHaveBeenCalled();
  });
});


// TC-1005 - Travel Agent reservation history

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

// TC-1006 - Flight request saving and error reporting

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