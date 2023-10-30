"use client";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import {supabase} from "@/db/supabase";



import Link from "next/link";
import { useEffect, useState } from "react";

export default  function Inbox() {
  const [inbox, setInbox] = useState<any[]>([]);


  useEffect(() => {
    async function getInbox() {
      let { data, error } = await supabase.from("image_audio").select('*')
  if (!data) {
  console.log(error);
  return;
    }
    setInbox(data);
  }
  getInbox();
    
  }, []);


  return (
    <main className="mx-auto max-h-screen max-w-lg overflow-hidden px-2">
      <div className="relative flex items-center justify-center py-5">
        <Link href="/" className="absolute left-2">
          <ChevronLeft />
        </Link>
        <h1 className="text-3xl font-bold">Inbox</h1>
      </div>

      <div className="h-[90vh] snap-y snap-mandatory overflow-y-scroll">
        {inbox.map((item) => (
          <div key={item.id} className="relative h-[90vh] w-full snap-center overflow-hidden bg-muted">
            <img 
            src={item.image_url}
            alt="Palm trees on a beach"
            className="object-cover"
            />
          </div>
        ))}
      </div>
    </main>
  );
}
