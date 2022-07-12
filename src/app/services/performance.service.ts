import { HttpClient, HttpContext, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Consultant } from '../models/consultant.model';
import { Earnings } from '../models/earnings.model';
import { PerformanceDto } from '../models/performance-dto.model';

@Injectable({
  providedIn: 'root'
})
export class PerformanceService {

  private _apiUrl: string;
  private _headers: HttpHeaders;

  constructor(private _httpClient: HttpClient) { 
    this._apiUrl = environment.apiUrl;
    this._headers = new HttpHeaders();
    this._headers.append('Content-Type', 'application/json');
    this._headers.append('Accept', '*/*');
  }

  public getAllConsultants(): Observable<Consultant[]> {
    return this._httpClient.get<Consultant[]>(`${this._apiUrl}/consultants`, { headers: this._headers });
  }

  public getEarnings(filter: any): Observable<Earnings[]> {
    return this._httpClient.post<Earnings[]>(`${this._apiUrl}/earnings`, filter, { headers: this._headers });
  }

  public getBillingInRange(filter: any): Observable<PerformanceDto> {
    return this._httpClient.post<PerformanceDto>(`${this._apiUrl}/month_range`, filter, { headers: this._headers });
  }

  public getBillingForPercentage(filter: any): Observable<PerformanceDto> {
    return this._httpClient.post<PerformanceDto>(`${this._apiUrl}/percentage`, filter, { headers: this._headers });
  }
}
