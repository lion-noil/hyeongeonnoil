import React from "react";
import ChartPage from "../components/ChartPage";

function Indexes() {
  return (
    <ChartPage
      chartType="index"
      title="세계 주가지수 (100일 평균 ±10%)"
      envelop={10}
    />
  );
}

export default Indexes;
