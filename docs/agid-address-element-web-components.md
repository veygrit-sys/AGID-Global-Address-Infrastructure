# AGID Address Element for Web Components

AGID Address Element for Web Components provides a framework-neutral embedded
address input element for EC, CMS, POS, shopping-agent, hotel check-in, and
registration flows.

The element is intentionally local-first. It may hold raw form input inside the
browser shadow DOM while the user is editing, but host applications receive only
safe session metadata, AddressIntent metadata, readiness metadata, and public
events. Raw address text, recipient name, phone number, room/unit, raw AGID,
raw AOID, AGID-S plaintext/ciphertext, proof code, and private key material are
not returned by the public event contract.

## Tag

```html
<agid-address-element
  country-code="JP"
  purpose="delivery"
  mode="local"
  host-surface="ec"
  selected-language="ja"
  qr
  nfc>
</agid-address-element>
```

## Register

```ts
import { defineAgidAddressElement } from './src/web-components';

defineAgidAddressElement();
```

The module also self-registers when loaded in a browser with `customElements`
available, so a direct module import is enough for most builds:

```html
<script type="module" src="/src/web-components/agid-address-element.ts"></script>
```

## Attributes

| Attribute | Meaning |
| --- | --- |
| `country-code` | Initial ISO 3166-1 alpha-2 country code. |
| `purpose` | `delivery`, `return`, `aid`, `identity`, or `customs`. |
| `mode` | `local`, `server`, `zk`, `ethereum`, or `full`. |
| `host-surface` | `ec`, `cms`, `pos`, `shopping-agent`, `registration`, or `custom`. |
| `selected-language` | Initial language tab. |
| `high-risk` | Enables high-risk handling and recipient proof next actions. |
| `qr` | Enables QR intake controls. |
| `nfc` | Enables NFC intake controls. |
| `agid-secure` | Treats AGID-S / commitment evidence as available. |
| `compact` | Uses a single-column compact layout. |

## Methods

```ts
const element = document.querySelector('agid-address-element');

element.setFields({
  countryCode: 'JP',
  postcode: '100-0005',
  city: 'Chiyoda'
});

element.setField('street', 'local-only user input');

const safeSession = element.getSession();
const safePublicDetail = element.getPublicDetail();

element.clear();
```

`getSession()` and `getPublicDetail()` return safe session-state objects. They
do not return the raw field values entered by the user.

## Events

Listen for high-level events:

```ts
const element = document.querySelector('agid-address-element');

element.addEventListener('agid-address-element:session-change', (event) => {
  console.log(event.detail.status);
  console.log(event.detail.readiness);
});

element.addEventListener('agid-address-element:submit', (event) => {
  // Use event.detail.intentId or readiness metadata to create/update an AddressIntent.
});
```

Supported event names:

- `agid-address-element:session-change`
- `agid-address-element:ready`
- `agid-address-element:needs-review`
- `agid-address-element:blocked`
- `agid-address-element:intent-preview`
- `agid-address-element:qr-nfc-requested`
- `agid-address-element:submit`

Every event uses the `web-component-no-raw-address` privacy boundary and includes
public events from `addressElementEvents`.

## Host Contract

Host applications should treat the component as an address-derived claims
element, not as a raw address exporter.

Allowed host uses:

- create or update an AddressIntent
- show ready / needs-review / blocked state
- request QR/NFC scan
- request recipient proof
- route partial states to review
- store session ID, intent ID, readiness metadata, commitments, and aliases

Forbidden host uses:

- storing raw address text from the element
- logging recipient names or phone numbers
- sending room/unit details to analytics
- placing raw AGID, AOID, AGID-S payload, or proof codes in public events
- using high-risk mode with public AGID display

## Verification

```bash
npm run verify:address-element-web-components
npm run verify:no-raw-address
```

This verifies the Web Component contract, no-raw public detail behavior, and the
existing Address Element event privacy model.
