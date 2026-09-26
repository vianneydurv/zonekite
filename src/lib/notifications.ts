import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

// Notifications push via le service gratuit d'Expo, envoyées directement
// depuis l'app (pas de serveur) : chaque utilisateur publie son jeton push
// dans pushTokens/{uid}, et l'app de l'expéditeur appelle l'API Expo avec
// le jeton du destinataire.

const ANDROID_CHANNEL_ID = 'default';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Données jointes à chaque notification : ce qu'il faut ouvrir à l'appui.
export interface PushData {
  tripId?: string;
}

// Notification reçue app ouverte : on l'affiche quand même en bannière.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function pushTokenDoc(uid: string) {
  return doc(db, 'pushTokens', uid);
}

// Demande l'autorisation (une seule fois, iOS/Android mémorisent la
// réponse) puis publie le jeton de l'appareil. Sans effet sur simulateur,
// sur le web ou si l'utilisateur refuse.
export async function registerForPushNotifications(uid: string): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;

  if (Platform.OS === 'android') {
    // Le canal doit exister avant la demande de jeton (Android 13+).
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Covoiturage',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  const status = existing === 'granted' ? existing : (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await setDoc(pushTokenDoc(uid), { token, platform: Platform.OS, updatedAt: serverTimestamp() });
}

export async function unregisterPushToken(uid: string): Promise<void> {
  await deleteDoc(pushTokenDoc(uid));
}

// Best effort : une notification qui ne part pas (destinataire sans jeton,
// réseau…) ne doit jamais faire échouer l'action qui l'a déclenchée.
export async function sendPushToUser(uid: string, title: string, body: string, data: PushData = {}): Promise<void> {
  try {
    const snap = await getDoc(pushTokenDoc(uid));
    const token = snap.exists() ? (snap.data().token as string | undefined) : undefined;
    if (!token) return;
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({ to: token, title, body, data, sound: 'default', channelId: ANDROID_CHANNEL_ID }),
    });
  } catch {
    // ignoré volontairement (voir plus haut)
  }
}
