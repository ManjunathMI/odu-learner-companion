// Synthetic QA identities only. Account names never grant application roles.
export const testAccounts = Object.freeze({
  visitor: 'visitor.test@odu.local',
  learner: 'learner.test@odu.local',
  moderator: 'moderator.test@odu.local',
  pathadmin: 'pathadmin.test@odu.local',
  superadmin: 'superadmin.test@odu.local',
});

export function localOrigin(value = 'http://localhost:3000') {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Use a localhost/loopback application origin, with no path or credentials.');
  }
  return url.origin;
}

export async function existingTestUser(admin, persona) {
  const email = testAccounts[persona];
  if (!email) throw new Error(`Choose a test persona: ${Object.keys(testAccounts).join(', ')}`);
  for (let page=1; page<=100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({page,perPage:100});
    if (error) throw error;
    const user = data.users.find((user) => user.email === email);
    if (user) return user;
    if (data.users.length < 100) break;
  }
  throw new Error(`Existing test account not found: ${email}. No account was created.`);
}

export async function testAccountLink(admin, persona, originValue) {
  const origin = localOrigin(originValue);
  const user = await existingTestUser(admin, persona);
  // generateLink creates a one-time token; it does not send email or reset passwords.
  const { data, error } = await admin.auth.admin.generateLink({type:'magiclink',email:user.email});
  if (error) throw error;
  if (data.user.id !== user.id) throw new Error('Unexpected account identity');
  const url = new URL('/auth/callback', origin);
  url.searchParams.set('token_hash',data.properties.hashed_token);
  url.searchParams.set('type','magiclink');
  url.searchParams.set('next','/journey');
  return {user,url:url.toString()};
}
