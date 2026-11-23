import type { Signal } from './index.js';

export interface A2UiCatalogEntry {
  tag: string;
  layout?: 'column' | 'row';
  isText?: boolean;
  isChip?: boolean;
  valueProp?: string;
  event?: string;
}

export interface A2UiBoundValue {
  path?: string;
  literalString?: string;
  literalNumber?: number;
  literalBoolean?: boolean;
}

export interface A2UiActionEvent {
  surfaceId: string;
  actionName: string;
  sourceComponentId: string;
  context: Record<string, any>;
}

export interface A2UiSurfaceOptions {
  surfaceId?: string;
  catalog?: Record<string, A2UiCatalogEntry>;
  allowlist?: string[] | Set<string>;
  onAction?: (event: A2UiActionEvent) => void;
  initialData?: Record<string, any>;
}

export interface A2UiSurfaceController {
  surfaceId: Signal<string>;
  rootId: Signal<string | null>;
  dataModel: Signal<Record<string, any>>;
  blockedTypes: Signal<string[]>;
  processMessage(msg: Record<string, any>): void;
  processMessages(msgs: Record<string, any>[]): void;
  mount(container: HTMLElement): () => void;
  destroy(): void;
}

export declare const DEFAULT_A2UI_CATALOG: Readonly<Record<string, A2UiCatalogEntry>>;

export declare function createA2UiSurface(options?: A2UiSurfaceOptions): A2UiSurfaceController;
