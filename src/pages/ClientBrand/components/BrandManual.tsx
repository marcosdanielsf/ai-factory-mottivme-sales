import React from "react";
import { BrandBookViewer } from "./BrandBookViewer";

interface BrandManualProps {
  brandId: string;
}

export const BrandManual: React.FC<BrandManualProps> = ({ brandId }) => {
  return <BrandBookViewer brandId={brandId} />;
};
