import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SearchStackNavigator from './SearchStackNavigator';
import CarpoolStackNavigator from './CarpoolStackNavigator';
import ForumStackNavigator from './ForumStackNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';

// Le prototype Claude Design n'a que 4 onglets (pas de "Spots" séparé : on y
// accède depuis la Recherche).
export type RootTabParamList = {
  Search: undefined;
  Carpool: undefined;
  Forum: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Search: 'search',
  Carpool: 'car',
  Forum: 'chatbubbles',
  Profile: 'person-circle',
};

const navigationRef = createNavigationContainerRef<RootTabParamList>();

export default function RootNavigator() {
  const [ready, setReady] = useState(false);
  // Dernière notification touchée, y compris celle qui a lancé l'app.
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    const tripId = lastResponse?.notification.request.content.data?.tripId;
    if (!ready || typeof tripId !== 'string') return;
    // Ouvre le trajet concerné dans l'onglet Covoit.
    (navigationRef.navigate as (...args: unknown[]) => void)('Carpool', {
      screen: 'TripDetail',
      params: { tripId },
    });
  }, [ready, lastResponse]);

  return (
    <NavigationContainer ref={navigationRef} onReady={() => setReady(true)}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.blue,
          tabBarInactiveTintColor: colors.navy(0.45),
          tabBarStyle: {
            backgroundColor: colors.neutral.white,
            borderTopColor: colors.neutral.border,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICONS[route.name as keyof RootTabParamList]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Search" component={SearchStackNavigator} options={{ title: 'Recherche' }} />
        <Tab.Screen name="Carpool" component={CarpoolStackNavigator} options={{ title: 'Covoit' }} />
        <Tab.Screen name="Forum" component={ForumStackNavigator} options={{ title: 'Forum' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
