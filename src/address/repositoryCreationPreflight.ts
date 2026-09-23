export type GitHubOwnerType = 'User' | 'Organization' | 'Unknown';

export type RepositoryCreationPreflightInput = {
  targetOwner: string;
  activeLogin?: string;
  targetOwnerType: GitHubOwnerType;
  canCreateInOrganization?: boolean;
};

export type RepositoryCreationPreflightResult = {
  status: 'pass' | 'blocked';
  reason: string;
  nextAction: string;
};

function sameLogin(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function evaluateRepositoryCreationPreflight(
  input: RepositoryCreationPreflightInput,
): RepositoryCreationPreflightResult {
  const targetOwner = input.targetOwner.trim();
  const activeLogin = input.activeLogin?.trim();

  if (!targetOwner) {
    return {
      status: 'blocked',
      reason: 'Target GitHub owner is missing.',
      nextAction: 'Set the intended repository owner before creating public repositories.',
    };
  }

  if (!activeLogin) {
    return {
      status: 'blocked',
      reason: 'No active GitHub login is available.',
      nextAction: `Authenticate as ${targetOwner} or as an organization admin with repository creation permission.`,
    };
  }

  if (input.targetOwnerType === 'User') {
    if (!sameLogin(activeLogin, targetOwner)) {
      return {
        status: 'blocked',
        reason: `Target owner ${targetOwner} is a user account, but the active GitHub login is ${activeLogin}.`,
        nextAction: `Run the create command only after logging in as ${targetOwner}; do not allow fallback to ${activeLogin}.`,
      };
    }

    return {
      status: 'pass',
      reason: `Active GitHub login matches the target user owner ${targetOwner}.`,
      nextAction: 'Create only the staged repositories marked for immediate creation.',
    };
  }

  if (input.targetOwnerType === 'Organization') {
    if (!input.canCreateInOrganization) {
      return {
        status: 'blocked',
        reason: `Active GitHub login ${activeLogin} has not been confirmed as able to create repositories in ${targetOwner}.`,
        nextAction: `Confirm ${activeLogin} has repository creation permission in ${targetOwner} before running gh repo create.`,
      };
    }

    return {
      status: 'pass',
      reason: `Active GitHub login ${activeLogin} can create repositories in organization ${targetOwner}.`,
      nextAction: 'Create only the staged repositories marked for immediate creation.',
    };
  }

  return {
    status: 'blocked',
    reason: `Target owner type for ${targetOwner} is unknown.`,
    nextAction: 'Resolve the owner type through GitHub before creating repositories.',
  };
}
