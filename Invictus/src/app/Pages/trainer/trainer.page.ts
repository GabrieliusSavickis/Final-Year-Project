import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-trainer',
  templateUrl: './trainer.page.html',
  styleUrls: ['./trainer.page.scss'],
})
export class TrainerPage{
  height: number;
  weight: number;

  constructor(private httpClient: HttpClient) { 
    this.height = 0;
    this.weight = 0;
  }

  saveData() {
    // Prepare the data to send to the server
    const data = {
      height: this.height,
      weight: this.weight,
    };

        // Send a POST request to your Express.js server
        this.httpClient.post('http://localhost:3000/tabs/trainer', data).subscribe((response) => {
          console.log('Data saved:', response);
          // You can add more handling or feedback to the user here
        });
      }



}
