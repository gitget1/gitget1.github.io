import { createDrawerNavigator } from "@react-navigation/drawer";
import MapHomeScreen from "../../screens/map/MapHomeScreen";
import FeedHomeScreen from "../../screens/feed/FeedHomeScreen";
import CalenderHome from "../../screens/calendar/CalenderHome";
const Drawer = createDrawerNavigator();
function MainDrawerNavigator () {
  

  return (
    <Drawer.Navigator>
      <Drawer.Screen name="MapHome" component={MapHomeScreen}/>
      <Drawer.Screen name="FeedHome" component={FeedHomeScreen}/>
      <Drawer.Screen name="CalenderHome" component={CalenderHome}/>
    </Drawer.Navigator>
  );
}

export default MainDrawerNavigator