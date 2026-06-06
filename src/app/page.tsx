import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">homework-platform</h1>
      <p className="text-gray-500">부모와 자녀가 함께하는 숙제 캘린더</p>
      <Link
        href="/auth/login"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Google로 시작하기
      </Link>
    </main>
  );
}
