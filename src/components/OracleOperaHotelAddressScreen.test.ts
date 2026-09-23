import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, 'OracleOperaHotelAddressScreen.tsx'), 'utf8');

test('Oracle OPERA hotel address screen wires review logic and sample selection', () => {
  assert.match(source, /Oracle OPERA Hotel Address Review/);
  assert.match(source, /buildOracleOperaHotelAddressReview/);
  assert.match(source, /listOracleOperaHotelAddressSamples/);
  assert.match(source, /value=\{draft\.id\}/);
  assert.match(source, /Sample property/);
  assert.match(source, /Hotel address confirmation/);
});

test('Oracle OPERA hotel address screen exposes OHIP mapper and safe preview', () => {
  assert.match(source, /Safe OPERA preview/);
  assert.match(source, /OHIP mapper/);
  assert.match(source, /OHIP mapper lanes/);
  assert.match(source, /Profile \/ Reservation \/ Address \/ Notes/);
  assert.match(source, /review\.ohipMapperLanes\.map/);
  assert.match(source, /review\.mapper\.mapperId/);
  assert.match(source, /review\.mapper\.pathTemplate/);
  assert.match(source, /SafePreviewTable/);
  assert.match(source, /postalCodePresent/);
  assert.match(source, /No raw address response/);
});

test('Oracle OPERA hotel address screen makes security and queue gates visible', () => {
  assert.match(source, /Release gates/);
  assert.match(source, /connectorFetchNoCache \/ no unsafe retry/);
  assert.match(source, /no-cache \/ no unsafe retry \/ RBAC \/ audit/);
  assert.match(source, /Sync queue/);
  assert.match(source, /Sync state/);
  assert.match(source, /同期待ち・失敗・再送禁止/);
  assert.match(source, /review\.syncState\.causeCodes/);
  assert.match(source, /review\.syncState\.deadLetterPolicy/);
  assert.match(source, /Redacted audit events/);
  assert.match(source, /OPERA送信キューへ/);
  assert.match(source, /住所確認済みにする/);
});

test('Oracle OPERA hotel address screen provides role-specific UI for field teams', () => {
  assert.match(source, /Role view/);
  assert.match(source, /役割別UI/);
  assert.match(source, /ORACLE_OPERA_HOTEL_ADDRESS_ROLES\.map/);
  assert.match(source, /item\.role === 'admin'/);
  assert.match(source, /item\.role === 'delivery'/);
  assert.match(source, /'frontDesk'/);
  assert.match(source, /item\.role === 'customer'/);
  assert.match(source, /roleView\.canSeeOperaMapper/);
  assert.match(source, /roleView\.canSeeReleaseGates/);
  assert.match(source, /roleView\.canQueueOperaSync/);
});

test('Oracle OPERA hotel address screen exposes field audit logs and undo controls', () => {
  assert.match(source, /Field audit log/);
  assert.match(source, /現場画面の監査ログ/);
  assert.match(source, /fieldAuditLog/);
  assert.match(source, /undoStack/);
  assert.match(source, /undoLastAction/);
  assert.match(source, /直前の操作を取り消す/);
  assert.match(source, /Undo buffer/);
  assert.match(source, /raw errorはここにも表示しません/);
  assert.match(source, /原因コードだけ表示/);
});

test('Oracle OPERA hotel address screen does not call live sync directly', () => {
  assert.doesNotMatch(source, /syncAddressToOracleOpera/);
  assert.doesNotMatch(source, /fetch\(/);
  assert.match(source, /Dry-run first/);
  assert.match(source, /本番送信はこの画面では実行せず/);
});
