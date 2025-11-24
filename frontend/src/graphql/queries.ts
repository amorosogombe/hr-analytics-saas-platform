export const LIST_ALL_ORGANIZATIONS = `
  query ListAllOrganizations($status: OrgStatus, $limit: Int, $nextToken: String) {
    listAllOrganizations(status: $status, limit: $limit, nextToken: $nextToken) {
      items {
        organizationId
        name
        subdomain
        status
        tier
        adminEmail
        userCount
        dataSourcesConfigured
        createdAt
        updatedAt
        approvedAt
        approvedBy
      }
      nextToken
    }
  }
`;

export const GET_SYSTEM_METRICS = `
  query GetSystemMetrics {
    getSystemMetrics {
      totalOrganizations
      activeOrganizations
      pendingApprovals
      suspendedOrganizations
      totalUsers
      avgUsersPerOrg
      storageUsed
      apiCallsToday
      lastUpdated
    }
  }
`;
