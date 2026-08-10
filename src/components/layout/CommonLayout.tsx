import type { ReactNode } from "react";
import Footer from "../Footer";
import Navbar from "../ui/Navbar";

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
