import { CreateSubject } from "../components/create-subject";
import { EvalHeader } from "../components/header";

export default function EvalHome() {
  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <EvalHeader />
      <div className="w-full max-w-2xl">
        <CreateSubject />
      </div>
    </div>
  );
}
