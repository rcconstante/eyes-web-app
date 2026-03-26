export interface DetectionItem {
  label: string;
  confidence: number;
  bbox: number[];
  distance: number;
}

export interface ResultModel {
  priorityObject: string;
  distance: number;
  isCritical: boolean;
  priorityBbox: number[] | null;
  currency: string | null;
  currencyTotal: number | null;
  currencyMode: boolean;
  sceneType: string;
  alerts: string[];
  detections: DetectionItem[];
  timestamp: Date;
}

export function parseResult(json: any): ResultModel {
  return {
    priorityObject: json.priority_object ?? 'Unknown',
    distance: json.distance ?? 0,
    isCritical: json.is_critical ?? false,
    priorityBbox: json.priority_bbox ?? null,
    currency: json.currency ?? null,
    currencyTotal: json.currency_total ?? null,
    currencyMode: json.currency_mode ?? false,
    sceneType: json.scene_type ?? 'Unknown',
    alerts: json.alerts ?? [],
    detections: (json.detections ?? []).map((d: any) => ({
      label: d.label ?? '',
      confidence: d.confidence ?? 0,
      bbox: d.bbox ?? [],
      distance: d.distance ?? 0,
    })),
    timestamp: new Date(),
  };
}

export function toSpokenSentence(r: ResultModel, _lang?: string): string {
  if (r.currencyMode && r.currency) {
    return `Currency detected. ${r.currency}.`;
  }

  let text = '';
  if (r.isCritical && r.distance > 0 && r.distance < 3.0) {
    text += 'Warning! ';
  }
  text += `${r.priorityObject} detected`;
  if (r.distance > 0) {
    text += `, ${r.distance.toFixed(1)} meters ahead`;
  }
  for (const alert of r.alerts) {
    if (alert.toLowerCase().includes('close')) {
      text += '. Very close, be careful';
    }
  }
  if (r.currency) {
    text += `. Currency: ${r.currency}`;
  }
  text += '.';
  return text;
}

export function shortSummary(r: ResultModel): string {
  if (r.currencyMode && r.currencyTotal != null) {
    return `Currency: ₱${r.currencyTotal.toFixed(0)}`;
  }
  return `${r.priorityObject} at ${r.distance.toFixed(1)}m`;
}
