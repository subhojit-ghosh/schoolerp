# Configurable Auth Delivery

## Goal

Separate auth token generation from outbound delivery so password reset and staff password-setup flows can support configurable email and SMS providers without changing auth domain logic.

## Scope

- Keep token generation, persistence, expiry, and single-use behavior in `AuthService`.
- Keep message composition for password reset/setup in the auth module.
- Move outbound transport selection into a reusable delivery module.
- Support config-driven provider selection per channel:
  - `log`
  - `disabled`
  - `webhook`

## Delivery Design

- `DeliveryModule` owns provider selection and channel dispatch.
- Email and SMS providers are resolved independently from environment config.
- `webhook` is the first generic integration point so external gateways can be connected without rewriting auth code.
- Password reset/setup delivery builds both:
  - reset URL
  - reset token text

## Non-Goals

- No vendor-specific SDK integration yet.
- No new notification business events yet.
- No frontend flow changes beyond preserving existing reset-token preview behavior.
