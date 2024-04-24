import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartType } from 'chart.js/auto';
import { interval, Subscription } from 'rxjs';

interface WorkoutSummary {
  _id: number;
  totalDuration: number;
  averageDuration: number;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit, OnDestroy{

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart!: Chart;
  private updateSubscription!: Subscription;

  @ViewChild('averageChartCanvas') averageChartCanvas!: ElementRef<HTMLCanvasElement>;
  private averageChart!: Chart;

  

  constructor(public auth: AuthService, private router: Router, private http: HttpClient) { }

  ngOnInit() {
    this.loadWeeklyWorkoutSummary();
    // Polling every 30 seconds
    this.updateSubscription = interval(30000).subscribe(
      () => this.loadWeeklyWorkoutSummary()
    );
  }

 

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    if (this.chart) {
      this.chart.destroy();
    }
    if (this.averageChart) {
      this.averageChart.destroy();
    }
  }

  createChart(labels: string[], data: number[]) {
    if (this.chart) {
      this.chart.destroy(); // Destroy existing chart instance if exists
    }

   

    const chartData = {
      labels: labels,
      datasets: [{
        label: 'Daily Workout Time (hours)',
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 1)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    };

    const config = {
      type: 'bar' as ChartType,
      data: chartData,
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    this.chart = new Chart(this.chartCanvas.nativeElement.getContext('2d')!, config);
  }


  createAverageChart(labels: string[], averageDurations: number[]) {
    
    const data = {
      labels: labels,
      datasets: [{
        label: 'Average Workout Time (seconds)',
        data: averageDurations,
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }]
    };

    const config = {
      type: 'line' as ChartType,
      data: data,
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    this.averageChart = new Chart(this.averageChartCanvas.nativeElement.getContext('2d')!, config);
  }


  loadWeeklyWorkoutSummary() {
    this.http.get<any[]>('http://localhost:3000/api/weekly-workout-summary').subscribe(data => {
      const labels = data.map(item => item.dayOfWeek); // Use the day names as labels
      const durations = data.map(item => item.totalDuration / 3600); // Convert seconds to hours for the chart
      const averageDurations = data.map(item => item.averageDuration / 60); // Convert seconds to minutes for the average
  
      // Update the bar chart for total workout durations
      this.createChart(labels, durations);
  
      // Update the line chart for average workout durations
      this.createAverageChart(labels, averageDurations);
  
    }, error => {
      console.error('Failed to fetch workout summary:', error);
    });
  }

  logout() {
    this.auth.logout();
  }
}
