import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { AuthModule, User } from '@auth0/auth0-angular';
import { IonicStorageModule } from '@ionic/storage-angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TabsComponent } from './tabs/tabs.component';
import { NgChartsModule } from 'ng2-charts';


@NgModule({
  declarations: [AppComponent, TabsComponent],
  imports: [BrowserModule, NgChartsModule, IonicModule.forRoot(), AppRoutingModule, HttpClientModule, FormsModule, 
  // Import the module into the application, with configuration
  AuthModule.forRoot({
    domain: 'dev-jzak5ybyhpmswbfo.us.auth0.com',
    clientId: 'QFrDXSAPNwphdYpiXJdE21QqMUR637vY',
    authorizationParams: {
      // Check if the app is running in a browser or mobile environment:
      redirect_uri: window.location.origin.includes('localhost')
        ? window.location.origin // Development URL for the web environment
        : 'io.ionic.starter://dev-jzak5ybyhpmswbfo.us.auth0.com/android/io.ionic.starter/callback' // Mobile deep link
    }
  }),
  IonicStorageModule.forRoot()
],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent], 
})
export class AppModule {}
