import Chart from 'chart.js/auto';

export class LossChart {
    private _lossHistory: number[] = [];
    private ctx: CanvasRenderingContext2D | null;
    private canvas: HTMLCanvasElement | null;
    private chart: Chart | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    public showChart() {
        if (!this.canvas) {
            throw new Error('Canvas not found');
        }

        this.canvas.style.display = 'block';
    }

    public hideChart() {
        if (!this.canvas) {
            throw new Error('Canvas not found');
        }

        this.canvas.style.display = 'none';
    }

    public updateChart(loss: number) {
        if (!this.ctx) {
            throw new Error('Canvas context not found');
        }

        this._lossHistory.push(loss);

        if (!this.chart) {
            this.chart = new Chart(this.ctx, {
                type: 'line',
                data: {
                    labels: Array.from({ length: this._lossHistory.length }, (_, i) => i + 1),
                    datasets: [{
                        label: 'Quanto menor mais inteligente',
                        data: this._lossHistory,
                        borderColor: 'white',
                        borderWidth: 2,
                        fill: false,
                    }]
                },
                options: {
                    color: 'white',
                    borderColor: 'white',
                    responsive: true,
                    aspectRatio: 2,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Gerações',
                                color: 'white'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Perda',
                                color: 'white'
                            }
                        }
                    }
                }
            });
        } else {
            this.chart.data.labels = Array.from({ length: this._lossHistory.length }, (_, i) => i + 1);
            this.chart.data.datasets[0].data = this._lossHistory;
            this.chart.update();
        }
    }
}