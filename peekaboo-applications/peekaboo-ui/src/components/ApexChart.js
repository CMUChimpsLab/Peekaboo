import ReactApexChart from "react-apexcharts";
import { DateTime } from "luxon";

const options = {
  chart: {
    type: "area",
    stacked: false,
    height: 350,
    zoom: {
      type: "x",
      enabled: true,
      autoScaleYaxis: true,
    },
    toolbar: {
      autoSelected: "zoom",
    },
  },
  dataLabels: {
    enabled: false,
  },
  markers: {
    size: 0,
  },
  fill: {
    type: "gradient",
    gradient: {
      shadeIntensity: 1,
      inverseColors: false,
      opacityFrom: 0.5,
      opacityTo: 0,
      stops: [0, 90, 100],
    },
  },
  yaxis: {
    labels: {
      formatter: function (val) {
        return val.toFixed(2);
      },
    },
    title: {
      text: "Soil Moisture",
    },
    min: 0,
    max: 100,
  },
  xaxis: {
    type: "datetime",
    labels: {
      formatter: (date) => {
        return DateTime.fromMillis(date).toFormat("HH:mm:ss MMM dd, yyyy");
      },
    },
  },
  tooltip: {
    shared: false,
    y: {
      formatter: function (val) {
        return val;
      },
    },
  },
};

const ApexChart = (props) => {
  const { name, data } = props;
  const series = [{ name, data }];

  return (
    <div id="chart" style={{ marginBottom: "30px" }}>
      <ReactApexChart
        options={options}
        series={series}
        type="area"
        height={350}
      />
    </div>
  );
};

export default ApexChart;
