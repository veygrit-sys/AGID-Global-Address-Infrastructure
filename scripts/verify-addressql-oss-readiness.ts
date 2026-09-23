import { buildAddressQlOssReadinessReport } from '../src/lib/addressQlOssReadiness';

const report = buildAddressQlOssReadinessReport(process.cwd());

console.log(JSON.stringify(report, null, 2));

if (!report.ready) {
  process.exitCode = 1;
}
