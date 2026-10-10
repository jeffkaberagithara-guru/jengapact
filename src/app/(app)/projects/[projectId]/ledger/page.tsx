import { EventList } from "@/components/app/event-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listEvents } from "@/modules/projects/queries";

export default async function LedgerPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const events = await listEvents(projectId, 200);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project event ledger</CardTitle>
        <p className="text-sm text-muted-foreground">
          Append-only. Corrections are new events, never edits of old ones.
        </p>
      </CardHeader>
      <CardContent>
        <EventList events={events} />
      </CardContent>
    </Card>
  );
}
