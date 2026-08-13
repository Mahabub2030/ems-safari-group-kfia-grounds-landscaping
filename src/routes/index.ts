import App from "@/App";
import Employees from "@/components/layout/Employees";


import Home from "@/pages/Home";

import { createBrowserRouter } from "react-router";

import Dashboard from "@/pages/Dashboard/Dashboard";
import Vacation from "@/pages/Vacation";
import Expiration from "@/pages/Expiration";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        Component: Home,
        index: true,
      },
      {
        path: "Employees",
        Component: Employees,
      },
      {
        path: "Vacation",
        Component: Vacation,
      },
      {
        path: "Expiration",
        Component: Expiration,
      },
      {
        path: "Dashboard",
        Component: Dashboard,
      },
    ],
  },
]);
