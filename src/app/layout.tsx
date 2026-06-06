import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "homework-platform",
  description: "부모와 자녀가 함께하는 숙제 캘린더",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
