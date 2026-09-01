import { permanentRedirect } from "next/navigation";

export default function LegacyBodyFillersPage() {
  permanentRedirect("/shop/fillers/high-volume");
}
