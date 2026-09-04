import React from 'react';
import { useAuth } from '../auth/useAuth';
import SplashScreen from '../../screens/SplashScreen';
import AuthNavigator from '../../domains/auth/navigation/AuthNavigator';
import OwnerNavigator from '../../domains/owner/navigation/OwnerNavigator';
import ResellerNavigator from '../../domains/reseller/navigation/ResellerNavigator';
import DistributorNavigator from '../../domains/distributor/navigation/DistributorNavigator';

export default function RootNavigator() {
  const { isLoading, isAuthenticated, userRole } = useAuth();

  // Show splash branding screen while verifying stored credentials & hydrating session
  if (isLoading) {
    return <SplashScreen />;
  }

  // Unauthenticated: Mount AuthNavigator (Login, RoleSelection, Register, ForgotPassword).
  // Once the user authenticates, this stack is unmounted completely from the tree,
  // making it impossible to navigate or back-press to the login/role-selection screen.
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Authenticated: Route strictly to the appropriate domain stack based on user role
  const normalizedRole = (userRole || 'owner').toLowerCase();

  switch (normalizedRole) {
    case 'distributor':
      return <DistributorNavigator />;
    case 'reseller':
      return <ResellerNavigator />;
    case 'owner':
    default:
      return <OwnerNavigator />;
  }
}
