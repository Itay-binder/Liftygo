import "./embed.css";
import { EmbedBodyClass } from "./EmbedBodyClass";

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EmbedBodyClass />
      {children}
    </>
  );
}
