import { config } from "../config";

export default function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="prose mx-auto flex max-w-4xl flex-col gap-y-4 p-6">
      <h1 className="">{title}</h1>
      <h3>
        Effective:{` `}
        {new Date(config.lastUpdated).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </h3>
      <div>{children}</div>
    </div>
  );
}
