import { Inter } from "next/font/google";
import "./globals.css";
import toast, { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Keystone Copy",
  description: "Generated by create next app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {<Toaster toastOptions={{ duration: 3000 }} />}
      </body>
    </html>
  );
}
