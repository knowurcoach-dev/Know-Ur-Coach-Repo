import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  cleanStatusNotes,
  buildStatusNotesWithDocs,
  parseDocsPayload,
  updateDocStatusInStatusNotes,
  parseCoachDocuments,
  CoachDocsPayload,
} from '@/lib/coach-docs';

describe('Phase 14: Coach KYC Verification Documents Engine Tests', () => {
  describe('cleanStatusNotes() & buildStatusNotesWithDocs()', () => {
    it('should strip embedded DOCS_PAYLOAD comment leaving only human notes', () => {
      const raw =
        'Verified in-person on 15 Oct. <!--DOCS_PAYLOAD:{"govId":{"status":"VERIFIED"}}-->';
      const cleaned = cleanStatusNotes(raw);

      assert.strictEqual(cleaned, 'Verified in-person on 15 Oct.');
    });

    it('should return empty string when input is null, undefined, or empty', () => {
      assert.strictEqual(cleanStatusNotes(null), '');
      assert.strictEqual(cleanStatusNotes(undefined), '');
      assert.strictEqual(cleanStatusNotes(''), '');
    });

    it('should embed structured JSON payload inside HTML comment safely', () => {
      const payload: CoachDocsPayload = {
        govId: { name: 'Aadhaar.pdf', status: 'VERIFIED' },
        nisCert: { name: 'NIS_Certificate.pdf', status: 'PENDING' },
      };

      const result = buildStatusNotesWithDocs('All documents submitted', payload);

      assert.ok(result.startsWith('All documents submitted <!--DOCS_PAYLOAD:'));
      assert.ok(result.includes('"name":"Aadhaar.pdf"'));
      assert.ok(result.endsWith('-->'));
    });
  });

  describe('parseDocsPayload()', () => {
    it('should parse valid embedded JSON payload from coach statusNotes', () => {
      const coach = {
        statusNotes:
          'Audit OK <!--DOCS_PAYLOAD:{"govId":{"name":"Passport.pdf","status":"VERIFIED"}}-->',
      };

      const payload = parseDocsPayload(coach);
      assert.ok(payload);
      assert.strictEqual(payload.govId?.name, 'Passport.pdf');
      assert.strictEqual(payload.govId?.status, 'VERIFIED');
    });

    it('should return null when coach has no statusNotes or no embedded payload', () => {
      assert.strictEqual(parseDocsPayload(null), null);
      assert.strictEqual(parseDocsPayload({ statusNotes: 'Regular notes only' }), null);
      assert.strictEqual(parseDocsPayload({ statusNotes: '' }), null);
    });

    it('should handle malformed JSON gracefully without throwing', () => {
      const coach = {
        statusNotes: 'Broken <!--DOCS_PAYLOAD:{invalid_json: true}-->',
      };
      const payload = parseDocsPayload(coach);
      assert.strictEqual(payload, null);
    });
  });

  describe('updateDocStatusInStatusNotes()', () => {
    it('should update GOVT_ID status to VERIFIED and append verifiedAt timestamp', () => {
      const initialNotes =
        'Initial verification <!--DOCS_PAYLOAD:{"govId":{"name":"Aadhaar.pdf","status":"PENDING"}}-->';

      const updated = updateDocStatusInStatusNotes(initialNotes, 'GOVT_ID', 'VERIFIED');

      assert.ok(updated.startsWith('Initial verification <!--DOCS_PAYLOAD:'));
      const parsed = parseDocsPayload({ statusNotes: updated });
      assert.ok(parsed);
      assert.strictEqual(parsed.govId?.status, 'VERIFIED');
      assert.strictEqual(parsed.govId?.name, 'Aadhaar.pdf');
      assert.ok(parsed.verifiedAt);
    });

    it('should update NIS_CERT status to REJECTED', () => {
      const initialNotes =
        'Audit notes <!--DOCS_PAYLOAD:{"nisCert":{"name":"NIS.pdf","status":"PENDING"}}-->';

      const updated = updateDocStatusInStatusNotes(initialNotes, 'NIS_CERT', 'REJECTED');

      const parsed = parseDocsPayload({ statusNotes: updated });
      assert.strictEqual(parsed?.nisCert?.status, 'REJECTED');
    });

    it('should update VENUE_PHOTOS status to VERIFIED', () => {
      const initialNotes =
        'Audit notes <!--DOCS_PAYLOAD:{"venuePhotos":[{"url":"https://pic.jpg"}],"venuePhotosStatus":"PENDING"}-->';

      const updated = updateDocStatusInStatusNotes(initialNotes, 'VENUE_PHOTOS', 'VERIFIED');

      const parsed = parseDocsPayload({ statusNotes: updated });
      assert.strictEqual(parsed?.venuePhotosStatus, 'VERIFIED');
    });
  });

  describe('parseCoachDocuments() Real vs. Placeholder Filtering', () => {
    it('should ignore placeholder filenames and only return real uploaded documents', () => {
      const coachWithPlaceholders = {
        id: 'c1',
        name: 'Agra Tennis Academy',
        kycStatus: 'PENDING',
        statusNotes: `Notes <!--DOCS_PAYLOAD:{"govId":{"name":"Govt_ID_Pending.pdf"},"nisCert":{"name":"NIS_Coach_Certificate.pdf"}}-->`,
      };

      const docs = parseCoachDocuments(coachWithPlaceholders);
      // Placeholders must NOT be returned as real docs
      assert.strictEqual(docs.length, 0);
    });

    it('should return real uploaded documents with correct preview types and statuses', () => {
      const coachWithRealDocs = {
        id: 'c2',
        name: 'Agra Badminton Star',
        headCoachName: 'Rajesh Sharma',
        locality: 'Kamla Nagar',
        kycStatus: 'PENDING',
        statusNotes: `Notes <!--DOCS_PAYLOAD:{"govId":{"name":"Rajesh_Aadhaar.jpg","url":"https://cdn.example.com/id.jpg","status":"VERIFIED"},"nisCert":{"name":"Rajesh_NIS_Patiala.pdf","url":"https://cdn.example.com/nis.pdf","status":"PENDING"},"venuePhotos":[{"url":"https://cdn.example.com/v1.jpg","title":"Badminton Court 1"},{"url":"https://cdn.example.com/v2.jpg","title":"Court 2"}],"venuePhotosStatus":"VERIFIED"}-->`,
      };

      const docs = parseCoachDocuments(coachWithRealDocs);

      assert.strictEqual(docs.length, 3);

      // Govt ID
      const govDoc = docs.find((d) => d.type === 'GOVT_ID');
      assert.ok(govDoc);
      assert.strictEqual(govDoc.title, 'Coach Government Photo ID');
      assert.strictEqual(govDoc.status, 'VERIFIED');
      assert.strictEqual(govDoc.previewType, 'image'); // .jpg extension

      // NIS Cert
      const nisDoc = docs.find((d) => d.type === 'NIS_CERT');
      assert.ok(nisDoc);
      assert.strictEqual(nisDoc.title, 'NIS Coach Certification / License');
      assert.strictEqual(nisDoc.status, 'PENDING');
      assert.strictEqual(nisDoc.previewType, 'certificate');

      // Venue Photos
      const venueDoc = docs.find((d) => d.type === 'VENUE_PHOTOS');
      assert.ok(venueDoc);
      assert.strictEqual(venueDoc.title, 'Venue & Safety Facility Photos');
      assert.strictEqual(venueDoc.status, 'VERIFIED');
      assert.strictEqual(venueDoc.previewType, 'gallery');
      assert.strictEqual(venueDoc.photos?.length, 2);
    });

    it('should automatically mark all docs as VERIFIED when coach kycStatus is APPROVED', () => {
      const approvedCoach = {
        id: 'c3',
        kycStatus: 'APPROVED',
        statusNotes: `Notes <!--DOCS_PAYLOAD:{"govId":{"name":"Custom_ID.pdf","url":"https://cdn.example.com/id.pdf","status":"PENDING"}}-->`,
      };

      const docs = parseCoachDocuments(approvedCoach);
      assert.strictEqual(docs.length, 1);
      assert.strictEqual(docs[0].status, 'VERIFIED');
    });
  });
});
