import { CreateComparativeSubject } from "../../subject/components-comparative/create-subject";

export default function EvalHome() {
  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <div className="w-full max-w-2xl">
        <CreateComparativeSubject />
      </div>
    </div>
  );
}
