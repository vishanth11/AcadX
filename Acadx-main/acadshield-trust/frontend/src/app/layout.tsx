import "./globals.css";

export const metadata = {
  title: "ACADSHIELD Trust",
  description: "Employer verification service status",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
