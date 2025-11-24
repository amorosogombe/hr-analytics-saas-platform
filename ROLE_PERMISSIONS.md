# Role-Based Permissions - Quick Reference

## Dashboard Permissions Matrix

| Permission | SuperAdmin | OrgAdmin | HRManager | Supervisor | Employee |
|------------|------------|----------|-----------|------------|----------|
| **View Own Metrics** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **View All Metrics** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Comment Own Metrics** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Comment All Metrics** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Approve Comments** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Delete Comments** | ✅ | ✅ | ✅ | ❌ | ❌ |

## System Access Permissions

| Action | SuperAdmin | OrgAdmin | HRManager | Supervisor | Employee |
|--------|------------|----------|-----------|------------|----------|
| **View Organizations** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Create Organization** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Approve Organization** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Delete Organization** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **List Users** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Create User** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Approve User** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Delete User** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Modify User** | ✅ | ✅ | ❌ | ❌ | ❌ |

## Default Role Assignments

### Registration Flows

**Organization Admin Registration:**
```
User registers → Creates pending organization → 
SuperAdmin approves → OrgAdmin account activated → 
Can create users in their organization
```

**Employee Registration:**
```
User registers → Selects organization → 
OrgAdmin approves → Account activated → 
Can access own metrics
```

### Cognito Group Mapping

| Application Role | Cognito Group |
|-----------------|---------------|
| SuperAdmin | SuperAdmins |
| OrgAdmin | OrgAdmins |
| HRManager | HRManagers |
| Supervisor | Supervisors |
| Employee | Employees |

## Permission Implementation

### Backend (Lambda)
```javascript
// Check if user can approve comments
const canApprove = userGroups.includes('SuperAdmins') || 
                   userGroups.includes('OrgAdmins') || 
                   userGroups.includes('HRManagers') || 
                   userGroups.includes('Supervisors');

// Check if user can view all metrics
const canViewAll = userGroups.includes('SuperAdmins') || 
                   userGroups.includes('OrgAdmins') || 
                   userGroups.includes('HRManagers') || 
                   userGroups.includes('Supervisors');
```

### Frontend (React)
```javascript
// AuthContext provides these helpers
const { 
  isSuperAdmin,
  isOrgAdmin,
  isHRManager,
  isSupervisor,
  isEmployee,
  canManageOrganizations,
  canManageUsers,
  canViewAllMetrics,
  canApproveComments,
  canDeleteComments 
} = useAuth();
```

## API Endpoint Permissions

### Organizations Endpoints
- `GET /organizations` - SuperAdmins only
- `POST /organizations` - SuperAdmins only
- `GET /organizations/{id}` - SuperAdmins, OrgAdmins (own org)
- `PUT /organizations/{id}` - SuperAdmins, OrgAdmins (own org)
- `DELETE /organizations/{id}` - SuperAdmins only
- `POST /organizations/{id}/approve` - SuperAdmins only

### Users Endpoints
- `GET /users` - SuperAdmins, OrgAdmins, HRManagers
- `POST /users` - SuperAdmins, OrgAdmins
- `GET /users/{id}` - SuperAdmins, OrgAdmins, HRManagers (same org)
- `PUT /users/{id}` - SuperAdmins, OrgAdmins (same org)
- `DELETE /users/{id}` - SuperAdmins, OrgAdmins (same org)
- `POST /users/{id}/approve` - SuperAdmins, OrgAdmins (same org)

### Dashboard Endpoints
- `GET /dashboards/list` - All authenticated users
- `POST /dashboards/embed` - All authenticated users (filtered by role)

### Comments Endpoints
- `GET /comments` - All authenticated users (filtered by role)
- `POST /comments` - All authenticated users (based on metric ownership)
- `PUT /comments/{id}` - Comment owner only
- `DELETE /comments/{id}` - HRManagers, OrgAdmins, SuperAdmins
- `POST /comments/{id}/approve` - Supervisors and above
- `POST /comments/{id}/disapprove` - Supervisors and above

## Custom Cognito Attributes

Each user has these custom attributes:

```javascript
{
  "custom:organizationId": "org_xyz123",
  "custom:role": "supervisor",
  "custom:department": "Engineering",
  "custom:supervisorId": "user_abc456",
  "custom:approvalStatus": "approved"  // pending_approval, approved, rejected
}
```

## Role Hierarchy

```
SuperAdmin (System Level)
    ↓
OrgAdmin (Organization Level)
    ↓
HRManager (Organization Level)
    ↓
Supervisor (Department Level)
    ↓
Employee (Individual Level)
```

## Permission Inheritance

Higher roles inherit all permissions of lower roles:
- **SuperAdmin** has all permissions
- **OrgAdmin** has HRManager + Supervisor + Employee permissions within their org
- **HRManager** has Supervisor + Employee permissions within their org
- **Supervisor** has Employee permissions + approval capabilities
- **Employee** has base permissions only

## Security Notes

1. **Backend validation is primary** - Frontend checks are for UX only
2. **JWT tokens** contain group information for quick authorization
3. **Organization isolation** is enforced at data level
4. **All API calls** require valid Cognito JWT token
5. **Custom attributes** are immutable (except by admin)

## Changing Roles

To change a user's role:
1. Update Cognito user attributes
2. Remove from old group
3. Add to new group
4. Update DynamoDB user record

This is handled by the `PUT /users/{id}` endpoint.
