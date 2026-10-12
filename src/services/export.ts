import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { buildCsv } from '../lib/csv';
import { today } from '../lib/dates';
import { buildReportHtml, type ReportSummary } from '../lib/report';
import type { AppData } from '../lib/types';

/** Renders the doctor summary to PDF and hands it to the system share sheet; the user decides where it goes. */
export async function sharePdfReport(data: AppData, summary: ReportSummary) {
  const { uri } = await Print.printToFileAsync({ html: buildReportHtml(data, summary) });
  // Give the file a readable name instead of a random cache id.
  const named = new File(Paths.cache, `compite-summary-${summary.start}-to-${summary.end}.pdf`);
  if (named.exists) named.delete();
  await new File(uri).move(named);
  await Sharing.shareAsync(named.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Share summary' });
}

export async function shareCsvExport(data: AppData) {
  const file = new File(Paths.cache, `compite-export-${today()}.csv`);
  if (file.exists) file.delete();
  file.create();
  file.write(buildCsv(data));
  await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: 'Export data' });
}
