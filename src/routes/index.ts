import App from "@/App";
import Employees from "@/components/layout/Employees";

import Home from "@/pages/Home";

import { createBrowserRouter } from "react-router";

import AboutOperations from "@/pages/AboutOperations";
import Login from "@/pages/Authentication/Login";
import Register from "@/pages/Authentication/Register";
import Dashboard from "@/pages/Dashboard/Dashboard";
import Documents from "@/pages/Documents";
import Expiration from "@/pages/Expiration";
import Vacation from "@/pages/Vacation";

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
        path: "Documents",
        Component: Documents,
      },
      {
        path: "AboutOperations",
        Component: AboutOperations,
      },
      {
        path: "Dashboard",
        Component: Dashboard,
      },
      {
        path: "Login",
        Component: Login,
      },
      {
        path: "Register",
        Component: Register,
      },
    ],
  },
]);
