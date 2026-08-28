import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SpotsScreen from '../screens/SpotsScreen';
import SpotDetailScreen from '../screens/SpotDetailScreen';
import type { Spot } from '../types/spot';
import { colors, typography } from '../theme';

export type SpotsStackParamList = {
  SpotsList: undefined;
  SpotDetail: { spot: Spot };
};

const Stack = createNativeStackNavigator<SpotsStackParamList>();

export default function SpotsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.ocean[900] },
        headerTintColor: colors.neutral.white,
        headerTitleStyle: { ...typography.h3, color: colors.neutral.white },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="SpotsList" component={SpotsScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="SpotDetail"
        component={SpotDetailScreen}
        options={({ route }) => ({ title: route.params.spot.nom })}
      />
    </Stack.Navigator>
  );
}
