import { buildAddressQlAGradeReadinessReport } from '../src/lib/addressQlAGradeReadiness';

const report = buildAddressQlAGradeReadinessReport();

console.log(JSON.stringify(report, null, 2));

if (!report.readyForAGrade) {
  process.exit(1);
}
