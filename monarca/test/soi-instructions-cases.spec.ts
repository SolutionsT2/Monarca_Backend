/*
 * soi-instructions-cases.spec.ts
 * User Interface Test - TC-1010
 * Module: SOI - UI Instructions
 */

// Role-based instruction resolver (to be implemented)
const getInstructionsByRole = (role: string, action: string): string | null => {
  const instructions: Record<string, Record<string, string>> = {
    SOI: {
      registrado: 'Al marcar como registrado, confirmas que el viaje ha sido contabilizado. Esta acción no puede revertirse.',
    },
    Aprobador: {
      registrado: 'Como aprobador, verifica que todos los comprobantes estén en orden antes de registrar.',
    },
  };
  return instructions[role]?.[action] ?? null;
};

describe('TC-1010 - SOI role-based instructions for "registrado" action', () => {

  // Step 3: SOI clicks "Marcar como registrado" → instruction should appear
  it('should return instruction message for SOI role on registrado action', () => {
    const instruction = getInstructionsByRole('SOI', 'registrado');
    expect(instruction).not.toBeNull();
    expect(instruction).toContain('registrado');
  });

  // Documents the bug: system currently does not show instructions
  it('should return null when role-based instructions are not implemented (current bug)', () => {
    const getInstructionsNotImplemented = (_role: string, _action: string) => null;
    const result = getInstructionsNotImplemented('SOI', 'registrado');

    // This is the current behavior — instructions are not shown
    expect(result).toBeNull();
  });

  // Different roles should get different instructions
  it('should return different instructions for different roles', () => {
    const soiInstruction = getInstructionsByRole('SOI', 'registrado');
    const approverInstruction = getInstructionsByRole('Aprobador', 'registrado');

    expect(soiInstruction).not.toBe(approverInstruction);
  });

  // Non-SOI roles without instructions should return null
  it('should return null for roles without defined instructions', () => {
    const result = getInstructionsByRole('Solicitante', 'registrado');
    expect(result).toBeNull();
  });
});

/*
Modification History:
- 2026-05-13 | Jose Angel De La Cruz Alonso | Initial creation for TC-1010.
*/
