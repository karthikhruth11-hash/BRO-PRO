import { useState, useEffect } from 'react';

/**
 * Intelligent automatic device detector for Mobile, Tablet, and Desktop/Laptop
 */
export function detectDevice() {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      deviceType: 'desktop',
      deviceLabel: 'Laptop / PC',
      width: 1200,
      isTouch: false
    };
  }

  const ua = navigator.userAgent || navigator.vendor || window.opera || '';
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const width = window.innerWidth;

  const isMobileUA = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTabletUA = /(iPad|Tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(ua);

  let deviceType = 'desktop';
  let deviceLabel = 'Laptop / PC';

  if (isMobileUA || (width <= 680 && isTouch) || width <= 600) {
    deviceType = 'mobile';
    deviceLabel = /iPhone/i.test(ua) ? 'Apple iPhone' : /Android/i.test(ua) ? 'Android Mobile' : 'Mobile';
  } else if (isTabletUA || (width <= 1024 && isTouch) || (width > 680 && width <= 960)) {
    deviceType = 'tablet';
    deviceLabel = /iPad/i.test(ua) ? 'Apple iPad' : 'Tablet';
  } else {
    deviceType = 'desktop';
    deviceLabel = 'Laptop / PC';
  }

  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';

  return {
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    deviceLabel,
    width,
    isTouch
  };
}

export function useDeviceType() {
  const [deviceInfo, setDeviceInfo] = useState(() => detectDevice());

  useEffect(() => {
    const handleUpdate = () => {
      const detected = detectDevice();
      setDeviceInfo(detected);
      document.documentElement.setAttribute('data-device', detected.deviceType);
    };

    // Apply immediate attribute to root element for instant CSS styling
    document.documentElement.setAttribute('data-device', deviceInfo.deviceType);

    window.addEventListener('resize', handleUpdate, { passive: true });
    window.addEventListener('orientationchange', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('orientationchange', handleUpdate);
    };
  }, []);

  return deviceInfo;
}
