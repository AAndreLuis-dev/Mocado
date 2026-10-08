import type { FieldType, Perfil } from '@mocado/core';
import type { FillReport, PageContext, ScanResult } from '../application/ports';

export interface MocadoApi {
  scan(ctx: PageContext): Promise<ScanResult>;
  fill(perfil: Perfil, ctx: PageContext): Promise<FillReport>;
  fillFocused(value: string, type: FieldType, ctx: PageContext): Promise<FillReport>;
  focusedSelector(): Promise<{ hostname: string; selector: string } | null>;
}
