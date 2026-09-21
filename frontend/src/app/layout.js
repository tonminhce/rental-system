import Header from "@/components/Header";
import AppProviders from "@/app/AppProviders";
import "@scss/_global.scss";
import { DM_Sans, Lora } from "next/font/google";
import ChatbotProvider from "@/components/Chatbot";
import { Suspense } from "react";

export const metadata = {
  title: { default: "renTalk — Find a place to belong", template: "%s | renTalk" },
  description:
    "Find your next rental home in Ho Chi Minh City. Explore neighborhoods, compare homes, and get a little help from your AI rental assistant.",
};

const sans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
});
const editorial = Lora({
  subsets: ["latin", "vietnamese"],
  variable: "--font-editorial",
  display: "swap",
  style: ["normal", "italic"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${editorial.variable} ${sans.className}`}>
        <Suspense>
          <AppProviders>
            <ChatbotProvider>
              <Header />
              {children}
            </ChatbotProvider>
          </AppProviders>
        </Suspense>
      </body>
    </html>
  );
}
