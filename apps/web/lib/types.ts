// CRM field types — mirrors apps/api/src/types/crm.types.ts exactly.
// Do not rename or extend without updating the backend schema first.

export type CrmStatus =
  | 'GOOD_LEAD_FOLLOW_UP'
  | 'DID_NOT_CONNECT'
  | 'BAD_LEAD'
  | 'SALE_DONE';

export type DataSource =
  | 'leads_on_demand'
  | 'meridian_tower'
  | 'eden_park'
  | 'varah_swamy'
  | 'sarjapur_plots';

export interface CrmRecord {
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: CrmStatus;
  crm_note?: string;
  data_source?: DataSource;
  possession_time?: string;
  description?: string;
}

export interface SkippedRecord {
  reason: string;
  original_data?: Record<string, string>;
}

export interface ImportSummary {
  total_rows: number;
  imported: number;
  skipped: number;
}

export interface ImportResponse {
  success: boolean;
  summary: ImportSummary;
  imported: CrmRecord[];
  skipped: SkippedRecord[];
  error?: string;
}

/** All 15 CRM field keys in display order */
export const CRM_FIELD_KEYS: (keyof CrmRecord)[] = [
  'name',
  'email',
  'mobile_without_country_code',
  'country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'data_source',
  'created_at',
  'crm_note',
  'possession_time',
  'description',
];

/** Human-readable column headers for the results table */
export const CRM_FIELD_LABELS: Record<keyof CrmRecord, string> = {
  name: 'Name',
  email: 'Email',
  mobile_without_country_code: 'Mobile',
  country_code: 'Country Code',
  company: 'Company',
  city: 'City',
  state: 'State',
  country: 'Country',
  lead_owner: 'Lead Owner',
  crm_status: 'Status',
  data_source: 'Source',
  created_at: 'Created At',
  crm_note: 'Notes',
  possession_time: 'Possession Time',
  description: 'Description',
};

/** Badge colours for crm_status values */
export const STATUS_COLORS: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30',
  DID_NOT_CONNECT:     'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30',
  BAD_LEAD:            'bg-red-500/15 text-red-400 ring-1 ring-red-500/30',
  SALE_DONE:           'bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/30',
};

export const STATUS_LABELS: Record<CrmStatus, string> = {
  GOOD_LEAD_FOLLOW_UP: 'Follow Up',
  DID_NOT_CONNECT:     'No Connect',
  BAD_LEAD:            'Bad Lead',
  SALE_DONE:           'Sale Done',
};
