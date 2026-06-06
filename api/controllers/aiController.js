import { LeadService } from "../services/leadService.js";
import { NvidiaService } from "../services/nvidiaService.js";

const leads = new LeadService();
const nvidia = new NvidiaService();

export async function analyzeLead(req, res) {
  const lead = await leads.getById(req.body.leadId);
  const result = await nvidia.analyzeLead(lead);
  res.json(result);
}

export async function writeOutreach(req, res) {
  const lead = await leads.getById(req.body.leadId);
  const result = await nvidia.writeOutreach(lead, req.body.type);
  res.json(result);
}
