# Licensing

OpenMausBot is open source. There are no license keys, no registrations and no
sign-up gates anywhere in the product: every feature runs for everyone, in
development and in production alike.

## Main repository: Apache License 2.0

Everything outside `enterprise/` is licensed under the
[Apache License 2.0](LICENSE).

## `enterprise/`

Everything under `enterprise/` is covered by its own
[license](enterprise/LICENSE), which is free in the same practical sense: you
may run, modify, replicate and redistribute it, host it for third parties or
white-label it, and no license key is required to run or enable its features
in any environment, including production. `register()` grants every feature
unconditionally (`customer: "everyone"`, `expiresAt: null`); the list of
entitlement ids the server understands is exported as `FEATURES` from
[`enterprise/server/index.ts`](enterprise/server/index.ts).

Delete the folder and what remains is the open-source edition: the server
reports `{"edition":"oss"}` and ordinary standalone operation is unchanged. A
workspace explicitly configured for hosted sign-in still refuses remote access
without that optional adapter; removing the enterprise layer must not bypass
its configured sign-in authority. The `open-source edition builds without
enterprise/` CI job proves the OSS build, boot response and absent adapter
factory; it does not exercise every hosted HTTP route. The isolated hosted
workspace tests verify those sign-in and revocation paths separately.

The routing rule for new work: could any open-source user want it? Then it
goes in core, as a public pull request. Organisation-, admin- or tier-flavoured?
Then it lives in `enterprise/` — still free, still keyless. Customer-specific
brand, skills, packages or connectors belong in that customer's own repository
as data and configuration, never as a fork.

## Contributions

- Outside `enterprise/`: contribute under Apache 2.0. No DCO sign-off or CLA is
  required. Submit only code you wrote or have the right to contribute.
- Inside `enterprise/`: sign the [Contributor License Agreement](CLA.md) once,
  by commenting on your pull request. It lets the project keep that folder
  under its own license while still accepting your work.
- The open-core boundary, the cloud seam and this file are covered by
  [`CODEOWNERS`](.github/CODEOWNERS): a maintainer reviews changes there.

## Third-party components and trademarks

Bundled third-party software keeps its own licenses; notices, license texts,
source locations and the SBOM are listed in [NOTICE](NOTICE) and
[`third_party/`](third_party/). The OpenMausBot and MausBot names and the
mascot are trademarks of Supamaus Software Private Limited; the Apache License
does not grant trademark rights (section 6), so a product built on OpenMausBot
needs its own name unless the trademark owner grants permission in writing.
