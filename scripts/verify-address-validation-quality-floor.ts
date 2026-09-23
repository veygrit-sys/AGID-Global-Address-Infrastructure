import {
  buildAddressValidationQualityFloorReport,
  validateAddressValidationQualityFloorReport,
} from '../src/lib/addressValidationQualityFloor';

const report = buildAddressValidationQualityFloorReport();
const errors = validateAddressValidationQualityFloorReport(report);

console.log(JSON.stringify({
  version: report.version,
  minimumScore: report.minimumScore,
  engineeringQualityFloorPassed: report.engineeringQualityFloorPassed,
  productionEvidenceReady: report.productionEvidenceReady,
  engineeringDimensions: report.engineeringDimensions.map(dimension => ({
    id: dimension.id,
    score: dimension.score,
    passed: dimension.passed,
  })),
  deploymentEvidenceDimensions: report.deploymentEvidenceDimensions.map(dimension => ({
    id: dimension.id,
    score: dimension.score,
    passed: dimension.passed,
  })),
  blockingGates: report.blockingGates,
  validationErrors: errors,
  nonClaims: report.nonClaims,
}, null, 2));

if (!report.engineeringQualityFloorPassed || errors.length > 0) {
  process.exit(1);
}
