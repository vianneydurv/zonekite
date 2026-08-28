import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CarpoolListScreen from '../screens/CarpoolListScreen';
import CreateTripScreen from '../screens/CreateTripScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import type { Trajet } from '../types/trajet';
import { colors, typography } from '../theme';

export type CarpoolStackParamList = {
  CarpoolList: undefined;
  CreateTrip: undefined;
  TripDetail: { trip: Trajet };
};

const Stack = createNativeStackNavigator<CarpoolStackParamList>();

export default function CarpoolStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.ocean[900] },
        headerTintColor: colors.neutral.white,
        headerTitleStyle: { ...typography.h3, color: colors.neutral.white },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="CarpoolList" component={CarpoolListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ title: 'Proposer un trajet' }} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ title: 'Trajet' }} />
    </Stack.Navigator>
  );
}
