import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function Home() {
  return (
    <div className="flex justify-center items-center h-screen gap-4">
      <Link href="/player"><Button>Player</Button></Link>
      <Link href="/admin/files"><Button>Admin</Button></Link>
    </div>
  );
}
