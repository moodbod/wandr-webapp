export function buildAddToTripIntent(slug: string) {
  return `/explore?intent=add-stop&place=${encodeURIComponent(slug)}`;
}

export function buildAuthRedirectPath(path: string) {
  return `/auth?redirect=${encodeURIComponent(path)}`;
}

export function getAddToTripHref(slug: string, isAuthenticated: boolean) {
  const tripIntent = buildAddToTripIntent(slug);
  return isAuthenticated ? tripIntent : buildAuthRedirectPath(tripIntent);
}

export function sanitizeRedirectPath(path: string | null) {
  if (!path) {
    return "/explore";
  }

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/explore";
  }

  return path;
}
