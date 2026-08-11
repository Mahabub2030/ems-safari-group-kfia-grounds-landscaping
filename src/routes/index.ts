import App from "@/App";
import Employee from "@/pages/employee";

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
        path:"Employee",
        Component: Employee,
      }
    ],
  },
]);
