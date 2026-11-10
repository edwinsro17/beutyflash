import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importamos todas nuestras pantallas
import SplashScreen from './src/screens/SplashScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AllCategoriesScreen from './src/screens/AllCategoriesScreen';
import CategoryDetailScreen from './src/screens/CategoryDetailScreen';
import SearchResultsScreen from './src/screens/SearchResultsScreen';
import AccountSelectionScreen from './src/screens/AccountSelectionScreen';
import ClientRegistrationScreen from './src/screens/ClientRegistrationScreen';
import SpecialistRegistrationScreen from './src/screens/SpecialistRegistrationScreen';
import SpecialistProfileSetupScreen from './src/screens/SpecialistProfileSetupScreen';
import ServicesAndPricingScreen from './src/screens/ServicesAndPricingScreen';
import AvailabilityAndZoneScreen from './src/screens/AvailabilityAndZoneScreen';
import CredentialsAndInsuranceScreen from './src/screens/CredentialsAndInsuranceScreen';
import ProProfileActivatedScreen from './src/screens/ProProfileActivatedScreen';
import ProDashboardScreen from './src/screens/ProDashboardScreen';
import AgendaScreen from './src/screens/AgendaScreen';
import BilleteraScreen from './src/screens/BilleteraScreen';
import ServiciosScreen from './src/screens/ServiciosScreen';
import MiPerfilScreen from './src/screens/MiPerfilScreen';

// Creamos el "Apilador" de pantallas
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      {/* headerShown: false oculta la barra superior fea por defecto */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="AllCategories" component={AllCategoriesScreen} />
        <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        <Stack.Screen name="AccountSelection" component={AccountSelectionScreen} />
        <Stack.Screen name="ClientRegistration" component={ClientRegistrationScreen} />
        <Stack.Screen name="SpecialistRegistration" component={SpecialistRegistrationScreen} />
        <Stack.Screen name="SpecialistProfileSetup" component={SpecialistProfileSetupScreen} />
        <Stack.Screen name="ServicesAndPricing" component={ServicesAndPricingScreen} />
        <Stack.Screen name="AvailabilityAndZone" component={AvailabilityAndZoneScreen} />
        <Stack.Screen name="CredentialsAndInsurance" component={CredentialsAndInsuranceScreen} />
        <Stack.Screen name="ProProfileActivated" component={ProProfileActivatedScreen} />
        <Stack.Screen name="ProDashboard" component={ProDashboardScreen} />
        <Stack.Screen name="Agenda" component={AgendaScreen} />
        <Stack.Screen name="Billetera" component={BilleteraScreen} />
        <Stack.Screen name="Servicios" component={ServiciosScreen} />
        <Stack.Screen name="MiPerfil" component={MiPerfilScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}