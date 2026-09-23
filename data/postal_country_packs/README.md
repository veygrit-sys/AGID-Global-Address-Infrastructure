# AGID Postal Country Packs

Version: agid-postal-country-pack-v0.1
Country pack count: 78

This directory contains draft AGID Postal Country Packs for target countries
across mature postal systems, weak postal systems, no-postal countries, and
supplemental AGID postal-zone design. These packs are safe OSS planning
artifacts, not official postal authority datasets.

## Countries

- AE: United Arab Emirates (agid-postal-pack-ae)
- AF: Afghanistan (agid-postal-pack-af)
- AG: Antigua and Barbuda (agid-postal-pack-ag)
- AO: Angola (agid-postal-pack-ao)
- AW: Aruba (agid-postal-pack-aw)
- BD: Bangladesh (agid-postal-pack-bd)
- BF: Burkina Faso (agid-postal-pack-bf)
- BH: Bahrain (agid-postal-pack-bh)
- BI: Burundi (agid-postal-pack-bi)
- BJ: Benin (agid-postal-pack-bj)
- BO: Bolivia (agid-postal-pack-bo)
- BS: Bahamas (agid-postal-pack-bs)
- BW: Botswana (agid-postal-pack-bw)
- BZ: Belize (agid-postal-pack-bz)
- CD: DR Congo (agid-postal-pack-cd)
- CF: Central African Republic (agid-postal-pack-cf)
- CG: Congo (Republic) (agid-postal-pack-cg)
- CI: Cote d'Ivoire (agid-postal-pack-ci)
- CK: Cook Islands (agid-postal-pack-ck)
- CM: Cameroon (agid-postal-pack-cm)
- CW: Curacao (agid-postal-pack-cw)
- DM: Dominica (agid-postal-pack-dm)
- ER: Eritrea (agid-postal-pack-er)
- ET: Ethiopia (agid-postal-pack-et)
- FJ: Fiji (agid-postal-pack-fj)
- GA: Gabon (agid-postal-pack-ga)
- GD: Grenada (agid-postal-pack-gd)
- GH: Ghana (agid-postal-pack-gh)
- GM: Gambia (agid-postal-pack-gm)
- GQ: Equatorial Guinea (agid-postal-pack-gq)
- HK: Hong Kong (agid-postal-pack-hk)
- IE: Ireland (agid-postal-pack-ie)
- IN: India (agid-postal-pack-in)
- JM: Jamaica (agid-postal-pack-jm)
- JP: Japan (agid-postal-pack-jp)
- KE: Kenya (agid-postal-pack-ke)
- KH: Cambodia (agid-postal-pack-kh)
- KI: Kiribati (agid-postal-pack-ki)
- KM: Comoros (agid-postal-pack-km)
- KP: Korea (Democratic People's Republic) (agid-postal-pack-kp)
- LA: Laos (agid-postal-pack-la)
- LC: Saint Lucia (agid-postal-pack-lc)
- LY: Libya (agid-postal-pack-ly)
- ML: Mali (agid-postal-pack-ml)
- MM: Myanmar (agid-postal-pack-mm)
- MO: Macao (agid-postal-pack-mo)
- MR: Mauritania (agid-postal-pack-mr)
- NG: Nigeria (agid-postal-pack-ng)
- NP: Nepal (agid-postal-pack-np)
- NR: Nauru (agid-postal-pack-nr)
- PG: Papua New Guinea (agid-postal-pack-pg)
- PH: Philippines (agid-postal-pack-ph)
- PK: Pakistan (agid-postal-pack-pk)
- QA: Qatar (agid-postal-pack-qa)
- RW: Rwanda (agid-postal-pack-rw)
- SB: Solomon Islands (agid-postal-pack-sb)
- SC: Seychelles (agid-postal-pack-sc)
- SL: Sierra Leone (agid-postal-pack-sl)
- SO: Somalia (agid-postal-pack-so)
- SR: Suriname (agid-postal-pack-sr)
- SS: South Sudan (agid-postal-pack-ss)
- ST: Sao Tome and Principe (agid-postal-pack-st)
- SX: Sint Maarten (agid-postal-pack-sx)
- SY: Syria (agid-postal-pack-sy)
- TD: Chad (agid-postal-pack-td)
- TG: Togo (agid-postal-pack-tg)
- TK: Tokelau (agid-postal-pack-tk)
- TO: Tonga (agid-postal-pack-to)
- TV: Tuvalu (agid-postal-pack-tv)
- TZ: Tanzania (agid-postal-pack-tz)
- UG: Uganda (agid-postal-pack-ug)
- US: United States (agid-postal-pack-us)
- VN: Vietnam (agid-postal-pack-vn)
- VU: Vanuatu (agid-postal-pack-vu)
- WS: Samoa (agid-postal-pack-ws)
- YE: Yemen (agid-postal-pack-ye)
- ZM: Zambia (agid-postal-pack-zm)
- ZW: Zimbabwe (agid-postal-pack-zw)

## Safety Contract

- Packs contain generated metadata, source slots, stable locality IDs, VPL
  seeds, and conformance vectors.
- Packs do not contain personal addresses, recipient names, phone numbers,
  private AOID bodies, AGID-S payloads, proof codes, or raw third-party data.
- Generated codes remain simulation or draft until official authority, carrier
  pilot, privacy, data-trust, and transition gates are satisfied.
- Mature postal countries are stored as reference packs for source metadata,
  validation compatibility, conformance tests, and AGID interoperability; they
  must not claim to replace official postal codes.

## Regenerate

```bash
npm run export:postal-country-pack:all
```
