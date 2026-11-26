import { Component, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toast } from '@wcomp/elementum';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <el-navbar sticky brand="⚡ Elementum" badge="Angular 19" badge-variant="primary">
      <el-theme-switch slot="actions"></el-theme-switch>
    </el-navbar>

    <main style="max-width: 640px; margin: 32px auto; padding: 0 20px; display: grid; gap: 16px;">
      <el-card bordered>
        <el-card-header>
          <el-card-title>Elementum + Angular Standalone</el-card-title>
          <el-card-description>
            Native Web Components with <code>CUSTOM_ELEMENTS_SCHEMA</code> and FACE form controls.
          </el-card-description>
        </el-card-header>
        <el-card-content>
          <el-form toolname="save_workspace" tooldescription="Save workspace settings" toolautosubmit (form-submit)="onSubmit($event)">
            <div style="display: grid; gap: 14px;">
              <el-field label="Workspace Name" required>
                <el-input
                  name="workspace"
                  placeholder="Acme Cloud"
                  ngDefaultControl
                  [(ngModel)]="workspace"
                  required
                ></el-input>
              </el-field>
              <div style="display: flex; gap: 10px; align-items: center;">
                <el-button type="submit" variant="primary">Save Settings</el-button>
                <el-badge variant="default">{{ workspace() }}</el-badge>
              </div>
            </div>
          </el-form>
        </el-card-content>
      </el-card>
    </main>

    <el-toaster></el-toaster>
  `,
})
export class AppComponent {
  workspace = signal('Acme Cloud');

  onSubmit(event: Event) {
    const detail = (event as CustomEvent<{ data?: Record<string, unknown> }>).detail;
    const name = String(detail?.data?.['workspace'] ?? this.workspace());
    toast.success(`Workspace "${name}" saved in Angular 19`);
  }
}
