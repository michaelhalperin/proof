export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string; token?: string } | undefined;
  ResetPassword: { email?: string; token?: string } | undefined;

  // Main app (tab navigator)
  MainTabs: undefined;

  // Stack screens
  Home: undefined;
  LogToday: { editMode?: boolean; dateKey?: string };
  DayDetail: { dateKey: string };
  History: undefined;
  Settings: undefined;
  About: undefined;
  Privacy: undefined;
  ChangePassword: undefined;
  AdminDashboard: undefined;
  Help: undefined;
  Onboarding: undefined;
};

export type TabParamList = {
  Home: undefined;
  History: undefined;
  Map: undefined;
  Statistics: undefined;
  Settings: undefined;
};
