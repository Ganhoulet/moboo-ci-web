import { redirect } from "next/navigation";

// L'ancienne page marketplace est désormais le catalogue filtré sur le réservable.
export default function MarketplacePage() {
  redirect("/annonces?reservable=1");
}
