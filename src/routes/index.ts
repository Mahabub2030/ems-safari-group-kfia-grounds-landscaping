import App from "@/App";
import Employees from "@/components/layout/Employees";


import Home from "@/pages/Home";

import { createBrowserRouter } from "react-router";
import DocumentExpiration from "@/pages/DocumentExpiration";
import Dashboard from "@/pages/Dashboard/Dashboard";

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
        path: "DocumentExpiration",
        Component: DocumentExpiration,
      },
      {
        path: "Dashboard",
        Component: Dashboard,
      },
    ],
  },
]);
