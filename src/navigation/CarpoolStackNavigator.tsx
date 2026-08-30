import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CarpoolListScreen from '../screens/CarpoolListScreen';
import CreateTripScreen from '../screens/CreateTripScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import { colors, typography } from '../theme';

export type CarpoolStackParamList = {
  CarpoolList: undefined;
  CreateTrip: { spotId?: string } | undefined;
  TripDetail: { tripId: string };
};

const Stack = createNativeStackNavigator<CarpoolStackParamList>();

export default function CarpoolStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.navyBase },
        headerTintColor: colors.neutral.white,
        headerTitleStyle: { ...typography.h3, color: colors.neutral.white },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="CarpoolList" component={CarpoolListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ title: 'Proposer un trajet' }} />
      <Stack.Screen name="TripDetail" component={TripDetailScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
