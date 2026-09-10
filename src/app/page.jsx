import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Nimbus</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        A simple, modern way to manage your money. Send, track, and stay on top of your balance — all in one place.
      </p>
      <div className="flex gap-4">
        <Link href="/signup" className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800">
          Get Started
        </Link>
        <Link href="/login" className="border border-black px-6 py-3 rounded hover:bg-gray-100">
          Log In
        </Link>
      </div>
    </main>
  );
}