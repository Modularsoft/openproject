import { Controller } from '@hotwired/stimulus';
import { Chart, registerables, ChartType, ChartOptions, ChartData, ChartItem } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(...registerables);
// Register the plugin to all charts:
Chart.register(ChartDataLabels);

export default class Chartjs extends Controller<HTMLCanvasElement> {
  declare canvasTarget:HTMLCanvasElement;

  declare chart:Chart|undefined;
  declare typeValue:ChartType;
  declare optionsValue:ChartOptions;
  declare dataValue:ChartData;

  declare hasDataValue:boolean;
  declare hasCanvasTarget:boolean;

  static targets = ['canvas'];
  static values = {
    type: {
      type: String,
      default: 'line',
    },
    data: Object,
    options: Object,
  };

  connect():void {
    const element = this.hasCanvasTarget ? this.canvasTarget : this.element;

    this.chart = new Chart(element.getContext('2d') as ChartItem, {
      type: this.typeValue,
      data: this.chartData,
      plugins: [ChartDataLabels],
      options: this.chartOptions,
    });
  }

  disconnect():void {
    this.chart?.destroy();
    this.chart = undefined;
  }

  get chartData():ChartData {
    if (!this.hasDataValue) {
      console.warn('[@stimulus-components/chartjs] You need to pass data as JSON to see the chart.');
    }

    return this.dataValue;
  }

  get chartOptions():ChartOptions {
    return {
      ...this.defaultOptions,
      ...this.optionsValue,
    };
  }

  get defaultOptions():ChartOptions {
    return {};
  }
}
