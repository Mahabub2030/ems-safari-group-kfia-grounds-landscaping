import App from "@/App";
import Employees from "@/components/layout/Employees";

import Home from "@/pages/Home";
import { createBrowserRouter } from "react-router";

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
    ],
  },
]);
