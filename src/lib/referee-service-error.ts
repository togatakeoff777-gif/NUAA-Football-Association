import type { AppointmentWarning } from "@/lib/referee-conflicts";

export class RefereeServiceError extends Error {
  constructor(
    message: string,
    public status = 400,
    public warnings: AppointmentWarning[] = [],
  ) {
    super(message);
  }
}
