import { Redirect } from 'expo-router';

import { useAuthStore } from '../store/auth-store';

/**
 * Home route.
 *
 * Both route groups are named in parentheses — (auth) and (app) — which means
 * they do not appear in the URL. Without this file there is no route at "/" at
 * all, so anything that opens the app at its root (a web browser, or a
 * `clientflow://` deep link) lands on "Unmatched Route" instead of the app.
 *
 * On a phone the problem is invisible, because the router just shows the first
 * screen in the stack. It only surfaced when the app was first run in a browser.
 */
export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return <Redirect href={isAuthenticated ? '/projects' : '/login'} />;
}
