# Decimen Optical Transfer (extended): fountain-coded QR file transfer

Send a file between two devices using nothing but a **screen and a camera**.
One page displays the file as an endless stream of animated QR codes; another
device points its camera at it and reconstructs the file. **No network path
between the devices, no app, no pairing, no permissions beyond the camera.**
The payload travels as light.

## Try it

### **→ [pythonisfast.github.io/decimen-optical-transfer-extended](https://pythonisfast.github.io/decimen-optical-transfer-extended/)**

Open it on both devices and go — nothing to install. Works offline after the
first visit, and installs as an app on both iOS and Android if you want it on
a home screen.

Straight to a page: **[send](https://pythonisfast.github.io/decimen-optical-transfer-extended/send/)**
· **[receive](https://pythonisfast.github.io/decimen-optical-transfer-extended/receive/)**

Any file — up to 64 MB in a single stream, larger files split into verified
segments — or a pasted text snippet. Filename and media type preserved, gzip
only when it helps, SHA-256 verified before anything is offered — and received
video plays right in the page. Expect hundreds of KB/s screen to camera,
depending on the two devices and the light.

<p align="center">
  <img src="docs/receiving.jpg" width="420"
       alt="Phone receiving a file over light: 130.5 KB/s goodput, halfway through decoding the sender's animated QR stream" />
</p>
<p align="center"><em>Mid-transfer: a phone pulling a file out of the air at 130 KB/s.</em></p>

Neither mode is encrypted: whatever is on the sending screen is readable by
any camera pointed at it. The property this gives you is no network, not
confidentiality — see [privacy](docs/user/privacy.md).

## What this fork adds

This is an extended fork of [bashalarmistalt/decimen-optical-transfer](https://github.com/bashalarmistalt/decimen-optical-transfer).

**Segmented large-file transfer.** One stream numbers its source blocks in 16
bits, so a big file cannot fit in a single stream however the size limit is
set. Above 64 MB the sender now splits the file into segments of at most 16
MiB and streams them in turn, cycling until the receiver has them all. Each
segment carries its own SHA-256 plus the hash of the whole file; the receiver
verifies every segment as it lands, tolerates any arrival order, ignores
repeats, and verifies the reassembled file before offering it. Segments gzip
on the same terms as a single-stream file. Details in
[protocol](docs/technical/protocol.md).

The fork also drops the upstream project's CLA, funding config, release
workflow, demo mode and benchmark rig — none of which apply here. It publishes
no benchmark records of its own, so the speed figures above are deliberately
unquantified.

## Documentation

**Using it** — [quick start](docs/user/quick-start.md) ·
[sending](docs/user/sending.md) · [receiving](docs/user/receiving.md) ·
[troubleshooting](docs/user/troubleshooting.md) ·
[install & offline](docs/user/install-and-offline.md) ·
[privacy](docs/user/privacy.md)

**How it's built** — [architecture](docs/technical/architecture.md) ·
[protocol](docs/technical/protocol.md) ·
[platform quirks](docs/technical/platform-quirks.md) ·
[build & deploy](docs/technical/build-and-release.md) ·
[diagnostics](docs/technical/diagnostics.md)

The short version of the protocol: a screen-to-camera link has no
back-channel, so the sender streams fountain-coded frames ([Luby
transform](https://en.wikipedia.org/wiki/Luby_transform_code)) — the receiver
collects *any* ~K·1.15 distinct frames in any order and peels the file out.
Dropped frames cost time, never correctness.

## Run it yourself

```bash
npm install
npm run dev               # https dev server with HMR
npm run serve             # build, then serve the production bundle
npm run diagnostics       # dev server + per-transfer run reports in the terminal
npm test                  # golden wire-format vectors and unit tests
npm run build             # the hosted site → dist/
npm run build:standalone  # both self-contained pages → dist-standalone/
npm run build:all         # everything
```

Open `https://localhost:5173/send/` on the sending device and the printed
`Network` URL on the receiving phone (accept the self-signed certificate
once). Walkthrough: [quick start](docs/user/quick-start.md).

## Deployment

`.github/workflows/pages.yml` publishes `dist/` to GitHub Pages on every push
to `main`. It passes the deployment's own address in as `VITE_SITE_URL`, so
the canonical links, social-card URLs and — the one that actually matters —
the sender's **share receiver link** all point at this site rather than
anywhere else. Building without that variable falls back to the same URL, so a
local build advertises the same place a deployed one does.

The site builds with `base: "./"` and therefore works under a project subpath
with no configuration.

## Similar projects

The concept here was arrived at independently by the original author. It turns
out several people have had similar ideas, and their takes are all worth a
look:

- [mohankumarelec/airgapped-qr-code-transfer](https://github.com/mohankumarelec/airgapped-qr-code-transfer):
  browser-based QR file transfer with compression and sequential chunking.
- [divan/txqr](https://github.com/divan/txqr) (2018): animated QR plus
  fountain codes in Go, with two excellent write-ups on why fountain coding
  beats sequential looping.
- [sz3/libcimbar](https://github.com/sz3/libcimbar): goes past QR entirely
  with a custom high-density color code purpose-built for this channel.

## Credits

Originally built by [Evan Crawley (Bash Alarmist)](https://www.linkedin.com/in/evan-crawley),
with [node-qrcode](https://github.com/soldair/node-qrcode) and
[decimen-codec](https://github.com/bashalarmistalt/decimen-codec), a custom
[zxing-cpp](https://github.com/zxing-cpp/zxing-cpp) build. This fork is
maintained by [pythonIsFast](https://github.com/pythonIsFast).

## License

[AGPL-3.0-or-later](LICENSE), as of v0.4.0. Releases up to and including
v0.3.0 were MIT-licensed and remain available under those terms.

Because this is the AGPL and not the GPL, running the software over a network
counts: anyone who uses the site above is entitled to the source of the exact
version serving them, which is what this repository is.

Portions were contributed under MIT, and the vendored
[decimen-codec](https://github.com/bashalarmistalt/decimen-codec) decoder
(AGPL-3.0-or-later) incorporates
[zxing-cpp](https://github.com/zxing-cpp/zxing-cpp) under Apache-2.0 — see
[NOTICE](NOTICE).
