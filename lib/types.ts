export type ViewerProfile = {
  authUserId: string;
  profileId: string | null;
  name: string;
  email: string;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  homeCountry: string | null;
  travelStyle: string | null;
  preferredActivities: string[];
};
