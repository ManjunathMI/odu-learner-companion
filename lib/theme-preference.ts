export type ThemePreference = 'light' | 'dark';

export function resolveThemePreference(
  storedTheme: string | null,
  prefersDark: boolean,
): ThemePreference {
  if (storedTheme === 'light') return 'light';
  if (storedTheme === 'dark' || storedTheme === 'neon') return 'dark';
  return prefersDark ? 'dark' : 'light';
}