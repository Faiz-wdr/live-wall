import { useState, useEffect } from 'react';

const STORAGE_KEY = 'livewall_display_name';
const DEVICE_KEY = 'livewall_device_id';

export function useUserIdentity() {
  const [displayName, setDisplayName] = useState<string>('');
  const [deviceId, setDeviceId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem(STORAGE_KEY) || '';
      let storedDeviceId = localStorage.getItem(DEVICE_KEY);

      if (!storedDeviceId) {
        storedDeviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(DEVICE_KEY, storedDeviceId);
      }

      setDisplayName(storedName);
      setDeviceId(storedDeviceId);
      setIsInitialized(true);
    }
  }, []);

  const saveIdentity = (name: string) => {
    const formattedName = name.startsWith('@') ? name : `@${name}`;
    localStorage.setItem(STORAGE_KEY, formattedName);
    setDisplayName(formattedName);
  };

  const updateIdentity = (name: string) => {
    saveIdentity(name);
  };

  const clearIdentity = () => {
    localStorage.removeItem(STORAGE_KEY);
    setDisplayName('');
  };

  return {
    displayName,
    deviceId,
    isInitialized,
    saveIdentity,
    updateIdentity,
    clearIdentity,
  };
}
