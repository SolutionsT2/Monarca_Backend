/**
 * File: userInfo.interface.ts
 * Description: Shape of the current user info attached to the request by PermissionsGuard.
 */

export interface UserInfoInterface {
  id: string;
  email: string;
  name: string;
  last_name: string;
  availabilityStatus: string;
  id_department: string | undefined;
  id_role: string;
  id_travel_agency: string | undefined;
}

/**
 * Modification History:
 * - 2026-03-02: Added file header with description and modification history.
 */
