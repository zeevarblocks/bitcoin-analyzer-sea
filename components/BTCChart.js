import React from 'react';
import {
  ChartCanvas, Chart, XAxis, YAxis, CandlestickSeries, LineSeries,
    CrossHairCursor
    } from 'react-financial-charts';
    import { scaleTime, scaleLinear } from 'd3-scale';

    export function BTCChart({ data }) {
      const height = 400;
        const width = 800;
          const margin = { left: 50, right: 50, top: 10, bottom: 30 };

            const xAccessor = d => new Date(d.date);
              const xExtents = [xAccessor(data[0]), xAccessor(data[data.length - 1])];

                return (
                    <ChartCanvas
                          height={height}
                                width={width}
                                      ratio={1}
                                            margin={margin}
                                                  seriesName="BTC"
                                                        data={data}
                                                              xScale={scaleTime()}
                                                                    xAccessor={xAccessor}
                                                                          xExtents={xExtents}
                                                                              >
                                                                                    <Chart id={1} yScale={scaleLinear()}>
                                                                                            <XAxis />
                                                                                                    <YAxis />
                                                                                                            <CandlestickSeries />
                                                                                                                    <LineSeries yAccessor={d => d.ema70} stroke="#3b82f6" />
                                                                                                                          </Chart>
                                                                                                                                <CrossHairCursor />
                                                                                                                                    </ChartCanvas>
                                                                                                                                      );
                                                                                                                                      }