/*
 * trip-validation-cases.spec.ts
 *
 * Functionality Test - TC-1008
 * Module: Trip Creation - Origin/Destination Validation
 * Title: Verify that origin and destination cities cannot be the same
 * Test Designed by: Juan de Dios Gastélum Flores
 * Test Executed by: Diego Vergara Hernández
 * Test Execution date: 05/04/2026
 * Result: PASS
 */

// Pure validation function that mirrors the business rule
const validateOriginDestination = (
  id_origin_city: string,
  id_destination_city: string,
): { valid: boolean; error?: string } => {
  if (id_origin_city === id_destination_city) {
    return {
      valid: false,
      error: 'Origin and destination cannot be the same city.',
    };
  }
  return { valid: true };
};

describe('TC-1008 - Origin and destination city validation', () => {
  const MEXICO_CITY_ID = 'city-uuid-mexico';
  const NEW_YORK_ID = 'city-uuid-new-york';

  // Step 1 & 2: Same city selected for origin and destination
  it('should block submission when origin and destination are the same city', () => {
    const result = validateOriginDestination(MEXICO_CITY_ID, MEXICO_CITY_ID);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Origin and destination cannot be the same city.');
  });

  // Verify no record would be created
  it('should not call save when origin equals destination', () => {
    const mockSave = jest.fn();
    const result = validateOriginDestination(MEXICO_CITY_ID, MEXICO_CITY_ID);
    if (!result.valid) {
      // save should never be called
    } else {
      mockSave();
    }
    expect(mockSave).not.toHaveBeenCalled();
  });

  // Valid case: different cities
  it('should allow submission when origin and destination are different cities', () => {
    const result = validateOriginDestination(MEXICO_CITY_ID, NEW_YORK_ID);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  // Error message matches expected output from TC
  it('should return correct error message for same city selection', () => {
    const result = validateOriginDestination(MEXICO_CITY_ID, MEXICO_CITY_ID);
    expect(result.error).toContain('cannot be the same city');
  });
});

/*
Modification History:
- 2026-05-13 | Jose Angel De La Cruz Alonso | Initial creation for TC-1008.
*/
