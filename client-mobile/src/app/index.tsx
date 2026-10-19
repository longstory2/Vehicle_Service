import { useUser } from '@clerk/expo'
import { Redirect, type Href } from 'expo-router'

const Index = () => {
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) return null;
  if (!isSignedIn || !user) return <Redirect href="/(auth)/welcome" />;
  if (user.unsafeMetadata.role === "mechanic") {
    return <Redirect href="/(tabs)/(MechanicTab)/home" />;
  }
  if (user.unsafeMetadata.profileComplete !== true) {
    return <Redirect href={"/(auth)/complete-profile" as Href} />;
  }

  return <Redirect href="/(tabs)/(CustomerTab)/home" />;
}

export default Index
