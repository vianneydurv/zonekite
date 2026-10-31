import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import CreditsScreen from '../screens/CreditsScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Admin: undefined;
  Credits: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="Admin" component={AdminScreen} />
      <Stack.Screen name="Credits" component={CreditsScreen} />
    </Stack.Navigator>
  );
}
