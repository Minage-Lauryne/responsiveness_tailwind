import { CreateSubject } from "./components/create-subject";
import { MemberOrAdmin } from "@/components/organization/role-guard";

export default function EvalHome() {
  return (
    <div className="mx-auto max-w-[1400px] px-8 py-6">
      <MemberOrAdmin action="create new analysis">
        <CreateSubject />
      </MemberOrAdmin>
    </div>
  );
}
