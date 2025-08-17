import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "../ui/button";
import { useAuth } from "@/context/AuthContext";
import { getDashboardRoute } from "@/lib/routeMap";

export default function Nav() {
  const { user } = useAuth();
  return (
    <div className="flex px-2 py-2 items-center rounded-md mx-2 shadow-xs gap-6 justify-between border sticky right-0 left-0 top-2 bg-white z-50">
      <a href="/">
        <div className="flex items-center ml-4">
          <Rocket size={30} strokeWidth={1.8} />
          <span className="font-semibold text-lg ml-2">CareerSync</span>
        </div>
      </a>

      <NavigationMenu viewport={false}>
        <NavigationMenuList>
          {/* <Item name="Recruiters" to="/recruiter/home" /> */}
          <Item name="Benefits" to="#benefits" />
          <Item name="Partners" to="#partners" />
          <Item name="Reviews" to="#reviews" />
          <Item name="About" to="/" />
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-2">
        {user ? (
          <Link to="/dashboard">
            <Button variant="outline">Dashboard</Button>
          </Link>
        ) : (
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
        )}
        {!user && (
          <Link to="/candidate/signup">
            <Button>Signup</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

type ItemProps = {
  name: string;
  to: string;
};

function Item(props: ItemProps) {
  return (
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <Link to={props.to} className="font-semibold">
          {props.name}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
}
