# Playlist Commerce Diagrams

This document prepares the visual explanation set for Playlist Commerce. The
goal is to make the concept understandable to developers, investors, merchants,
and internal product teams without overclaiming novelty.

Recommended wording:

- "playlist-centered commerce platform"
- "integrated architecture for commerce, identity, address, delivery, and travel"
- "new commerce experience built around purpose-based shopping lists"

Avoid unsupported wording such as "world first" until prior-art, patent, and
market research have been completed.

## 1. Service Relationship Diagram

Use this as the first slide. It shows that Playlist Commerce is not an isolated
wishlist feature. It is a commerce layer inside Address Identity Network.

```mermaid
flowchart TB
  AIN["Address Identity Network"]
  Wallet["Identity Wallet"]
  AddressLogin["Address Login"]
  TravelLogin["Travel Login"]
  Playlist["Playlist Commerce"]
  EC["EC Sites"]
  Brand["Brands"]
  Carrier["Carriers"]
  Payment["Payment"]
  User["User"]
  Gateway["Delivery Gateway"]
  Trade["Trade Gateway"]

  AIN --> Wallet
  AIN --> AddressLogin
  AIN --> TravelLogin
  Wallet --> Playlist
  AddressLogin --> Playlist
  TravelLogin --> Playlist
  Playlist --> EC
  Playlist --> Brand
  Playlist --> Payment
  Playlist --> Gateway
  Gateway --> Carrier
  Playlist --> Trade
  User --> Playlist
  User --> Wallet
```

## 2. Service Architecture Diagram

Use this for engineering and investor explanation. It separates user
experience, SDK/API surfaces, commerce surfaces, and delivery/identity layers.

```mermaid
flowchart LR
  subgraph UserSide["User Side"]
    User["User"]
    Mobile["Mobile App"]
    Web["Web App"]
    Wallet["Identity Wallet"]
  end

  subgraph Core["Playlist Commerce Core"]
    PlaylistService["Playlist Service"]
    SearchService["Search Service"]
    ProductService["Product Service"]
    RecoService["Recommendation Service"]
    CheckoutService["Checkout Orchestrator"]
    Analytics["Aggregate Analytics"]
  end

  subgraph IdentityLayer["Identity And Address Layer"]
    AddressLogin["Address Login"]
    TravelLogin["Travel Login"]
    Consent["Consent Envelope"]
    Proof["Proof Or Alias"]
  end

  subgraph External["External Systems"]
    EC["EC Sites"]
    Payment["Payment Provider"]
    Carrier["Carrier"]
    DeliveryGateway["Delivery Gateway"]
    DeveloperSDK["Developer SDK"]
    MerchantConsole["Merchant Console"]
  end

  User --> Mobile
  User --> Web
  Mobile --> Wallet
  Web --> Wallet
  Mobile --> PlaylistService
  Web --> PlaylistService
  PlaylistService --> SearchService
  PlaylistService --> ProductService
  PlaylistService --> RecoService
  PlaylistService --> CheckoutService
  CheckoutService --> AddressLogin
  CheckoutService --> TravelLogin
  AddressLogin --> Consent
  TravelLogin --> Consent
  Consent --> Proof
  CheckoutService --> EC
  CheckoutService --> Payment
  CheckoutService --> DeliveryGateway
  DeliveryGateway --> Carrier
  EC --> Analytics
  DeveloperSDK --> PlaylistService
  DeveloperSDK --> CheckoutService
  MerchantConsole --> Analytics
```

## 3. User Flow Diagram

Use this for product demos and onboarding. It explains the simplest path from
discovery to delivery.

```mermaid
flowchart TD
  Discover["Discover Product"]
  Save["Save To Playlist"]
  Compare["Compare And Organize"]
  Buy["Start Purchase"]
  Wallet["Approve In Identity Wallet"]
  AddressLogin["Address Login Returns Alias Or Proof"]
  Merchant["Merchant Receives Order Alias"]
  Carrier["Carrier Receives Scoped Handoff"]
  Delivery["Delivery"]
  Receipt["Receipt And Playlist Attribution"]

  Discover --> Save
  Save --> Compare
  Compare --> Buy
  Buy --> Wallet
  Wallet --> AddressLogin
  AddressLogin --> Merchant
  Merchant --> Carrier
  Carrier --> Delivery
  Delivery --> Receipt
```

## 4. EC Integration Diagram

Use this for merchant sales material. It shows that merchants can integrate
without replacing their existing EC stack.

```mermaid
flowchart LR
  Shopify["Shopify"]
  Woo["WooCommerce"]
  Magento["Magento"]
  EcCube["EC-CUBE"]
  Custom["Custom EC"]
  SDK["Playlist SDK"]
  APIs["Playlist Commerce APIs"]
  Console["Merchant Console"]
  Wallet["Identity Wallet"]
  AddressLogin["Address Login"]
  Checkout["No-Address Checkout"]

  Shopify --> SDK
  Woo --> SDK
  Magento --> SDK
  EcCube --> SDK
  Custom --> SDK
  SDK --> APIs
  APIs --> Console
  APIs --> Checkout
  Checkout --> Wallet
  Checkout --> AddressLogin
```

## 5. SDK And API Composition Diagram

Use this for developers. It shows the minimum public integration surface.

```mermaid
flowchart TB
  Dev["Developer"]
  ApiKey["API Key"]
  PlaylistSDK["Playlist SDK"]
  SearchAPI["Search API"]
  ProductAPI["Product API"]
  SaveAPI["Save API"]
  ShareAPI["Share API"]
  RecommendationAPI["Recommendation API"]
  CheckoutAPI["Checkout API"]
  WalletSDK["Identity Wallet SDK"]
  AddressSDK["Address Login SDK"]
  Webhook["Merchant Webhook"]

  Dev --> ApiKey
  ApiKey --> PlaylistSDK
  PlaylistSDK --> SearchAPI
  PlaylistSDK --> ProductAPI
  PlaylistSDK --> SaveAPI
  PlaylistSDK --> ShareAPI
  PlaylistSDK --> RecommendationAPI
  PlaylistSDK --> CheckoutAPI
  CheckoutAPI --> WalletSDK
  CheckoutAPI --> AddressSDK
  CheckoutAPI --> Webhook
```

## 6. Data Flow Diagram

Use this to explain what data moves through the system and where private data
must not be persisted.

```mermaid
flowchart TD
  ProductFeed["Product Feed Or Merchant Catalog"]
  ProductRef["Product Reference"]
  Playlist["Playlist"]
  Recommendation["Recommendation"]
  Checkout["Checkout Plan"]
  Consent["Wallet Consent"]
  Alias["Order Alias"]
  CarrierHandoff["Carrier Handoff Reference"]
  Delivery["Delivery Receipt"]
  Analytics["Aggregate Analytics"]

  ProductFeed --> ProductRef
  ProductRef --> Playlist
  Playlist --> Recommendation
  Playlist --> Checkout
  Recommendation --> Checkout
  Checkout --> Consent
  Consent --> Alias
  Alias --> CarrierHandoff
  CarrierHandoff --> Delivery
  Delivery --> Analytics
```

Private boundary:

```text
raw address, recipient phone, proof witness, private key, biometric template
must not be stored in Playlist Commerce public APIs or merchant analytics.
```

## 7. System Architecture Diagram

Use this for engineering planning. It is intentionally ordinary and practical.

```mermaid
flowchart TB
  subgraph Clients["Clients"]
    Web["Web"]
    IOS["iOS"]
    Android["Android"]
  end

  subgraph Edge["Edge Layer"]
    Gateway["API Gateway"]
    Auth["Auth"]
    RateLimit["Rate Limit"]
    Cache["Cache"]
  end

  subgraph Services["Services"]
    Search["Product Search"]
    Playlist["Playlist"]
    Checkout["Checkout"]
    Identity["Identity Connector"]
    Delivery["Delivery Connector"]
    Analytics["Analytics"]
  end

  subgraph Storage["Storage"]
    DB["Primary Database"]
    Index["Search Index"]
    Queue["Event Queue"]
    Audit["Audit Log"]
  end

  Web --> Gateway
  IOS --> Gateway
  Android --> Gateway
  Gateway --> Auth
  Gateway --> RateLimit
  Gateway --> Cache
  Gateway --> Search
  Gateway --> Playlist
  Gateway --> Checkout
  Checkout --> Identity
  Checkout --> Delivery
  Search --> Index
  Playlist --> DB
  Checkout --> Queue
  Queue --> Analytics
  Analytics --> DB
  Identity --> Audit
  Delivery --> Audit
```

## 8. Permission And Authentication Diagram

Use this to explain why Address Login and Identity Wallet are necessary.

```mermaid
sequenceDiagram
  participant User as User
  participant EC as EC Site
  participant PC as Playlist Commerce
  participant Wallet as Identity Wallet
  participant AL as Address Login
  participant Carrier as Carrier

  User->>EC: Select product from playlist
  EC->>PC: Create checkout request
  PC->>Wallet: Request purpose-bound consent
  Wallet->>User: Show permission screen
  User->>Wallet: Approve
  Wallet->>AL: Request address proof or carrier handoff
  AL-->>PC: Return subject alias and deliverability
  PC-->>EC: Return order alias
  AL-->>Carrier: Provide scoped handoff reference
```

## 9. Merchant Value Diagram

Use this for EC operators. It keeps the benefit chain simple.

```mermaid
flowchart TD
  SDK["SDK Integration"]
  Save["More Product Saves"]
  NoAddress["Reduced Address Entry"]
  LessDropoff["Lower Drop-Off"]
  CVR["Higher Conversion Rate"]
  Basket["More Bundles And Gifts"]
  Repeat["More Repeat Purchase"]
  Revenue["Revenue Growth"]
  Analytics["Playlist Analytics"]

  SDK --> Save
  SDK --> NoAddress
  NoAddress --> LessDropoff
  LessDropoff --> CVR
  Save --> Basket
  Basket --> Revenue
  CVR --> Revenue
  Save --> Repeat
  Repeat --> Revenue
  SDK --> Analytics
  Analytics --> Save
```

## 10. Developer Integration Diagram

Use this as a quickstart mental model.

```mermaid
flowchart TD
  Register["Register App"]
  ApiKey["Get API Key"]
  Install["Install SDK"]
  Render["Render Playlist Button Or Widget"]
  Save["Save Product"]
  Checkout["Start Checkout"]
  Wallet["Request Wallet Consent"]
  Webhook["Receive Webhook"]
  Test["Run Test Vectors"]

  Register --> ApiKey
  ApiKey --> Install
  Install --> Render
  Render --> Save
  Save --> Checkout
  Checkout --> Wallet
  Checkout --> Webhook
  Install --> Test
```

## 11. Novelty Positioning Diagram

This is useful when explaining why the project is not merely a wishlist.

```mermaid
quadrantChart
  title Playlist Commerce Positioning
  x-axis Low identity integration --> High identity integration
  y-axis Single merchant --> Cross-merchant
  quadrant-1 Integrated commerce infrastructure
  quadrant-2 Cross-merchant collection
  quadrant-3 Traditional wishlist
  quadrant-4 Merchant account checkout
  Traditional Wishlist: [0.20, 0.20]
  Single Store Cart: [0.75, 0.20]
  Social Shopping List: [0.40, 0.45]
  Cross-EC Price Search: [0.25, 0.75]
  Playlist Commerce: [0.88, 0.90]
```

Safe interpretation:

```text
The novelty is not "a playlist" alone.
The novelty is the integrated architecture:
cross-EC playlist + wallet consent + no-address checkout + gift/hotel delivery
+ developer SDK + merchant analytics.
```

## 12. Slide Order Recommendation

For investors:

1. Service Relationship Diagram
2. User Flow Diagram
3. Merchant Value Diagram
4. Service Architecture Diagram
5. Novelty Positioning Diagram

For EC operators:

1. EC Integration Diagram
2. User Flow Diagram
3. Merchant Value Diagram
4. Data Flow Diagram
5. Permission And Authentication Diagram

For developers:

1. SDK And API Composition Diagram
2. Developer Integration Diagram
3. System Architecture Diagram
4. Data Flow Diagram
5. Permission And Authentication Diagram

## 13. Implementation Coverage Table

This table keeps the diagram deck connected to the tested widget, SDK
contracts, checkout fixture, webhook fixtures, and safe non-claim boundaries.
When a diagram is changed, update the corresponding implementation evidence
instead of letting the slide become a standalone claim.

| Diagram | Primary reader | Widget evidence | Executable evidence | Non-claim boundary |
| --- | --- | --- | --- | --- |
| Service Relationship Diagram | investor | Read by role, Investor view, Capabilities | 20 executable capabilities, capability graph | Do not claim a standalone world-first playlist service. |
| Service Architecture Diagram | operator | Flow, Wallet, Carrier, Webhook | checkout orchestrator fixture, signed merchant webhook fixtures | Do not claim payment, carrier, or marketplace ownership. |
| User Flow Diagram | merchant | Playlist to no-address checkout, Checkout, Merchant visibility | order_alias_pc_checkout_self_delivery_001, handoff_pc_checkout_self_delivery_001 | Do not expose or imply merchant-visible raw address data. |
| EC Integration Diagram | merchant | Merchant view, No-address checkout response, Aggregate merchant analytics | playlist.product_saved, playlist.shared, checkout.alias_created, delivery.receipt_created, analytics.aggregate_ready | Do not claim merchants must replace their existing EC stack. |
| SDK And API Composition Diagram | developer | Developer view, Developer method surface, Public SDK quickstart | createPlaylist, saveProduct, sharePlaylist, searchProducts, getRecommendations, listHistory, startCheckout, verifyWebhook, listCapabilities, buildTestVectors | Do not accept private address, witness, or key material in public SDK methods. |
| Data Flow Diagram | operator | Privacy boundary, Contract JSON, blocked:, raw_address | raw_address, recipient_phone, carrier_decryptable_address, proof_witness, private_key, biometric_template, room_number, passport_data | Do not persist private address, proof witness, biometric, or private-key material. |
| System Architecture Diagram | operator | Webhook, Contract JSON, checkout fixture valid | accepted, order_alias_pc_checkout_self_delivery_001, evt_pc_saved_001, evt_pc_shared_001, evt_pc_checkout_001, evt_pc_delivery_001, evt_pc_analytics_001 | Do not imply production traffic, payment processing, or carrier API execution in the demo. |
| Permission And Authentication Diagram | developer | no raw address SDK, consentEnvelopeRef, Privacy boundary | consent_pc_checkout_self_delivery_001, subject_alias_user_alias_demo_001, raw_address, recipient_phone, carrier_decryptable_address, proof_witness, private_key, biometric_template, room_number, passport_data | Do not expose passkeys, witnesses, private keys, biometrics, or raw address payloads. |
| Merchant Value Diagram | merchant | Merchant view, Aggregate merchant analytics, No-address checkout response | 10 API surfaces, playlist.product_saved, playlist.shared, checkout.alias_created, delivery.receipt_created, analytics.aggregate_ready | Do not promise conversion lift, revenue growth, or merchant analytics beyond aggregate demo signals. |
| Developer Integration Diagram | developer | Developer method surface, Public SDK quickstart, webhook verification | createPlaylist, saveProduct, sharePlaylist, searchProducts, getRecommendations, listHistory, startCheckout, verifyWebhook, listCapabilities, buildTestVectors | Do not require production API keys, live payments, or raw address payloads for local test vectors. |
| Novelty Positioning Diagram | investor | Read by role, Investor view, Merchant view, Developer view | not-full-marketplace, not-payment-processor, not-price-guarantee, not-raw-address-store, not-scraping-default | Do not use unsupported world-first claims before prior-art, patent, and market review. |
| Slide Order Recommendation | operator | Read by role, Investor view, Merchant view, Developer view | 20 executable capabilities, 10 API surfaces, 10 public SDK methods | Do not reuse one audience narrative for investors, merchants, and developers without checking evidence. |
