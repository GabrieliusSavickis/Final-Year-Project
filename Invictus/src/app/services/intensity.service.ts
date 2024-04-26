import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IntensityService {
  // Define the URL to the Flask API
  private apiUrl = 'http://localhost:5000/predict-intensity';

  // Inject the HttpClient in the constructor
  constructor(private http: HttpClient) { }

  // Define a method to get the intensity prediction from the Flask API
  // The method returns an Observable that resolves to an object with a boolean property 'increase_intensity'
  getIntensityPrediction(): Observable<{increase_intensity: boolean}> {
    return this.http.get<{increase_intensity: boolean}>(this.apiUrl);
  }
}