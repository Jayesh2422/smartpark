import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';

// Screens
import LoginScreen from '../screens/LoginScreen';
import OtpVerifyScreen from '../screens/OtpVerifyScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import ParkingDetailScreen from '../screens/ParkingDetailScreen';
import BookingScreen from '../screens/BookingScreen';
import BookingHistoryScreen from '../screens/BookingHistoryScreen';
import VehiclesScreen from '../screens/VehiclesScreen';
import P2PScreen from '../screens/P2PScreen';
import RentParkingScreen from '../screens/RentParkingScreen';
import AddParkingScreen from '../screens/AddParkingScreen';
import MyListingsScreen from '../screens/MyListingsScreen';
import MyP2PBookingsScreen from '../screens/MyP2PBookingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PaymentScreen from '../screens/PaymentScreen';

const COLORS = { brown: '#6F4E37', white: '#FFFFFF', grayText: '#8B7E74', lightGray: '#E8E4E0' };

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="OtpVerify" component={OtpVerifyScreen} />
        </AuthStack.Navigator>
    );
}

function HomeTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'HomeTab') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'SearchTab') iconName = focused ? 'search' : 'search-outline';
                    else if (route.name === 'HistoryTab') iconName = focused ? 'receipt' : 'receipt-outline';
                    else if (route.name === 'P2PTab') iconName = focused ? 'business' : 'business-outline';
                    else if (route.name === 'ProfileTab') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: COLORS.brown,
                tabBarInactiveTintColor: COLORS.grayText,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopWidth: 1,
                    borderTopColor: COLORS.lightGray,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            })}
        >
            <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Home' }} />
            <Tab.Screen name="SearchTab" component={SearchScreen} options={{ title: 'Search' }} />
            <Tab.Screen name="HistoryTab" component={BookingHistoryScreen} options={{ title: 'My Bookings' }} />
            <Tab.Screen name="P2PTab" component={P2PScreen} options={{ title: 'P2P Parking' }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }} />
        </Tab.Navigator>
    );
}

function MainNavigator() {
    return (
        <MainStack.Navigator screenOptions={{ headerShown: false }}>
            <MainStack.Screen name="MainTabs" component={HomeTabs} />
            <MainStack.Screen name="ParkingDetail" component={ParkingDetailScreen} />
            <MainStack.Screen name="Booking" component={BookingScreen} />
            <MainStack.Screen name="Payment" component={PaymentScreen} />
            <MainStack.Screen name="Vehicles" component={VehiclesScreen} />
            <MainStack.Screen name="RentParking" component={RentParkingScreen} />
            <MainStack.Screen name="AddParking" component={AddParkingScreen} />
            <MainStack.Screen name="MyListings" component={MyListingsScreen} />
            <MainStack.Screen name="MyP2PBookings" component={MyP2PBookingsScreen} />
        </MainStack.Navigator>
    );
}

export default function AppNavigator() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.white }}>
                <ActivityIndicator size="large" color={COLORS.brown} />
            </View>
        );
    }

    return (
        <NavigationContainer key={user?.id ? `app-${user.id}` : 'auth'}>
            {user ? <MainNavigator /> : <AuthNavigator />}
        </NavigationContainer>
    );
}
