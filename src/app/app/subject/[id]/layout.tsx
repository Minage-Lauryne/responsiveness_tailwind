import { EvalLayout } from "../components/eval-layout";

export default function EvalLayoutPage({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EvalLayout>{children}</EvalLayout>;
}
