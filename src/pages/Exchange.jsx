import React from "react";
import ChartPage from "../components/ChartPage";

function Exchange() {
  return (
    <ChartPage
      chartType={["calculated_dxy", "currency", "treasury"]}  // 배열로 입력 가능
      title="환율·채권"
    />
  );
}

export default Exchange;
