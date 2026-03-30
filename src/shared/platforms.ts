

export interface PlatformLogo {
  id: number;
  name: string;
  platformName?: string;
  logoUrl: string | null;
  uniqueKey?: string;
}


export function getPlatformIcon(platformName: string | undefined): string {
  if (!platformName) {
    return "/icons/platforms/windows.png";
  }

  const name = platformName.toLowerCase();

  
  if (name.includes("pc") || name.includes("windows") || name.includes("microsoft")) {
    return "/icons/platforms/windows.png";
  }

  
  if (name.includes("linux") || name.includes("steamos")) {
    return "/icons/platforms/linux.png";
  }

  if (name.includes("mac") || name.includes("os x")) {
    return "/icons/platforms/macos.png";
  }

  
  if (
    name.includes("playstation") ||
    name.includes("ps5") ||
    name.includes("ps4") ||
    name.includes("ps3") ||
    name.includes("ps2") ||
    name.includes("ps one") ||
    name.includes("ps vita") ||
    name.includes("playstation 5") ||
    name.includes("playstation 4") ||
    name.includes("playstation 3")
  ) {
    return "/icons/platforms/playstation.png";
  }

  
  if (
    name.includes("xbox") ||
    name.includes("xbox one") ||
    name.includes("xbox series") ||
    name.includes("xbox 360")
  ) {
    return "/icons/platforms/xbox.png";
  }

  if (name.includes("nintendo switch") || name.includes("switch 2")) {
    return "/icons/platforms/nintendo-switch.png";
  }

  
  if (
    name.includes("game boy") ||
    name.includes("gameboy") ||
    name.includes("nintendo 64") ||
    name.includes("n64") ||
    name.includes("gamecube") ||
    name.includes("snes") ||
    name.includes("super nintendo") ||
    name === "nintendo" ||
    name.includes("nintendo entertainment system") ||
    name.includes("nes")
  ) {
    return "/icons/platforms/nintendo.png";
  }

  if (name === "wii") {
    return "/icons/platforms/wii.png";
  }

  if (name.includes("wii u")) {
    return "/icons/platforms/wiiu.png";
  }

  
  if (
    name.includes("nintendo ds") ||
    name.includes("nintendo 3ds") ||
    name.includes("nintendo dsi") ||
    name.includes("3ds") ||
    name.includes("dsi")
  ) {
    return "/icons/platforms/ds.png";
  }

  if (name.includes("ios") || name.includes("iphone") || name.includes("ipad")) {
    return "/icons/platforms/ios.png";
  }

  if (name.includes("android") || name.includes("mobile")) {
    return "/icons/platforms/android.png";
  }

  if (name.includes("stadia") || name.includes("google")) {
    return "/icons/platforms/google.png";
  }

  if (name.includes("steam")) {
    return "/icons/platforms/steam.png";
  }

  if (
    name.includes("vr") ||
    name.includes("oculus") ||
    name.includes("steamvr") ||
    name.includes("playstation vr") ||
    name.includes("ps vr") ||
    name.includes("mixed reality") ||
    name.includes("daydream")
  ) {
    return "/icons/platforms/vr.png";
  }

  return "/icons/platforms/windows.png";
}





