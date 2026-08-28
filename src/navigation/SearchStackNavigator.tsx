import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SearchScreen from '../screens/SearchScreen';
import SpotDetailScreen from '../screens/SpotDetailScreen';
import type { Spot } from '../types/spot';
import { colors, typography } from '../theme';

export type SearchStackParamList = {
  SearchHome: undefined;
  SpotDetail: { spot: Spot };
};

const Stack = createNativeStackNavigator<SearchStackParamList>();

export default function SearchStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.ocean[900] },
        headerTintColor: colors.neutral.white,
        headerTitleStyle: { ...typography.h3, color: colors.neutral.white },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="SearchHome" component={SearchScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="SpotDetail"
        component={SpotDetailScreen}
        options={({ route }) => ({ title: route.params.spot.nom })}
      />
    </Stack.Navigator>
  );
}
