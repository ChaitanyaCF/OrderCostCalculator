// CSV Template for packaging rates
export const PACKAGING_CSV_TEMPLATE = `prod_type,product,box_qty,pack,transport_mode,packaging_rate
Fresh,Fillet,10 kg,EPS,regular,2
Fresh,Fillet,20 kg,EPS,regular,2.5
Fresh,Fillet,15 kg AIR,EPS AIR,AIR,4
Fresh,Fillet,20 kg AIR,EPS AIR,AIR,4
Fresh,Fillet,VAC,Foil 2-3,regular,4
Frozen,Fillet,VAC,Foil 3-4,regular,3.5
Frozen,Fillet,5 kg,Corrugated Box,regular,2.25
Frozen,Portions,20 kg,Solid Box,regular,1.75`;

// CSV Template for product rates
export const RATE_CSV_TEMPLATE = `product,trim_type,rm_spec,rate_per_kg
Fillet,Trim A,1-2 kg,14.2
Fillet,Trim A,2-3 kg,5.7
Fillet,Trim A,3-4 kg,3.95
Fillet,Trim B,4-5 kg,3.7
Fillet,Trim C,5-6 kg,3.45
Portions,Trim A,1-2 kg,14.2
Portions,Trim B,2-3 kg,5.95
Portions,Trim C,3-4 kg,4.45`;

/**
 * Get a Blob URL for a CSV template
 * @param template The CSV template string
 * @returns A URL that can be used for download
 */
export const getTemplateBlobUrl = (template: string): string => {
  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  return URL.createObjectURL(blob);
};

/**
 * Download a CSV template
 * @param template The CSV template string
 * @param filename The name of the file to download
 */
export const downloadTemplate = (template: string, filename: string): void => {
  const url = getTemplateBlobUrl(template);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}; 