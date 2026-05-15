import { listTemplates } from "@/features/templates/template-repository";
import { apiError, apiOk } from "@/lib/http/errors";

export async function GET() {
  try {
    const templates = await listTemplates();
    return apiOk({ templates });
  } catch (error) {
    return apiError(error);
  }
}
