import { invalid, respond } from "@/lib/respond";
import { scheduleParams } from "@/lib/schemas";
import { bogotaNow, dayTypeOf, scheduledFleet } from "@/lib/schedule";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const params = scheduleParams.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!params.success) return invalid("day o minute no son válidos.");
  const day = params.data.day ?? (await dayTypeOf(bogotaNow().date));
  // The timetable is the same every week, so an answer keeps for an hour.
  return respond(await scheduledFleet(day, params.data.minute), params.data.day ? 3600 : 60);
}
