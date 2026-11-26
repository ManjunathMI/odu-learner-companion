const pathIdPattern = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const pathIdRegex = new RegExp(`^${pathIdPattern}$`, 'i');
const memberDestinationRegex = new RegExp(`^/account/path-members\\?path=(${pathIdPattern})$`, 'i');
const learningPathRegex = new RegExp(`^/paths/${pathIdPattern}$`, 'i');

export const isUuid = (value: string) => pathIdRegex.test(value);
const invitationTokenRegex = new RegExp(`^${pathIdPattern}\\.[0-9a-f]{64}$`, 'i');
export const isInvitationToken = (value: string) => invitationTokenRegex.test(value);

export function pathMembersDestination(pathId: string) {
  return pathIdRegex.test(pathId) ? `/account/path-members?path=${pathId.toLowerCase()}` : null;
}

// Restrict sign-in continuations to supported internal learner destinations.
export function returnDestination(value: string | null): string {
  if (value === '/admin' || value === '/account/path-members' || value === '/journey/invitations') return value;
  if (!value) return '/journey';
  const invitePrefix = '/invitations/accept/';
  if (value.startsWith(invitePrefix) && isInvitationToken(value.slice(invitePrefix.length))) return value;
  const pathId = memberDestinationRegex.exec(value)?.[1];
  if (pathId) return pathMembersDestination(pathId) ?? '/journey';
  return learningPathRegex.test(value) ? value : '/journey';
}
