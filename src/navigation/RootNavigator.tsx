import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SearchScreen from '../screens/SearchScreen';
import SpotsStackNavigator from './SpotsStackNavigator';
import CarpoolStackNavigator from './CarpoolStackNavigator';
import ForumStackNavigator from './ForumStackNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';

export type RootTabParamList = {
  Search: undefined;
  Spots: undefined;
  Carpool: undefined;
  Forum: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Search: 'search',
  Spots: 'location',
  Carpool: 'car',
  Forum: 'chatbubbles',
  Profile: 'person-circle',
};

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.accent[500],
          tabBarInactiveTintColor: colors.ocean[300],
          tabBarStyle: {
            backgroundColor: colors.neutral.white,
            borderTopColor: colors.neutral.border,
          },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICONS[route.name as keyof RootTabParamList]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Search" component={SearchScreen} options={{ title: 'Recherche' }} />
        <Tab.Screen name="Spots" component={SpotsStackNavigator} options={{ title: 'Spots' }} />
        <Tab.Screen name="Carpool" component={CarpoolStackNavigator} options={{ title: 'Covoiturage' }} />
        <Tab.Screen name="Forum" component={ForumStackNavigator} options={{ title: 'Forum' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
