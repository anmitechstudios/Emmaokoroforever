import { FAMILY_GROUPS, type FamilyMember } from "@/lib/db/types";
import { Reveal } from "@/components/ui/motion";

export function Family({ members }: { members: FamilyMember[] }) {
  const groups = FAMILY_GROUPS.map((group) => ({
    ...group,
    members: members.filter((m) => m.family_group === group.key),
  })).filter((group) => group.members.length > 0);

  return (
    <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3 lg:gap-x-16 lg:gap-y-16">
      {groups.map((group, i) => (
        <Reveal key={group.key} delay={(i % 3) * 0.08} className="border-t border-line pt-6">
          <h3 className="eyebrow !font-sans">{group.label}</h3>
          <ul className="mt-5 space-y-3">
            {group.members.map((member) => (
              <li key={member.id}>
                <p className="font-serif text-2xl leading-tight lg:text-[1.75rem]">{member.name}</p>
                {member.note && <p className="mt-0.5 font-serif text-lg italic text-muted">{member.note}</p>}
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </div>
  );
}
