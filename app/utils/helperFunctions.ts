import { Visit } from '../types';

export const isLastVisitOld = (visits: Visit[]): { isOld: boolean; lastVisitDate?: string } => {
  if (visits.length === 0) return { isOld: false };
  
  const lastVisitDate = new Date(visits[visits.length - 1].date);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  if (lastVisitDate < twoWeeksAgo) {
    return { isOld: true, lastVisitDate: lastVisitDate.toISOString().split('T')[0] };
  }
  
  return { isOld: false };
};

export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered successfully:', registration);

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });

        const response = await fetch('/api/register-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });

        if (response.ok) {
          console.log('User subscribed to push notifications');
        } else {
          console.error('Failed to register push subscription');
        }
      }
    } catch (error) {
      console.error('Error during Service Worker registration:', error);
    }
  }
};

export const sendNotification = async (patientName: string, lastVisitDate: string) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return;
  }

  if (Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    const title = 'Promemoria Visita Paziente';
    const body = `${patientName} non ha visite da ${lastVisitDate}. Potrebbe essere necessario un controllo.`;
    
    await registration.showNotification(title, { body });
  } else if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await sendNotification(patientName, lastVisitDate);
    }
  }
};
