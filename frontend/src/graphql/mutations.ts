export const APPROVE_ORGANIZATION = `
  mutation ApproveOrganization($organizationId: ID!) {
    approveOrganization(organizationId: $organizationId) {
      organizationId
      name
      status
      approvedAt
      approvedBy
    }
  }
`;

export const REJECT_ORGANIZATION = `
  mutation RejectOrganization($organizationId: ID!, $reason: String) {
    rejectOrganization(organizationId: $organizationId, reason: $reason)
  }
`;

export const SUSPEND_ORGANIZATION = `
  mutation SuspendOrganization($organizationId: ID!, $reason: String!) {
    suspendOrganization(organizationId: $organizationId, reason: $reason) {
      organizationId
      name
      status
    }
  }
`;
