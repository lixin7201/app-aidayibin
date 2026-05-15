const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/ai";

export const appBasePath =
  rawBasePath === "/" ? "" : rawBasePath.replace(/\/+$/, "");

export const cookiePath = appBasePath || "/";

export function appPath(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!appBasePath) {
    return normalizedPath;
  }

  if (normalizedPath === "/") {
    return appBasePath;
  }

  if (normalizedPath === appBasePath || normalizedPath.startsWith(`${appBasePath}/`)) {
    return normalizedPath;
  }

  return `${appBasePath}${normalizedPath}`;
}

export function apiPath(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === "/api" || normalizedPath.startsWith("/api/")) {
    return appPath(normalizedPath);
  }

  return appPath(`/api${normalizedPath}`);
}

export function assetPath(path: string) {
  if (/^(https?:|blob:|data:)/.test(path)) {
    return path;
  }

  return appPath(path);
}
