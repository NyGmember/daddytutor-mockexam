import "./globals.css";
import BugReportOverlay from "@/components/BugReportOverlay";

export const metadata = {
  title: "DaddyTutor Mock-Exam",
  description: "ระบบจำลองการสอบวัดความรู้และดูเฉลยวิธีทำอย่างละเอียด",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <head>
        {/* Load KaTeX styles for math formatting */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css"
        />
      </head>
      <body>
        {children}
        <BugReportOverlay />
      </body>
    </html>
  );
}
