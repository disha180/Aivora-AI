import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1e3a5f',
          borderTopColor: '#334155',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#94a3b8',
        headerStyle: {
          backgroundColor: '#1e3a5f',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="instagram"
        options={{
          title: 'Instagram',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>{'📷'}</Text>,
        }}
      />
      <Tabs.Screen
        name="facebook"
        options={{
          title: 'Facebook',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>{'👥'}</Text>,
        }}
      />
      <Tabs.Screen
        name="spacex"
        options={{
          title: 'SpaceX',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>{'🚀'}</Text>,
        }}
      />
      <Tabs.Screen
        name="whatsapp"
        options={{
          title: 'WhatsApp',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>{'💬'}</Text>,
        }}
      />
      <Tabs.Screen
        name="discord"
        options={{
          title: 'Discord',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>{'🎮'}</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>{'👤'}</Text>,
        }}
      />
    </Tabs>
  );
}
