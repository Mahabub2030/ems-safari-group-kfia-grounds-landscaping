import type { ReactNode } from "react";
import Footer from "../Footer";
<<<<<<< HEAD
import Navbar from "../ui/Navbar";
=======
import { Navbar } from "../ui/Navbar";

>>>>>>> 299f4f7693ae87179de4feede84a0e008e0bbba2

interface IProps {
  children: ReactNode;
}

const CommonLayout = ({ children }: IProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="grow">{children}</div>
      <Footer />
    </div>
  );
};

export default CommonLayout;
