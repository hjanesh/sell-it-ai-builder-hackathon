import AppHeader from "@/components/AppHeader";
import MyListings from "@/components/MyListings";

export default function Me() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-3">
      <AppHeader />
      <MyListings />
    </main>
  );
}
