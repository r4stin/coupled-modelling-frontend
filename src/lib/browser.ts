/** Full page reload; a module seam so components can be tested without touching jsdom's read-only location. */
export const reloadPage = () => window.location.reload();
