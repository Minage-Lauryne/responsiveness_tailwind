export function LoadingBlur({ loading }: { loading: boolean }) {
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-50 bg-background/50 backdrop-blur-sm">
      <div className="flex h-full w-full items-center justify-center"></div>
    </div>
  );
}
