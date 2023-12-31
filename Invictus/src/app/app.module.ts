import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AuthModule, User } from '@auth0/auth0-angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TabsComponent } from './tabs/tabs.component';
import { NgChartsModule  } from 'ng2-charts';

@NgModule({
  declarations: [AppComponent, TabsComponent],
  imports: [BrowserModule, NgChartsModule , IonicModule.forRoot(), AppRoutingModule, HttpClientModule, FormsModule, 
  // Import the module into the application, with configuration
  AuthModule.forRoot({
    domain: 'dev-jzak5ybyhpmswbfo.us.auth0.com',
    clientId: 'QFrDXSAPNwphdYpiXJdE21QqMUR637vY',
    authorizationParams: {
      redirect_uri: window.location.origin
    }
  }),
],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
