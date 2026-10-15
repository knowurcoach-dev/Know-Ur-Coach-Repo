/**
 * Coach In-App Verification Documents Helper
 * Parses, formats, and provides rich preview data for coach KYC documents.
 */

export interface CoachDocument {
  id: string;
  type: 'GOVT_ID' | 'NIS_CERT' | 'VENUE_PHOTOS' | 'OTHER';
  title: string;
  fileName: string;
  fileUrl?: string;
  fileSize?: string;
  docNumber?: string;
  uploadedAt: string;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  previewType: 'pdf' | 'image' | 'id_card' | 'certificate' | 'gallery';
  photos?: Array<{ url: string; title: string; caption?: string }>;
  description?: string;
  remarks?: string;
}

export interface CoachDocsPayload {
  govId?: {
    name?: string;
    number?: string;
    url?: string;
    status?: 'VERIFIED' | 'PENDING' | 'REJECTED';
  };
  nisCert?: {
    name?: string;
    url?: string;
    status?: 'VERIFIED' | 'PENDING' | 'REJECTED';
  };
  venuePhotos?: Array<{
    url: string;
    title?: string;
  }>;
  venuePhotosStatus?: 'VERIFIED' | 'PENDING' | 'REJECTED';
  verifiedAt?: string;
}

const DOCS_PAYLOAD_REGEX = /<!--DOCS_PAYLOAD:(.*?)-->/;

/**
 * Strips the hidden DOCS_PAYLOAD comment from statusNotes so only human-readable text is displayed
 */
export function cleanStatusNotes(notes?: string | null): string {
  if (!notes) return '';
  return notes.replace(DOCS_PAYLOAD_REGEX, '').trim();
}

/**
 * Builds statusNotes string embedding the structured JSON payload
 */
export function buildStatusNotesWithDocs(notes: string, payload: CoachDocsPayload): string {
  const clean = cleanStatusNotes(notes);
  const jsonStr = JSON.stringify(payload);
  return `${clean} <!--DOCS_PAYLOAD:${jsonStr}-->`;
}

/**
 * Parses the embedded DOCS_PAYLOAD from statusNotes.
 * Returns null if no payload found.
 */
export function parseDocsPayload(coach: any): CoachDocsPayload | null {
  if (!coach) return null;
  const rawNotes = coach.statusNotes || '';
  const match = rawNotes.match(DOCS_PAYLOAD_REGEX);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.warn('Failed to parse DOCS_PAYLOAD JSON:', e);
    }
  }
  return null;
}

/**
 * Updates a specific document's status inside statusNotes payload and returns the updated statusNotes string
 */
export function updateDocStatusInStatusNotes(
  statusNotes: string | null | undefined,
  docType: 'GOVT_ID' | 'NIS_CERT' | 'VENUE_PHOTOS' | string,
  newStatus: 'VERIFIED' | 'PENDING' | 'REJECTED'
): string {
  const rawNotes = statusNotes || '';
  const match = rawNotes.match(DOCS_PAYLOAD_REGEX);
  let payload: CoachDocsPayload = {};

  if (match && match[1]) {
    try {
      payload = JSON.parse(match[1]);
    } catch (e) {
      payload = {};
    }
  }

  if (docType === 'GOVT_ID' || docType.includes('gov')) {
    if (!payload.govId) payload.govId = {};
    payload.govId.status = newStatus;
  } else if (docType === 'NIS_CERT' || docType.includes('nis')) {
    if (!payload.nisCert) payload.nisCert = {};
    payload.nisCert.status = newStatus;
  } else if (docType === 'VENUE_PHOTOS' || docType.includes('venue')) {
    payload.venuePhotosStatus = newStatus;
  }

  payload.verifiedAt = new Date().toISOString();
  return buildStatusNotesWithDocs(cleanStatusNotes(rawNotes), payload);
}

/**
 * Parses all ACTUALLY UPLOADED verification documents for a given coach item.
 * Strictly only returns documents that have real user-provided file data — NO fake/placeholder documents!
 */
export function parseCoachDocuments(coach: any): CoachDocument[] {
  if (!coach) return [];

  const payload = parseDocsPayload(coach);
  const isApproved = coach.kycStatus === 'APPROVED';
  const coachName = coach.headCoachName || coach.name || 'Head Coach';
  const acadName = coach.name || 'Sports Academy';
  const locality = coach.locality || 'Agra';

  const docs: CoachDocument[] = [];

  // 1. Govt Photo ID — only add if a real file was uploaded with real URL or real custom name
  const hasGovId =
    payload?.govId &&
    (Boolean(payload.govId.url) ||
      (Boolean(payload.govId.name) && payload.govId.name !== 'Govt_ID_Pending.pdf' && payload.govId.name !== 'Provided'));

  if (hasGovId && payload?.govId) {
    const isDocVerified = isApproved || payload.govId.status === 'VERIFIED';
    const isDocRejected = payload.govId.status === 'REJECTED';
    docs.push({
      id: `doc-gov-${coach.id || 'new'}`,
      type: 'GOVT_ID',
      title: 'Coach Government Photo ID',
      fileName: payload.govId.name || 'Coach_Aadhaar_ID.pdf',
      fileUrl: payload.govId.url,
      fileSize: '~1.5 MB',
      docNumber: payload.govId.number || undefined,
      uploadedAt: 'Submitted with Digital KYC',
      status: isDocVerified ? 'VERIFIED' : isDocRejected ? 'REJECTED' : 'PENDING',
      previewType:
        payload.govId.url?.startsWith('data:image') || payload.govId.url?.match(/\.(jpeg|jpg|png|webp)/i)
          ? 'image'
          : 'id_card',
      description: 'Official Government of India Aadhaar / Voter Identity Card for head coach authentication.',
    });
  }

  // 2. NIS Coach Certification — ONLY add if a real file was uploaded with real URL or custom filename
  const hasNisCert =
    payload?.nisCert &&
    (Boolean(payload.nisCert.url) ||
      (Boolean(payload.nisCert.name) &&
        payload.nisCert.name !== 'NIS_Coach_Certificate.pdf' &&
        payload.nisCert.name !== 'Provided'));

  if (hasNisCert && payload?.nisCert) {
    const isDocVerified = isApproved || payload.nisCert.status === 'VERIFIED';
    const isDocRejected = payload.nisCert.status === 'REJECTED';
    docs.push({
      id: `doc-nis-${coach.id || 'new'}`,
      type: 'NIS_CERT',
      title: 'NIS Coach Certification / License',
      fileName: payload.nisCert.name || 'NIS_Certificate.pdf',
      fileUrl: payload.nisCert.url,
      fileSize: '~2.8 MB',
      uploadedAt: 'Submitted with Digital KYC',
      status: isDocVerified ? 'VERIFIED' : isDocRejected ? 'REJECTED' : 'PENDING',
      previewType:
        payload.nisCert.url?.startsWith('data:image') || payload.nisCert.url?.match(/\.(jpeg|jpg|png|webp)/i)
          ? 'image'
          : 'certificate',
      description: `Sports Authority of India (SAI) / NSNIS Patiala Diploma in Coaching accreditation.`,
    });
  }

  // 3. Venue & Safety Photos — ONLY add if actual photos were uploaded by the coach
  const venuePhotos = payload?.venuePhotos || [];
  if (venuePhotos.length > 0) {
    const isDocVerified = isApproved || payload?.venuePhotosStatus === 'VERIFIED';
    const isDocRejected = payload?.venuePhotosStatus === 'REJECTED';
    docs.push({
      id: `doc-venue-${coach.id || 'new'}`,
      type: 'VENUE_PHOTOS',
      title: 'Venue & Safety Facility Photos',
      fileName: `${venuePhotos.length} Facility Photo(s) Attached`,
      fileSize: `~${(venuePhotos.length * 1.2).toFixed(1)} MB`,
      uploadedAt: 'Submitted with Digital KYC',
      status: isDocVerified ? 'VERIFIED' : isDocRejected ? 'REJECTED' : 'PENDING',
      previewType: 'gallery',
      photos: venuePhotos.map((p, idx) => ({
        url: p.url,
        title: p.title || `Facility Photo #${idx + 1}`,
        caption: `On-premise verification photo for ${acadName}, ${locality}`,
      })),
      description: 'High-resolution photographs of playing surfaces, safety kits, CCTV placement and facilities.',
    });
  }

  return docs;
}

/**
 * Returns total count of ACTUALLY UPLOADED verification documents.
 * Returns 0 if the coach hasn't uploaded any documents yet.
 */
export function getCoachDocCount(coach: any): number {
  return parseCoachDocuments(coach).length;
}

/**
 * Returns whether the coach has submitted any documents at all
 */
export function hasCoachSubmittedDocs(coach: any): boolean {
  return getCoachDocCount(coach) > 0;
}
