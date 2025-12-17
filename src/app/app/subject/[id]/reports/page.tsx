export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h2>
        <p className="text-lg text-gray-600 mb-2">Reports & Tools feature is under development</p>
        <p className="text-sm text-gray-500">Check back soon for this exciting new feature!</p>
      </div>
    </div>
  );
}
