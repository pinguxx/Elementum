import { bootstrapApplication } from '@angular/platform-browser';
import '@wcomp/elementum';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch((err) => console.error(err));
