/**
 * Class analysis → HTML → PDF on the phone (expo-print), then the share sheet. Aggregates only: class and
 * level means, learner counts, grade distribution, stream means and per-subject means next to the child's
 * own marks. No other learner's name or marks are in the data, so none can reach the PDF.
 */
import type { ParentClassAnalysis } from './parentPortalApi';
import { esc, fmt, sharePdfFromHtml } from './reportFormPdf';

export function buildClassAnalysisHtml(a: ParentClassAnalysis, accent = '#0F6B3E'): string {
  const st = a.student ?? { id: '' };
  const ex = a.exam ?? { id: '' };
  const cls = a.class ?? {};
  const lvl = a.level ?? {};
  const me = a.child ?? {};
  const subjects = a.subjects ?? [];
  const dist = cls.grade_distribution ?? [];
  const streams = lvl.streams ?? [];
  const pct = (v?: number | null) => (v != null ? `${fmt(v)}%` : '—');
  const stat = (label: string, value: string) => `<div class="stat"><span>${esc(label)}</span><b>${esc(value)}</b></div>`;
  const meta = [
    ['Learner', st.full_name],
    ['Class', st.class_name],
    ['Level', lvl.name ?? st.class_level],
    ['Exam', ex.name],
    ['Term', ex.term],
    ['Year', ex.academic_year],
  ]
    .filter(([, v]) => v)
    .map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${esc(v)}</b></div>`)
    .join('');
  const subjectRows = subjects
    .map((s) => {
      const diff = s.my_marks != null && s.class_mean != null ? s.my_marks - s.class_mean : null;
      return `<tr>
        <td>${esc(s.subject)}${s.code ? ` <span class="muted">(${esc(s.code)})</span>` : ''}</td>
        <td class="c">${s.my_marks != null ? esc(fmt(s.my_marks)) : '—'}${s.my_grade ? ` <b>${esc(s.my_grade)}</b>` : ''}</td>
        <td class="c">${esc(fmt(s.class_mean ?? null))}</td>
        <td class="c">${esc(fmt(s.level_mean ?? null))}</td>
        <td class="c ${diff == null ? '' : diff >= 0 ? 'up' : 'down'}">${diff == null ? '—' : `${diff >= 0 ? '+' : ''}${esc(fmt(diff))}`}</td>
      </tr>`;
    })
    .join('');
  const total = dist.reduce((acc, d) => acc + d.count, 0) || 1;
  const distRows = dist
    .map(
      (d) => `<tr><td class="b">${esc(d.grade)}</td><td class="c">${d.count}</td>
        <td><div class="bar"><i style="width:${Math.round((d.count / total) * 100)}%"></i></div></td></tr>`,
    )
    .join('');
  const streamRows = streams
    .map(
      (s) => `<tr${s.is_my_class ? ' class="mine"' : ''}><td>${esc(s.class_name || 'Class')}</td><td class="c">${
        s.learners ?? '—'
      }</td><td class="c">${pct(s.mean)}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(`Class analysis — ${st.class_name ?? ''}`)}</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Roboto, 'Segoe UI', Arial, sans-serif; color: #1D1F1B; font-size: 12px; margin: 0; }
  .head { border-bottom: 3px solid ${accent}; padding-bottom: 8px; }
  .head h1 { margin: 0; font-size: 20px; color: ${accent}; }
  .head .sub { color: #5E625B; font-size: 11px; margin-top: 2px; }
  h2 { font-size: 12px; letter-spacing: 0.8px; text-transform: uppercase; margin: 16px 0 6px; color: ${accent}; }
  .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px 14px; margin-top: 10px; }
  .kv span { display: block; color: #5E625B; font-size: 10px; text-transform: uppercase; }
  .kv b { font-size: 12.5px; }
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 12px; }
  .stat { border: 1px solid #E4E5E0; border-radius: 8px; padding: 8px; text-align: center; }
  .stat span { display: block; color: ${accent}; font-size: 9.5px; font-weight: 700; text-transform: uppercase; }
  .stat b { font-size: 15px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: ${accent}; color: #fff; font-size: 10.5px; text-transform: uppercase; padding: 6px; text-align: left; }
  td { border-bottom: 1px solid #E4E5E0; padding: 6px; vertical-align: middle; }
  tr:nth-child(even) td { background: #F7F7F4; }
  tr.mine td { background: #EEF6F1; font-weight: 700; }
  .c { text-align: center; } .b { font-weight: 700; } .muted { color: #8A8D86; font-size: 10px; }
  .up { color: #0F6B3E; font-weight: 700; } .down { color: #B42318; font-weight: 700; }
  .bar { height: 8px; background: #EEEFEA; border-radius: 4px; overflow: hidden; }
  .bar i { display: block; height: 100%; background: ${accent}; }
  .note { margin-top: 18px; color: #8A8D86; font-size: 9.5px; text-align: center; }
</style></head><body>
  <div class="head">
    <h1>${esc(a.school?.name || 'Class analysis')}</h1>
    <div class="sub">Class analysis${st.class_name ? ` · ${esc(st.class_name)}` : ''}${ex.name ? ` · ${esc(ex.name)}` : ''}</div>
  </div>
  <div class="meta">${meta}</div>
  <div class="stats">
    ${stat('Learners in class', cls.learners != null ? String(cls.learners) : '—')}
    ${stat('Class mean', pct(cls.mean))}
    ${stat('Level mean', pct(lvl.mean))}
    ${stat(`${st.full_name ? 'Your child' : 'Learner'} mean`, pct(me.mean))}
    ${stat('Mean grade', me.grade ?? '—')}
    ${stat('Class position', me.position_in_class != null ? `${me.position_in_class}${cls.learners ? ` of ${cls.learners}` : ''}` : '—')}
    ${stat('Level position', me.position_in_level != null ? `${me.position_in_level}${lvl.learners ? ` of ${lvl.learners}` : ''}` : '—')}
    ${stat('Learners in level', lvl.learners != null ? String(lvl.learners) : '—')}
  </div>
  ${
    subjects.length
      ? `<h2>Subjects</h2><table><thead><tr><th>Subject</th><th class="c">Your child</th><th class="c">Class mean</th><th class="c">Level mean</th><th class="c">vs class</th></tr></thead><tbody>${subjectRows}</tbody></table>`
      : ''
  }
  ${
    dist.length
      ? `<h2>Grade distribution (class)</h2><table><thead><tr><th>Grade</th><th class="c">Learners</th><th>Share</th></tr></thead><tbody>${distRows}</tbody></table>`
      : ''
  }
  ${
    streams.length > 1
      ? `<h2>Classes in ${esc(lvl.name || 'the level')}</h2><table><thead><tr><th>Class</th><th class="c">Learners</th><th class="c">Mean</th></tr></thead><tbody>${streamRows}</tbody></table>`
      : ''
  }
  <div class="note">Class and level figures are aggregates only — no other learner is named. Generated in the Tukua app · ${esc(
    new Date().toLocaleDateString(),
  )}</div>
</body></html>`;
}

export async function shareClassAnalysisPdf(a: ParentClassAnalysis, accent?: string): Promise<string> {
  const title = `Class analysis - ${a.student?.class_name || 'Class'}`;
  return sharePdfFromHtml(buildClassAnalysisHtml(a, accent), title, `${title} ${a.exam?.name ?? ''}`, 'class_analysis');
}
