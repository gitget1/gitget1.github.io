import { createDrawerNavigator } from "@react-navigation/drawer";
import FeedHomeScreen from "../../screens/feed/FeedHomeScreen";
const Drawer = createDrawerNavigator();
function MainDrawerNavigator () {
  

  return (
    <Drawer.Navigator>
      <Drawer.Screen name="FeedHome" component={FeedHomeScreen}/>
    </Drawer.Navigator>
  );
}

export default MainDrawerNavigator