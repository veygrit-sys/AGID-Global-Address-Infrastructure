import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const valueAfter = flag => {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
};
const sourceDir = valueAfter('--source-dir');
assert.ok(sourceDir, 'usage: --source-dir <directory> [--ogrinfo <executable>]');
const ogrinfo = valueAfter('--ogrinfo') ?? process.env.OGRINFO ?? 'ogrinfo';
const expected = new Map([
  ['dls-api-catalog.html', [1026904, 'af485af1e0bc228ea46c238fe62440e51e5305fd9577cc52a4f9aae0ea92a01a']],
  ['dls-data-files.html', [1443148, '2fbcaedc2c87c291a06e3635bd6102b35eb4fd95f6f255d89e3db6540eb6768b']],
  ['dls-disclaimer.html', [991749, '1f5092e8ee89bd755140d0cbe5cd8ff428b91d5b08265d9610596707bcca6251']],
  ['dls-postal-sectors.zip', [4157617, 'f5a43ec68c6ca1c5f93817bca05a88feea69f46b9da7717478a7c01aaeb80108']],
  ['govuk-address-bfpo.html', [72800, 'e4a78e28b8d785a7c4ad655b1c8e2b96b47ef3a75c86f37544f35e49b3c94b9c']],
  ['govuk-defence-network.html', [79596, 'cd65e9bf05b42c801d38bb01329b66ff1172cccf2515d88d32d011af9150e3c1']],
  ['govuk-find-bfpo.html', [157882, '1f035b4930c368032a52a75397fb35ba8dc0f6073742598c695a0e96d98dfa4d']],
  ['govuk-security-services.html', [92525, '28cb14a0f53d71b0b96dfca51e80963259a11b083fa4b7b1e30b510acc885485']],
  ['govuk-terms.html', [80557, 'e2d2f136e1a7cee01066b3cf387ccf0aa14f635a90c9b978383ae56d9de73b12']]
]);
const bodies = {};
for (const [name, [bytes, sha256]] of expected) {
  const body = readFileSync(path.join(sourceDir, name));
  assert.equal(body.length, bytes, `${name} byte mismatch`);
  assert.equal(createHash('sha256').update(body).digest('hex'), sha256, `${name} digest mismatch`);
  bodies[name] = body;
}
const text = name => bodies[name].toString('utf8');
assert.match(text('govuk-find-bfpo.html'), /Akrotiri[\s\S]{0,1000}(?:\\u003e|>)57(?:\\u003c|<)[\s\S]{0,1000}BF1\s*2AT/i);
assert.match(text('govuk-find-bfpo.html'), /Episkopi[\s\S]{0,1000}(?:\\u003e|>)53(?:\\u003c|<)[\s\S]{0,1000}BF1\s*2AS/i);
assert.match(text('govuk-address-bfpo.html'), /BFPO number/i);
assert.match(text('govuk-address-bfpo.html'), /not.*(?:town|location)|rather than.*(?:town|country)/i);
assert.match(text('govuk-security-services.html'), /RAF Akrotiri[\s\S]{0,2000}BFPO\s*57/i);
assert.match(text('govuk-terms.html'), /Open Government Licence|OGL/i);
assert.match(text('dls-data-files.html'), /ORIA_TAXYDROMIKON_KODIKON_Shapefile\.zip/i);
assert.match(text('dls-data-files.html'), /2025\/09\/ORIA_TAXYDROMIKON_KODIKON_Shapefile\.zip/i);
assert.match(text('dls-api-catalog.html'), /CadastralMap/i);
assert.match(text('dls-api-catalog.html'), /dls_portal_badmin@dls\.moi\.gov\.cy/i);
assert.match(text('dls-disclaimer.html'), /συμβουλευτικού και μόνο χαρακτήρα/i);

const zipPath = `/vsizip/${path.resolve(sourceDir, 'dls-postal-sectors.zip')}`;
const runOgrinfo = args => {
  const result = spawnSync(ogrinfo, args, { encoding: 'utf8' });
  assert.equal(result.error, undefined, `ogrinfo failed to start: ${result.error?.message}`);
  assert.equal(result.status, 0, `ogrinfo failed: ${result.stderr}`);
  return `${result.stdout}\n${result.stderr}`;
};
const layerSummary = runOgrinfo(['-ro', '-al', '-so', zipPath]);
assert.match(layerSummary, /Layer name: ORIA_TAXYDROMIKON_KODIKON/);
assert.match(layerSummary, /DBF_DATE_LAST_UPDATE=2025-09-30/);
assert.match(layerSummary, /Geometry: Polygon/);
assert.match(layerSummary, /Feature Count: 870/);
assert.match(layerSummary, /CGRS_1993_LTM/);
assert.match(layerSummary, /ID\["ESRI",102319\]/);
const quality = runOgrinfo(['-ro', '-dialect', 'SQLITE', '-geom', 'NO', '-sql', 'SELECT COUNT(*) AS features, COUNT(DISTINCT CAST(POST_CODE AS INTEGER)) AS unique_codes, COUNT(DISTINCT VIL_NM_E) AS village_names, SUM(CASE WHEN geometry IS NULL THEN 1 ELSE 0 END) AS null_geometry, SUM(CASE WHEN ST_IsValid(geometry)=0 THEN 1 ELSE 0 END) AS invalid_geometry FROM ORIA_TAXYDROMIKON_KODIKON', zipPath]);
assert.match(quality, /features \(Integer\) = 870/);
assert.match(quality, /unique_codes \(Integer\) = 848/);
assert.match(quality, /village_names \(Integer\) = 459/);
assert.match(quality, /null_geometry \(Integer\) = 0/);
assert.match(quality, /invalid_geometry \(Integer\) = 0/);
const duplicates = runOgrinfo(['-ro', '-dialect', 'SQLITE', '-geom', 'NO', '-sql', 'SELECT CAST(POST_CODE AS INTEGER) AS code, COUNT(*) AS features FROM ORIA_TAXYDROMIKON_KODIKON GROUP BY CAST(POST_CODE AS INTEGER) HAVING COUNT(*) > 1 ORDER BY code', zipPath]);
assert.match(duplicates, /Feature Count: 3/);
assert.match(duplicates, /code \(Integer\) = 0[\s\S]*features \(Integer\) = 21/);
assert.match(duplicates, /code \(Integer\) = 7502[\s\S]*features \(Integer\) = 2/);
assert.match(duplicates, /code \(Integer\) = 8879[\s\S]*features \(Integer\) = 2/);
const akrotiri = runOgrinfo(['-ro', '-al', '-geom', 'SUMMARY', '-where', "POST_CODE = '4640'", zipPath, 'ORIA_TAXYDROMIKON_KODIKON']);
assert.match(akrotiri, /Feature Count: 1/);
assert.match(akrotiri, /VIL_NM_E \(String\) = AKROTIRI/);
assert.match(akrotiri, /VIL_CCD \(Integer\) = 5200/);
assert.match(akrotiri, /POST_CODE \(Real\) = 4640\.00000000/);
assert.match(akrotiri, /GLOBALID \(String\) = \{71683F95-EB6E-4194-9CEB-9A957E4A219F\}/);
assert.match(akrotiri, /POLYGON : 1285 points/);
const area = runOgrinfo(['-ro', '-dialect', 'SQLITE', '-geom', 'NO', '-sql', 'SELECT ST_NPoints(geometry) AS points, ST_Area(geometry) AS area_m2, MbrMinX(geometry) AS minx, MbrMinY(geometry) AS miny, MbrMaxX(geometry) AS maxx, MbrMaxY(geometry) AS maxy FROM ORIA_TAXYDROMIKON_KODIKON WHERE CAST(POST_CODE AS INTEGER)=4640', zipPath]);
assert.match(area, /points \(Integer\) = 1285/);
assert.match(area, /area_m2 \(Real\) = 49201505\.1905456/);
assert.match(area, /minx \(Real\) = 190968\.7742/);
assert.match(area, /miny \(Real\) = 325882\.249/);
assert.match(area, /maxx \(Real\) = 203343\.8008/);
assert.match(area, /maxy \(Real\) = 335558\.972100001/);

console.log(JSON.stringify({
  result: 'pass', exactBodies: expected.size,
  exactBytes: [...expected.values()].reduce((sum, [bytes]) => sum + bytes, 0),
  bfpoNumber: '57', shadowPostcode: 'BF1 2AT', distinctEpiskopiRoutePreserved: true,
  dlsEdition: 'September 2025', dlsFeatureCount: 870, dlsUniqueCodes: 848, dlsVillageNames: 459,
  dlsNullGeometry: 0, dlsInvalidGeometry: 0, dlsDuplicateCodeValues: [0, 7502, 8879],
  akrotiriPostalCode: '4640', akrotiriFeatures: 1, geometryType: 'Polygon', geometryPoints: 1285,
  geometryAreaSquareMetres: 49201505.1905456, fixedOfficialGeometryArtifactsInspected: 1,
  operatorReconciledRightsClearedArtifacts: 0
}));
