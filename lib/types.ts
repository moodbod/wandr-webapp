export type ViewerProfile = {
  userId: string;
  profileId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  homeCountry: string | null;
  travelStyle: string | null;
  preferredActivities: string[];
};
