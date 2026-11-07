/**
 * Report form → HTML → PDF on the phone (expo-print), then the share sheet (expo-sharing).
 * Built from the native report form data (GET /parents/me/report-form), so no web page has to load.
 */
import { Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import type { ParentReportForm } from './parentPortalApi';

export function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function fmt(v: number | null | undefined, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return Number.isInteger(v) ? String(v) : v.toFixed(digits);
}

export function positionText(pos?: number | null, of?: number | null): string {
  if (pos == null) return '—';
  return of != null ? `${pos} of ${of}` : String(pos);
}

export function buildReportFormHtml(r: ParentReportForm, accent = '#0F6B3E'): string {
  const school = r.school ?? {};
  const st = r.student ?? { id: '' };
  const ex = r.exam ?? { id: '' };
  const sm = r.summary ?? {};
  const subjects = r.subjects ?? [];
  const showRemarks = subjects.some((s) => s.remark);
  const rows = subjects
    .map(
      (s, i) => `<tr>
        <td class="c">${i + 1}</td>
        <td>${esc(s.subject)}${s.code ? ` <span class="muted">(${esc(s.code)})</span>` : ''}</td>
        <td class="c">${s.marks != null ? esc(fmt(s.marks)) : '—'}${s.max_marks ? `<span class="muted">/${esc(fmt(s.max_marks, 0))}</span>` : ''}</td>
        <td class="c b">${esc(s.grade ?? '—')}</td>
        <td class="c">${esc(fmt(s.points ?? null))}</td>
        ${showRemarks ? `<td>${esc(s.remark ?? '')}</td>` : ''}
      </tr>`,
    )
    .join('');
  const meta = [
    ['Learner', st.full_name],
    ['Adm. no.', st.admission_number],
    ['Class', st.class_name],
    ['Exam', ex.name],
    ['Term', ex.term],
    ['Year', ex.academic_year],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
    .join('');
  const stat = (label: string, value: string) => `<div class="stat"><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
  const comment = (label: string, text?: string | null) =>
    text ? `<div class="comment"><span>${esc(label)}</span><p>${esc(text)}</p></div>` : '';
  const contact = [school.address, school.phone, school.email].filter(Boolean).map(esc).join(' · ');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(`Report form — ${st.full_name ?? ''}`)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, 'Segoe UI', Arial, sans-serif; color: #1D1F1B; font-size: 12px; margin: 0; }
  .head { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid ${accent}; padding-bottom: 10px; }
  .head img { width: 64px; height: 64px; object-fit: contain; }
  .head h1 { margin: 0; font-size: 20px; color: ${accent}; }
  .head .sub { color: #5E625B; font-size: 11px; margin-top: 2px; }
  h2 { text-align: center; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; margin: 12px 0 8px; }
  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 14px; margin-bottom: 10px; }
  .kv span { display: block; color: #5E625B; font-size: 10px; text-transform: uppercase; }
  .kv b { font-size: 12.5px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { background: ${accent}; color: #fff; font-size: 10.5px; text-transform: uppercase; padding: 6px; text-align: left; }
  td { border-bottom: 1px solid #E4E5E0; padding: 6px; vertical-align: top; }
  tr:nth-child(even) td { background: #F7F7F4; }
  .c { text-align: center; } .b { font-weight: 700; } .muted { color: #8A8D86; font-size: 10px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
  .stat { border: 1px solid #E4E5E0; border-radius: 8px; padding: 8px; text-align: center; }
  .stat span { display: block; color: ${accent}; font-size: 9.5px; font-weight: 700; text-transform: uppercase; }
  .stat b { font-size: 15px; }
  .comment { margin-top: 12px; border-left: 3px solid ${accent}; padding: 4px 10px; }
  .comment span { font-size: 10px; font-weight: 700; color: ${accent}; text-transform: uppercase; }
  .comment p { margin: 3px 0 0; font-size: 12px; line-height: 1.45; }
  .sign { display: flex; justify-content: space-between; margin-top: 28px; color: #5E625B; font-size: 11px; }
  .sign div { border-top: 1px solid #9A9D96; padding-top: 4px; width: 42%; }
  .foot { margin-top: 18px; color: #8A8D86; font-size: 9.5px; text-align: center; }
</style></head><body>
  <div class="head">
    ${school.logo_url ? `<img src="${esc(school.logo_url)}" alt=""/>` : ''}
    <div>
      <h1>${esc(school.name || 'School report')}</h1>
      ${school.motto ? `<div class="sub">${esc(school.motto)}</div>` : ''}
      ${contact ? `<div class="sub">${contact}</div>` : ''}
    </div>
  </div>
  <h2>Learner report form</h2>
  <div class="meta">${meta}</div>
  ${
    subjects.length
      ? `<table><thead><tr><th class="c">#</th><th>Subject</th><th class="c">Marks</th><th class="c">Grade</th><th class="c">Points</th>${
          showRemarks ? '<th>Remark</th>' : ''
        }</tr></thead><tbody>${rows}</tbody></table>`
      : '<p class="muted">Subject marks are not available for this exam yet.</p>'
  }
  <div class="stats">
    ${stat('Total', sm.total_marks != null ? `${fmt(sm.total_marks, 0)}${sm.total_possible ? ` / ${fmt(sm.total_possible, 0)}` : ''}` : '—')}
    ${stat('Mean', sm.overall_mean != null ? `${fmt(sm.overall_mean)}%` : '—')}
    ${stat('Mean grade', sm.overall_grade ?? '—')}
    ${stat('Points', fmt(sm.mean_grade_points ?? null, 2))}
    ${stat('Class position', positionText(sm.rank_in_class, sm.rank_out_of_class))}
    ${stat('Level position', positionText(sm.rank_in_level, sm.rank_out_of_level))}
    ${stat('Class mean', sm.class_mean_marks != null ? `${fmt(sm.class_mean_marks)}%` : '—')}
    ${stat('Level mean', sm.level_mean_marks != null ? `${fmt(sm.level_mean_marks)}%` : '—')}
  </div>
  ${comment('Class teacher', sm.class_teacher_comment)}
  ${comment('Principal', sm.principal_comment)}
  <div class="sign"><div>Class teacher</div><div>Principal${school.principal_name ? ` — ${esc(school.principal_name)}` : ''}</div></div>
  <div class="foot">Generated in the Tukua app · ${esc(new Date().toLocaleDateString())}</div>
</body></html>`;
}

/** Build the PDF and open the share sheet (save / WhatsApp / print). Returns the file uri. */
export async function shareReportFormPdf(r: ParentReportForm, accent?: string): Promise<string> {
  const title = `Report form - ${r.student?.full_name || 'Learner'}`;
  return sharePdfFromHtml(buildReportFormHtml(r, accent), title, `${title} ${r.exam?.name ?? ''}`, 'report_form');
}

/**
 * HTML → PDF (expo-print) → copy to a readable name in the cache root → share sheet (expo-sharing).
 * Shared by the report form and the class analysis.
 */
export async function sharePdfFromHtml(html: string, title: string, fileBase: string, fallbackName: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  let target = uri;
  try {
    const safe = fileBase.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 80);
    // Cache root, not a sub-folder: Expo Go's share provider refuses files in cache sub-folders
    // ("Not allowed to read file under given URL").
    target = `${FileSystem.cacheDirectory || ''}${safe || fallbackName}.pdf`;
    await FileSystem.deleteAsync(target, { idempotent: true });
    await FileSystem.copyAsync({ from: uri, to: target });
  } catch {
    target = uri;
  }
  if (Platform.OS !== 'web' && (await Sharing.isAvailableAsync())) {
    const opts = { mimeType: 'application/pdf', dialogTitle: title, UTI: 'com.adobe.pdf' };
    try {
      await Sharing.shareAsync(target, opts);
    } catch (e) {
      if (target === uri) throw e;
      await Sharing.shareAsync(uri, opts);
      target = uri;
    }
  } else {
    await Share.share({ title, url: target });
  }
  return target;
}
