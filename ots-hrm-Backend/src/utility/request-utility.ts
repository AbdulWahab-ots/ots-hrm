export const requestPlatformExtract = (userAgent?: string): string => {
  let platform = "Unknown";
  if (userAgent) {
    if (userAgent.includes("Windows")) {
      platform = "Windows";
    } else if (userAgent.includes("Macintosh")) {
      platform = "Mac";
    } else if (userAgent.includes("Linux")) {
      platform = "Linux";
    } else if (userAgent.includes("iPhone")) {
      platform = "iPhone";
    } else if (userAgent.includes("iPad")) {
      platform = "iPad";
    } else if (userAgent.includes("Android")) {
      platform = "Android";
    }
  }
  return platform;
};
