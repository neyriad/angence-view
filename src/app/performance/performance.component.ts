import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import * as HighCharts from 'highcharts';
import { Consultant } from '../models/consultant.model';
import { Earnings } from '../models/earnings.model';
import { PerformanceService } from '../services/performance.service';
import { Month } from '../viewModels/months.model';
import { PerformanceDto } from '../models/performance-dto.model';
import { Observable, forkJoin } from 'rxjs';

@Component({
  selector: 'app-performance',
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.css']
})
export class PerformanceComponent implements OnInit {

  public consultants: Consultant[];
  public earnings: Consultant[];
  public loading: boolean;

  public months: Month[];
  public years: number[];

  public initMonth: number;
  public endMonth: number;
  public initYear: number;
  public endYear: number;

  public initQueryMonth: number;
  public endQueryMonth: number;
  public initQueryYear: number;
  public endQueryYear: number;

  public showEarnings: boolean;
  public showGraphics: boolean;
  public showPizzas: boolean;

  public barTitle: string;
  public pieTitle: string;

  public barsCharts = HighCharts;
  public barsOptions: any;
  public piesCharts = HighCharts;
  public piesOptions: any;

  private _selected: Consultant[];
  private _barsCategory: string[];
  private _barsSerial: any | undefined;

  private _performanceList: PerformanceDto[];

  constructor(private service: PerformanceService, private spinner: NgxSpinnerService) { 
    this.consultants = [];
    this.earnings = [];
    this._selected = [];
    this.loading = false;
    this.months = [
      { id: 1, value: 'Jan', name: 'Janeiro'},
      { id: 2, value: 'Fev', name: 'Fevereiro'},
      { id: 3, value: 'Mar', name: 'Marco'},
      { id: 4, value: 'Abr', name: 'Abril'},
      { id: 5, value: 'Mai', name: 'Maio'},
      { id: 6, value: 'Jun', name: 'Junho'},
      { id: 7, value: 'Jul', name: 'Julho'},
      { id: 8, value: 'Ago', name: 'Agosto'},
      { id: 9, value: 'Set', name: 'Setembro'},
      { id: 10, value: 'Out', name: 'Outubro'},
      { id: 11, value: 'Nov', name: 'Novembro'},
      { id: 12, value: 'Dez', name: 'Dezembro'}
    ];
    this.years = [2003, 2004, 2005, 2006, 2007];
    this.initMonth = 1;
    this.endMonth = 2;
    this.initYear = 2007;
    this.endYear = 2007;

    
    this.initQueryMonth = 0;
    this.endQueryMonth = 0;
    this.initQueryYear = 0;
    this.endQueryYear = 0;

    this.showEarnings = false;
    this.showGraphics = false;
    this.showPizzas = false;

    this.barTitle = "";
    this.pieTitle = "";
    this._barsCategory = [];

    this._performanceList = [];
  }

  ngOnInit(): void {
    this.loading = true;
    this.spinner.show();
    this.service.getAllConsultants().subscribe( (r) => {
      this.consultants = r;
      this.loading = false;
      this.spinner.hide();
    });
  }

  public markConsultant( object: Consultant): void {
    if(object.selected === undefined) object.selected = false;
    object.selected = !object.selected;
  }

  public getEarnings(): void {
    this.showEarnings = true;
    this.showGraphics = false;
    this.showPizzas = false;

    if (!this.isReadyForRequest()) return;

    this._selected.map( (s: Consultant)=> {
      const filter = this.buildRequestParam(s);

      this.service.getEarnings(filter).subscribe( (r: Earnings[]) => {
        s.earnings = r;
        this.earnings.push(s);

        this.loading = false;
        this.spinner.hide();
      });
    });

  }

  public getInitPeriodo(): string {
    const monthName = this.months.find( (x: Month) => x.id === this.initQueryMonth)?.name;
    return `${monthName} de ${this.initQueryYear}`;
  }

  public getEndPeriodo(): string {
    const monthName = this.months.find( (x: Month) => x.id === this.endQueryMonth)?.name;
    return `${monthName} de ${this.endQueryYear}`;
  }

  public getGraphic(): void {

    this.showEarnings = false;
    this.showGraphics = true;
    this.showPizzas = false;

    if (!this.isReadyForRequest()) return;

    this._performanceList = [];
    this._barsSerial = [];
    this._barsCategory = [];
    let aveFixedCostGraph: number[] = [];
    let fixedCost: number = 0.0;

    const observables: Observable<PerformanceDto>[] = this._selected.map( (s: Consultant)=> {
      const filter = this.buildRequestParam(s);
      return this.service.getRangeCalculation(filter);
    });

    forkJoin(observables).subscribe( (responses: PerformanceDto[]) => {
      this._performanceList = responses;

      if (this._barsCategory?.length === 0)
        this._barsCategory = responses[0].monthList;
      
      responses.map( (response: PerformanceDto) => {
        this._barsSerial.push({
          type: 'column',
          name: response.userName,
          data: response.valueList
        });

        fixedCost += response.fixedCost;
      });

      const aveFixedCost = fixedCost/responses.length;
      for (let index = 0; index < this._barsCategory.length; index++) {
        aveFixedCostGraph.push(aveFixedCost);
      }
      this._barsSerial.push({
        type: 'spline',
        name: 'Costo Fijo Promedio',
        data: aveFixedCostGraph
      });

      this.barChart(this._barsCategory, this._barsSerial);
      this.loading = false;
      this.spinner.hide();
    }, 
    err => {
      this.loading = false;
      this.spinner.hide();
      console.error(err)}
    );
    
  }

  private barChart(category: string[], serial: any): void {
    this.barsOptions = {
      title: {
        text: 'Performance Comercial'
      },
      subtitle: {
        text: `Desde ${this.getInitPeriodo()} hasta ${this.getEndPeriodo()}`
      },
      xAxis: {
        categories: category
      },
      yAxis: {          
         title:{
            text:'BRL (R$)'
         } 
      },
      series: serial
    };

  }

  public getPizzas(): void{
    this.showEarnings = false;
    this.showGraphics = false;
    this.showPizzas = true;
    
    if (!this.isReadyForRequest()) return;
    
    let totalGanacias: number = 0.0;
    let pieSerial: any[] = [];
    this._performanceList = [];

    const observables: Observable<PerformanceDto>[] = this._selected.map( (s: Consultant)=> {
      const filter = this.buildRequestParam(s);
      return this.service.getRangeCalculation(filter);
    });

    forkJoin(observables).subscribe( (responses: PerformanceDto[]) => {
      this._performanceList = responses;
      responses.map( (r) => {
        totalGanacias += r.totalPerformance;
      });
      
      responses.map( (r) => {
        const percentage = (r.totalPerformance*100)/totalGanacias;
        pieSerial.push([r.userName, percentage]);
      });

      this.pieChar(pieSerial);

      this.loading = false;
      this.spinner.hide();
    }, 
    err => {
      this.loading = false;
      this.spinner.hide();
      console.error(err)}
    );
  }

  private pieChar(serial: any[]): void {
    this.piesOptions = {   
      chart : {
         plotBorderWidth: null,
         plotShadow: false
      },
      title : {
         text: 'Representando Por cientos de ganacias'   
      },
      subtitle: {
        text: `Desde ${this.getInitPeriodo()} hasta ${this.getEndPeriodo()}`
      },
      tooltip : {
         pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
      },
      plotOptions : {
         pie: {
            allowPointSelect: true,
            cursor: 'pointer',
            dataLabels: {
               enabled: true           
            },
            showInLegend: true
         }
      },
      series : [{
         type: 'pie',
         name: 'Por ciento del total',
         data: serial
      }]
   };
  }


  private isReadyForRequest(): boolean {

    this._selected = this.consultants.filter( (x) => x.selected === true );
    if(this._selected.length === 0) return false;

    this.earnings = [];
    this.loading = true;
    this.spinner.show();

    this.initQueryMonth = this.initMonth;
    this.initQueryYear = this.initYear;
    this.endQueryMonth = this.endMonth;
    this.endQueryYear = this.endYear;
    return true;
  }

  private buildRequestParam(s: Consultant): any {
    return {
      user: s.userName,
      initDate: new Date(this.initYear, this.initMonth-1, 1),
      endDate: new Date(this.endYear, this.endMonth-1, 1),
    };
  }

  private getPerformance(): void {
    const observables: Observable<PerformanceDto>[] = this._selected.map( (s: Consultant)=> {
      return this.service.getRangeCalculation( this.buildRequestParam(s) );
    });

    forkJoin(observables).subscribe( (responses: PerformanceDto[]) => {
      this._performanceList = responses;
      this.loading = false;
      this.spinner.hide();
    }, 
    err => {
      this.loading = false;
      this.spinner.hide();
      console.error(err)
    });
  }

}
