// Centralized type-safe route names across all domains

export const ROUTES = {
  // Auth Domain
  AUTH: {
    SPLASH: 'Splash',
    ROLE_SELECTION: 'RoleSelection',
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
  },

  // Owner Domain (B2C Vehicle Owner)
  OWNER: {
    ROOT: 'OwnerRoot',
    TABS: 'OwnerTabs',
    HOME: 'OwnerHome',
    PROFILE: 'Profile',
    GARAGE: 'MyGarage',
    PARTS_FINDER: 'PartsFinder',
    VERIFIED_PARTS: 'VerifiedParts',
    TECHNICAL_ENQUIRY: 'TechnicalEnquiry',
    MY_ENQUIRIES: 'MyEnquiries',
    DEALER_LOCATOR: 'DealerLocator',
    WATCHLIST: 'Watchlist',
    NOTIFICATIONS: 'Notifications',
    VEHICLES_LIST: 'VehiclesList',
    MODALS_SCREEN: 'ModalsScreen',
    SUCCESS: 'Success',
    CUSTOM_DRAWER: 'CustomDrawer',
  },

  // Reseller Domain (B2B Workshop & Trade)
  RESELLER: {
    ROOT: 'ResellerRoot',
    TABS: 'ResellerTabs',
    HOME: 'ResellerHome',
    PROFILE: 'Profile',
    COMMERCIAL_QUOTES: 'CommercialQuotes',
    BULK_FITMENT: 'BulkFitment',
    CUSTOM_DRAWER: 'CustomDrawer',
  },

  // Distributor Domain (B2B Supply Chain & Hub)
  DISTRIBUTOR: {
    ROOT: 'DistributorRoot',
    TABS: 'DistributorTabs',
    HOME: 'DistributorHomeScreen',
    PROFILE: 'Profile',
    WHOLESALE_ORDERS: 'WholesaleOrders',
    CUSTOM_DRAWER: 'CustomDrawer',
  },
};
