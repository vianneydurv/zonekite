import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ForumListScreen from '../screens/ForumListScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import { colors, typography } from '../theme';

export type ForumStackParamList = {
  ForumList: undefined;
  CreatePost: undefined;
  PostDetail: { postId: string };
};

const Stack = createNativeStackNavigator<ForumStackParamList>();

export default function ForumStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.ocean[900] },
        headerTintColor: colors.neutral.white,
        headerTitleStyle: { ...typography.h3, color: colors.neutral.white },
        headerBackTitle: '',
      }}
    >
      <Stack.Screen name="ForumList" component={ForumListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Nouveau sujet' }} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Discussion' }} />
    </Stack.Navigator>
  );
}
