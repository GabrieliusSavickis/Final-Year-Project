import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AuthService } from '@auth0/auth0-angular';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Chart, ChartType } from 'chart.js/auto';
import { interval, Subscription } from 'rxjs';

interface WorkoutSummary {
  _id: number;
  totalDuration: number;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
})
export class AdminPage implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart!: Chart;
  private updateSubscription!: Subscription;

  constructor(public auth: AuthService, private router: Router, private http: HttpClient) { }

  ngOnInit() {
    this.loadMonthlyWorkoutSummary();
    // Polling every 30 seconds
    this.updateSubscription = interval(30000).subscribe(
      () => this.loadMonthlyWorkoutSummary()
    );
  }

  ngAfterViewInit() {
    // Initialize chart with dummy data
    this.createChart([], []);
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    if (this.chart) {
      this.chart.destroy();
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
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
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

  loadMonthlyWorkoutSummary() {
    this.http.get<WorkoutSummary[]>('http://localhost:3000/api/monthly-workout-summary').subscribe(data => {
      const labels = data.map(item => `Day ${item._id}`);
      const durations = data.map(item => item.totalDuration / 3600); // Convert seconds to hours
      this.createChart(labels, durations);
    }, error => {
      console.error('Failed to fetch workout summary:', error);
    });
  }

  logout() {
    this.auth.logout();
  }
}
