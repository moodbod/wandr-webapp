const AUTH_MAP_STYLE = "mapbox/light-v11";
const AUTH_MAP_CENTER: [number, number] = [10, 18];
const AUTH_MAP_ZOOM = 0.7;
const AUTH_MAP_BEARING = 0;
const AUTH_MAP_PITCH = 0;
const AUTH_MAP_SIZE = "1280x1280@2x";

export function getAuthMapStillUrl(token?: string) {
  if (!token) {
    return null;
  }

  const [lng, lat] = AUTH_MAP_CENTER;
  const coordinates = `${lng},${lat},${AUTH_MAP_ZOOM},${AUTH_MAP_BEARING},${AUTH_MAP_PITCH}`;

  return `https://api.mapbox.com/styles/v1/${AUTH_MAP_STYLE}/static/${coordinates}/${AUTH_MAP_SIZE}?access_token=${token}`;
}
