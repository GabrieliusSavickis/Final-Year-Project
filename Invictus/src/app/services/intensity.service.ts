import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IntensityService {
  private apiUrl = 'http://localhost:5000/predict-intensity'; // URL to your Flask API

  constructor(private http: HttpClient) { }

  getIntensityPrediction(): Observable<{increase_intensity: boolean}> {
    return this.http.get<{increase_intensity: boolean}>(this.apiUrl);
  }
}