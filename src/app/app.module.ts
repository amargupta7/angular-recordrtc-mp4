import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { RecordRtcComponent } from './record-rtc/record-rtc.component';

@NgModule({
  declarations: [
    AppComponent,
    RecordRtcComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
